enum ApprovalStatusFilter {
    Ranked = 1,
    Loved = 2,
    Both = 3,
}

enum RulesetFilter {
    Converted = 1,
    Specific = 2,
    Both = 3,
}

enum LocalDataFilter {
    NoFiltering = 0,
    Unplayed = 1,
    Played = 2,
    NoData = 3,
    HasData = 4,
    HasDataUnplayed = 5,
}

interface BeatmapFilterMap {
    status: ApprovalStatusFilter,
    ruleset: RulesetFilter,
    query: QueryExpression,
    localdata: LocalDataFilter,
}

interface FilterChangeEvent {
    kind: 'filter',
    key: keyof BeatmapFilterMap,
    value: string,
}

interface ModsChangeEvent {
    kind: 'mods',
    value: string,
}

class QueryExpression {
    public normalizedSource: string = '';
    public readonly requiredMods: Set<Mods> = new Set();

    private readonly displayTextMatches: string[] = [];
    private readonly matchFuncs: ((info: BeatmapInfo) => boolean)[] = [];

    public parse(text: string) {
        this.displayTextMatches.length = 0;
        this.matchFuncs.length = 0;
        this.requiredMods.clear();
        const normalized = [];

        for (const part of text.split(' ')) {
            if (part.length === 0) continue;

            const binRelMatch = part.match(/^(\w+)(==?|!=|<=?|>=?)(.+)$/);
            if (binRelMatch !== null) {
                const key = binRelMatch[1].toLowerCase().replace(/-/g, '_');
                const [keyFunc, requiredMods] = QueryExpression.getBeatmapFilterKeyFunc(key);

                const binRel = binRelMatch[2] === '==' ? '=' : binRelMatch[2];
                const binRelFunc = QueryExpression.getNumberBinRelFunc(binRel);
                const number = parseFloat(binRelMatch[3]);

                if (keyFunc !== null && binRelFunc !== null && !Number.isNaN(number)) {
                    this.matchFuncs.push(info => binRelFunc(keyFunc(info), number));
                    normalized.push(`${key}${binRel}${number}`);

                    if (requiredMods !== null) {
                        this.requiredMods.add(requiredMods);
                    }
                    continue;
                }
            }

            const text = part.toLowerCase();
            normalized.push(text);
            this.displayTextMatches.push(text);
        }

        this.normalizedSource = normalized.join(' ');
    }

    public match(info: BeatmapInfo): boolean {
        for (const text of this.displayTextMatches) {
            if (!info.meta.displayStringLowerCased.includes(text))
                return false;
        }

        for (const func of this.matchFuncs) {
            if (!func(info))
                return false;
        }

        return true;
    }

    public static getBeatmapFilterKeyFunc(key: string): [((info: BeatmapInfo) => number) | null, Mods | null] {
        const now = Date.now();

        switch (key) {
            case 'status':
                return [info => info.meta.approvalStatus, null];
            case 'mode':
                return [info => info.meta.rulesetId, null];
            case 'date':
                return [info => (now - info.meta.approvedDate.valueOf()) / 86400e3, null];
            case 'has':
                return [info => info.localDataInfo !== null ? 1 : 0, null];
            case 'unplayed':
                return [info => info.localDataInfo?.hasAnyInfo ? 0 : 1, null];
            case 'played':
                return [info => {
                    if (info.localDataInfo === null)
                        return Number.POSITIVE_INFINITY;
                    return (now - info.localDataInfo.lastPlayedDate.valueOf()) / 86400e3;
                }, null];
            case 'rank':
                return [info => info.localDataInfo?.rankAchived ?? 10, null];
        }

        {
            const func = QueryExpression.getPerModsFilterKeyFunc(key);
            if (func !== null) {
                return [info => func(info.currentMods), null];
            }
        }

        const prefix = Object.keys(QueryExpression.MODS_PREFIX).find(prefix => key.startsWith(prefix + '_'));
        if (prefix !== undefined) {
            const mods = QueryExpression.MODS_PREFIX[prefix] as (Mods | -1);
            const func = QueryExpression.getPerModsFilterKeyFunc(key.slice(prefix.length + 1));
            if (func !== null) {
                if (mods === -1) {
                    return [info => func(info.anyMods), null];
                } else {
                    return [info => func(info.perMods.get(mods)!), mods];
                }
            }
        }

        return [null, null];
    }

    public static getPerModsFilterKeyFunc(key: string): ((perModsInfo: PerModsInfo) => number) | null {
        switch (key) {
            case 'stars':
                return info => info.stars;
            case 'pp':
                return info => info.performancePoint;
            case 'length':
                return info => info.hitLength;
            case 'ar':
                return info => info.approachRate;
            case 'cs':
                return info => info.circleSize;
            case 'fc':
                return info => info.fcCount;
            case 'miss':
                return info => -info.fcCount;
            case 'fcmods':
                return info => info.fcMods;
            case 'hdfc':
                return info => info.fcMods & (FCMods.HD | FCMods.HDFL) ? 1 : 0;
            case 'flfc':
                return info => info.fcMods & (FCMods.HD | FCMods.HDFL) ? 1 : 0;
            default:
                return null;
        }
    }

    public static getNumberBinRelFunc(binRel: string): ((x: number, y: number) => boolean) | null {
        switch (binRel) {
            case '=':
                return (x, y) => x === y;
            case '!=':
                return (x, y) => x !== y;
            case '<':
                return (x, y) => x < y;
            case '<=':
                return (x, y) => x <= y;
            case '>':
                return (x, y) => x > y;
            case '>=':
                return (x, y) => x >= y;
            default:
                return null;
        }
    }

    private static readonly MODS_PREFIX: Record<string, Mods | -1> = {
        any: -1,
        nm: 0,
        ez: 2,
        hr: 16,
        dt: 64,
        ezdt: 66,
        hrdt: 80,
        ht: 256,
        ezht: 258,
        hrht: 272,
    };
}

class BeatmapFilterer {
    public readonly filters: BeatmapFilterMap;
    public readonly normalizedSource = new ValueChange<string>('', true);

    public constructor() {
        this.filters = {
            status: ApprovalStatusFilter.Both,
            ruleset: RulesetFilter.Both,
            query: new QueryExpression(),
            localdata: LocalDataFilter.NoFiltering,
        };
    }

    public filter(beatmaps: BeatmapInfo[]): BeatmapInfo[] {
        const filters = this.filters;

        return beatmaps.filter(info => {
            if (!BeatmapFilterer.filterStatus(info.meta.approvalStatus, filters.status))
                return false;

            if (!BeatmapFilterer.filterRuleset(info.meta.rulesetId, filters.ruleset))
                return false;

            if (!filters.query.match(info))
                return false;

            if (!BeatmapFilterer.filterLocalData(info.localDataInfo, filters.localdata))
                return false;

            return true;
        });
    }

    public setValue(key: keyof BeatmapFilterMap, value: string) {
        switch (key) {
            case 'status':
                this.filters.status = [ApprovalStatusFilter.Ranked, ApprovalStatusFilter.Loved].find(x => x.toString() === value) ?? ApprovalStatusFilter.Both;
                break;

            case 'ruleset':
                this.filters.ruleset = [RulesetFilter.Converted, RulesetFilter.Specific].find(x => x.toString() === value) ?? RulesetFilter.Both;
                break;

            case 'query':
                this.filters.query.parse(value);
                this.normalizedSource.set(this.filters.query.normalizedSource);
                break;

            case 'localdata':
                this.filters.localdata = [
                    LocalDataFilter.Unplayed, LocalDataFilter.Played,
                    LocalDataFilter.HasData, LocalDataFilter.NoData, LocalDataFilter.HasDataUnplayed
                ].find(x => x.toString() === value) ?? LocalDataFilter.NoFiltering;
                break;
        }
    }

    public static filterStatus(status: ApprovalStatus, filter: ApprovalStatusFilter): boolean {
        if (status === ApprovalStatus.LOVED)
            return filter !== ApprovalStatusFilter.Ranked;
        else
            return filter !== ApprovalStatusFilter.Loved;
    }

    public static filterRuleset(ruleset: RulesetId, filter: RulesetFilter): boolean {
        if (ruleset === RulesetId.OSU)
            return filter !== RulesetFilter.Specific;
        else
            return filter !== RulesetFilter.Converted;
    }

    public static filterLocalData(info: LocalDataInfo | null, filter: LocalDataFilter): boolean {
        switch (filter) {
            case LocalDataFilter.NoFiltering:
                return true;

            case LocalDataFilter.NoData:
                return info === null;

            case LocalDataFilter.HasData:
                return info !== null;

            case LocalDataFilter.Played:
                return info?.hasAnyInfo === true;

            case LocalDataFilter.Unplayed:
                return info?.hasAnyInfo !== true;

            case LocalDataFilter.HasDataUnplayed:
                return info?.hasAnyInfo === false;
        }
    }
}

class BeatmapFilterTab {
    public readonly filterer: BeatmapFilterer = new BeatmapFilterer();

    public mods: Mods | -1 = -1;
    public endIndex: number = 0;
    public filteredCount: number = 0;

    public readonly startIndex: ValueChange<number> = new ValueChange(0, true);
    public readonly pagePerCount: ValueChange<number> = new ValueChange(0, true);

    public constructor(
        private readonly eventSink: EventSink<FilterChangeEvent | ModsChangeEvent | StartIndexChangeEvent | PerPageCountChangeEvent>
    ) {
    }

    public initialize(div: Element) {
        const row = div.children[0];
        assertElement(row, 'div');

        this.onSelectChanged('status', row.children[0].children[1]);
        this.onSelectChanged('ruleset', row.children[1].children[1]);

        const lastColumn = row.children[5].children[0];

        this.onInputChanged('start', lastColumn.children[2]);
        this.onInputChanged('per_page_count', lastColumn.children[6]);
    }

    public renderTo(div: Element) {
        const row = div.children[0];
        assertElement(row, 'div');

        this.renderSelect('status', row.children[0].children[1]);
        this.renderSelect('ruleset', row.children[1].children[1]);
        this.renderInput('query', this.filterer.normalizedSource, row.children[2].children[1]);
        this.renderSelect('mods', row.children[3].children[1]);
        this.renderSelect('localdata', row.children[4].children[1]);

        const lastColumn = row.children[5].children[0];

        this.renderInput('start', this.startIndex, lastColumn.children[2]);
        this.renderEndIndex(lastColumn.children[3]);
        this.renderFilteredCount(lastColumn.children[4]);
        this.renderInput('per_page_count', this.pagePerCount, lastColumn.children[6]);
    }

    public processEvent(event: FilterChangeEvent) {
        this.filterer.setValue(event.key, event.value);
    }

    private onSelectChanged(key: keyof BeatmapFilterMap | 'mods', select: Element) {
        assertElement<HTMLSelectElement>(select, 'select');

        if (key === 'mods') {
            this.eventSink.trigger({ kind: 'mods', value: select.value });
        } else {
            this.eventSink.trigger({ kind: 'filter', key, value: select.value });
        }
    }

    private onInputChanged(kind: 'start' | 'per_page_count' | 'query', input: Element) {
        assertElement<HTMLInputElement>(input, 'input');

        if (kind === 'query') {
            this.eventSink.trigger({ kind: 'filter', key: kind, value: input.value });
        } else {
            this.eventSink.trigger({ kind, value: input.value });
        }
    }

    private renderSelect(key: keyof BeatmapFilterMap | 'mods', select: Element) {
        assertElement<HTMLSelectElement>(select, 'select');

        if (select.onchange === null) {
            select.onchange = () => this.onSelectChanged(key, select);
            this.eventSink.registerStopCallback(() => select.onchange = null);
        }

        if (key === 'mods') {
            select.value = this.mods.toString();
        } else {
            select.value = this.filterer.filters[key].toString();
        }
    }

    private renderEndIndex(span: Element) {
        span.textContent = this.endIndex.toString();
    }

    private renderFilteredCount(span: Element) {
        span.textContent = `${this.filteredCount} maps`;
    }

    private renderInput(kind: 'start' | 'per_page_count' | 'query', valueChange: ValueChange<number | string>, input: Element) {
        assertElement<HTMLInputElement>(input, 'input');

        if (input.oninput === null) {
            input.oninput = () => this.onInputChanged(kind, input);
            this.eventSink.registerStopCallback(() => input.oninput = null);
        }

        if (valueChange.pop()) {
            input.value = valueChange.get().toString();
        }
    }
}
