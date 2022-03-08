type BeatmapSortKey = 'date' | 'title' | 'stars' | 'pp' | 'length' | 'combo' | 'ar' | 'cs' | 'fc_count' | 'fc_mods' | 'localdata';
type SortDirection = 'asc' | 'desc';

interface SortRequestEvent {
    kind: 'sort',
    key: BeatmapSortKey,
    currentDirection: SortDirection | undefined,
};

interface SortOrderChangeEvent {
    kind: 'sort_order',
    order: [BeatmapSortKey, SortDirection][],
};

class BeatmapSorter {
    public readonly order: [BeatmapSortKey, SortDirection][] = [];

    public clear() {
        this.order.length = 0;
    }

    public requestSort(key: BeatmapSortKey, currentDirection: SortDirection | undefined) {
        const direction = currentDirection === 'asc' ? 'desc' :
            currentDirection === 'desc' ? 'asc' : BeatmapSorter.SORT_FIRST_DIRECTION[key];
        this.push(key, direction);
    }

    public push(key: BeatmapSortKey, direction: SortDirection) {
        if (BeatmapSorter.SORT_KEY_CLEAR_OTHER[key]) {
            this.order.length = 0;
        }
        const existing = this.order.findIndex((x) => x[0] === key);
        if (existing !== -1) {
            this.order.splice(existing, 1);
        }
        if (this.order.length === 0 && key === BeatmapSorter.DEFAULT_KEY && direction === BeatmapSorter.DEFAULT_DIRECTION) {
            return;
        }
        this.order.push([key, direction]);
    }

    public getLastKeyDirection(): [BeatmapSortKey, SortDirection] | null {
        if (this.order.length === 0)
            return [BeatmapSorter.DEFAULT_KEY, BeatmapSorter.DEFAULT_DIRECTION];
        return this.order[this.order.length - 1];
    }

    public sort(beatmaps: BeatmapInfo[], getKeyFunc: (key: BeatmapSortKey) => ((info: BeatmapInfo) => number | string)) {
        for (let i = -1; i < this.order.length; i += 1) {
            const key = i === -1 ? BeatmapSorter.DEFAULT_KEY : this.order[i][0];
            const direction = i === -1 ? BeatmapSorter.DEFAULT_DIRECTION : this.order[i][1];
            const keyFunc = getKeyFunc(key);
            const sign = direction === 'asc' ? -1 : 1;
            beatmaps.sort((a, b) => {
                const fa = keyFunc(a);
                const fb = keyFunc(b);
                return fa === fb ? 0 : fa < fb ? sign : -sign;
            });
        }
    }

    public static getBeatmapSortKeyFunc(key: BeatmapSortKey): (info: BeatmapInfo) => number | string {
        switch (key) {
            case 'date':
                return info => info.meta.approvedDateString;
            case 'title':
                return info => info.meta.displayStringLowerCased;
            case 'stars':
                return info => info.currentMods.stars;
            case 'length':
                return info => info.meta.hitLength;
            case 'combo':
                return info => info.meta.maxCombo;
            case 'ar':
                return info => info.currentMods.approachRate;
            case 'cs':
                return info => info.currentMods.circleSize;
            case 'pp':
                return info => info.currentMods.performancePoint;
            case 'fc_count':
                return info => info.currentMods.fcCount;
            case 'fc_mods':
                return info => info.currentMods.fcMods;
            case 'localdata':
                return info => info.localDataInfo?.lastPlayedDate.valueOf() ?? Number.NEGATIVE_INFINITY;
        }
    }

    private static readonly SORT_FIRST_DIRECTION: Record<BeatmapSortKey, SortDirection> = {
        date: 'desc',
        title: 'asc',
        stars: 'desc',
        pp: 'desc',
        length: 'asc',
        combo: 'asc',
        ar: 'asc',
        cs: 'asc',
        fc_count: 'desc',
        fc_mods: 'desc',
        localdata: 'desc',
    };

    private static readonly SORT_KEY_CLEAR_OTHER: Partial<Record<BeatmapSortKey, true>> = {
        date: true,
        title: true,
        stars: true,
        pp: true,
    };

    private static readonly DEFAULT_KEY = 'date' as const;
    private static readonly DEFAULT_DIRECTION = 'desc' as const;
}

class SummaryTableHeader {
    public readonly sorter = new BeatmapSorter();

    public constructor(private readonly eventSink: EventSink<SortRequestEvent>) {
    }

    public renderTo(thead: Element) {
        assertElement(thead, 'thead');

        const tr = thead.children[0];

        this.renderHeader('date', tr.children[0]);
        this.renderHeader('title', tr.children[1]);
        this.renderHeader('stars', tr.children[2]);
        this.renderHeader('pp', tr.children[3]);
        this.renderHeader('length', tr.children[4]);
        this.renderHeader('combo', tr.children[5]);
        this.renderHeader('ar', tr.children[6]);
        this.renderHeader('cs', tr.children[7]);
        this.renderHeader('fc_count', tr.children[8]);
        this.renderHeader('fc_mods', tr.children[9]);
        this.renderHeader('localdata', tr.children[10]);
    }

    private renderHeader<K extends BeatmapSortKey>(key: K, element: Element) {
        assertElement<HTMLElement>(element, 'th');

        if (element.onclick === null) {
            element.onclick = () => {
                this.eventSink.trigger({
                    kind: 'sort',
                    key,
                    currentDirection: this.getCurrentDirection(key)
                });
            };
            this.eventSink.registerStopCallback(() => {
                element.onclick = null
            });
        }

        const status = this.getCurrentDirection(key);
        element.classList.toggle('sorted', status !== undefined);
        element.classList.toggle('ascending', status === 'asc');
        element.classList.toggle('descending', status === 'desc');
    }

    private getCurrentDirection(key: BeatmapSortKey): SortDirection | undefined {
        const lastSortKeyDirection = this.sorter.getLastKeyDirection();
        if (lastSortKeyDirection === null || lastSortKeyDirection[0] !== key)
            return undefined;
        return lastSortKeyDirection[1];
    }
}
