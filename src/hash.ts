
class UriHash {
    public readonly hashString: ValueChange<string> = new ValueChange('', true);

    constructor(private readonly eventSink: EventSink<SortOrderChangeEvent | FilterChangeEvent | ModsChangeEvent | StartIndexChangeEvent | PerPageCountChangeEvent>) {
    }

    public initialize() {
        this.onHashChange();
    }

    public render() {
        if (window.onhashchange === null) {
            window.onhashchange = () => this.onHashChange();
            this.eventSink.registerStopCallback(() => window.onhashchange = null);
        }

        if (this.hashString.pop()) {
            const hash = this.hashString.get();
            history.replaceState({}, document.title, location.pathname + (hash === '' ? '' : `#${hash}`));
        }
    }

    private onHashChange() {
        const object = this.parseHashString(location.hash.substring(1));
        this.triggerEvents(object);

        if (location.href.endsWith('#')) {
            history.replaceState({}, document.title, location.pathname);
        }
    }

    public static formatHashString(filterer: BeatmapFilterer, sorter: BeatmapSorter, mods: Mods | -1, startIndex: number, perPageCount: number): string {
        const object: Record<string, string> = {
            s: filterer.filters.status.toString(),
            m: filterer.filters.ruleset.toString(),
            q: filterer.normalizedSource.get(),
            d: filterer.filters.localdata.toString(),
            i: startIndex.toString(),
            n: perPageCount.toString(),
            o: sorter.order.map(([key, dir]) => UriHash.SORT_KEY_MAP[key] * (dir === 'asc' ? 1 : -1)).join('.'),
            x: mods.toString(),
        };
        return Object.keys(object).filter(k => UriHash.DEFAULT_VALUES[k] !== object[k]).map(k => `${k}=${object[k]}`).join('&');
    };

    private parseHashString(string: string): Record<string, string> {
        const result: Record<string, string> = {};
        for (const part of string.split('&')) {
            const match = part.match(/^(\w+)=(.+)$/);
            if (match !== null)
                result[match[1]] = decodeURIComponent(match[2]);
        }
        for (const key of Object.keys(UriHash.DEFAULT_VALUES)) {
            if (result[key] === undefined) {
                result[key] = UriHash.DEFAULT_VALUES[key];
            }
        }
        return result;
    }

    private triggerEvents(object: Record<string, string>) {
        if (object.s !== undefined) {
            this.eventSink.trigger({ kind: 'filter', key: 'status', value: object.s });
        }
        if (object.m !== undefined) {
            this.eventSink.trigger({ kind: 'filter', key: 'ruleset', value: object.m });
        }
        if (object.q !== undefined) {
            this.eventSink.trigger({ kind: 'filter', key: 'query', value: object.q })
        }
        if (object.d !== undefined) {
            this.eventSink.trigger({ kind: 'filter', key: 'localdata', value: object.d });
        }
        if (object.i !== undefined) {
            this.eventSink.trigger({ kind: 'start', value: object.i });
        }
        if (object.n !== undefined) {
            this.eventSink.trigger({ kind: 'per_page_count', value: object.n });
        }
        if (object.o !== undefined) {
            const order: [BeatmapSortKey, SortDirection][] = [];
            for (const part of object.o.split('.')) {
                const x = parseInt(part);
                for (const key of Object.keys(UriHash.SORT_KEY_MAP) as BeatmapSortKey[]) {
                    if (UriHash.SORT_KEY_MAP[key] === Math.abs(x)) {
                        order.push([key, x > 0 ? 'asc' : 'desc'])
                        break;
                    }
                }
            }
            this.eventSink.trigger({ kind: 'sort_order', order });
        }
        if (object.x !== undefined) {
            this.eventSink.trigger({ kind: 'mods', value: object.x });
        }
    }

    private static readonly SORT_KEY_MAP: Record<BeatmapSortKey, number> = {
        date: 1,
        title: 2,
        stars: 3,
        pp: 4,
        length: 5,
        combo: 6,
        ar: 7,
        cs: 8,
        fc_count: 9,
        fc_mods: 10,
        localdata: 11,
    };

    private static readonly DEFAULT_VALUES: Record<string, string> = {
        s: '1',
        m: '3',
        q: '',
        d: '0',
        i: '0',
        n: '100',
        o: '',
        x: '-1',
    };
}
