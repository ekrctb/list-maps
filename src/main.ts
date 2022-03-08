const CLASS_NAME_HIDDEN = 'hidden';

const ICON_APPROVAL_STATUS = {
    [ApprovalStatus.RANKED]: 'fa fa-angle-double-right',
    [ApprovalStatus.APPROVED]: 'fa fa-fire',
    [ApprovalStatus.QUALIFIED]: 'fa fa-check',
    [ApprovalStatus.LOVED]: 'fa fa-heart-o',
};
const ICON_RULESET = {
    [RulesetId.OSU]: 'fa fa-exchange',
    [RulesetId.CATCH]: 'fa fa-tint',
};
const ICON_SONG_PREVIEW = 'fa fa-music';
const ICON_OSU_DIRECT = 'fa fa-cloud-download';

interface StartIndexChangeEvent {
    kind: 'start',
    value: string,
}

interface PerPageCountChangeEvent {
    kind: 'per_page_count',
    value: string,
}

interface PageNavigationEvent {
    kind: 'page',
    direction: 'prev' | 'next',
}

interface SongPreviewEvent {
    kind: 'song',
    beatmapSetId: number | null,
}

interface LocalStorageStoreEvent {
    kind: 'storage',
    key: 'list-maps/volume',
    value: number,
}

class SummaryTableRow {
    public beatmapInfo: BeatmapInfo | null = null;

    public constructor() {

    }

    public renderTo(row: Element) {
        assertElement(row, 'tr');

        if (this.beatmapInfo === null) {
            row.classList.add(CLASS_NAME_HIDDEN);
            return;
        }

        row.classList.remove(CLASS_NAME_HIDDEN);

        while (row.children.length < 11) {
            row.appendChild(createElement('td'));
        }

        const info = this.beatmapInfo;
        const { meta } = info;

        this.renderDate(meta.approvalStatus, meta.approvedDateString, row.children[0]);
        this.renderMap(meta.beatmapSetId, meta.beatmapId, meta.rulesetId, meta.displayString, row.children[1]);
        this.renderStars(info.currentMods.stars, row.children[2]);
        this.renderPP(meta.approvalStatus, info.currentMods.performancePoint, row.children[3]);
        this.renderLength(info.currentMods.hitLength, row.children[4]);
        this.renderCombo(meta.maxCombo, row.children[5]);
        this.renderAR(info.currentMods.approachRate, row.children[6]);
        this.renderCS(info.currentMods.circleSize, row.children[7]);
        this.renderFCCount(info.currentMods.fcCount, row.children[8]);
        this.renderFCMods(info.currentMods.fcMods, row.children[9]);
        this.renderLocalData(info.localDataInfo, row.children[10]);
    }

    private renderDate(status: ApprovalStatus, dateString: string, element: Element) {
        if (element.childNodes.length === 0) {
            element.appendChild(createElement('i'));
            element.appendChild(document.createTextNode(''));
        }

        const icon = element.children[0];
        icon.className = ICON_APPROVAL_STATUS[status] ?? '';

        element.childNodes[1].textContent = dateString.slice(0, 10);
    }

    private renderMap(setId: number, mapId: number, ruleset: RulesetId, display: string, element: Element) {
        if (element.childNodes.length === 0) {
            element.appendChild(createElement('div', { className: 'map-cell' }, [
                createElement('div', {}, [
                    createElement('i'),
                    createElement('a', { target: '_blank' })
                ]),
                createElement('div', {}, [
                    createElement('a', { className: ICON_SONG_PREVIEW }),
                    createElement('a', { className: ICON_OSU_DIRECT }),
                ]),
            ]));
        }
        const cell = element.children[0].children;

        const rulesetIcon = cell[0].children[0];
        rulesetIcon.className = ICON_RULESET[ruleset] ?? '';

        const displayLink = cell[0].children[1];
        assertElement<HTMLAnchorElement>(displayLink, 'a');
        displayLink.href = `https://osu.ppy.sh/beatmapsets/${setId}#fruits/${mapId}`;
        displayLink.textContent = display;

        const songLink = cell[1].children[0];
        assertElement<HTMLAnchorElement>(songLink, 'a');
        songLink.href = `javascript:toggleSongPreview(${setId})`;

        const osuDirectLink = cell[1].children[1];
        assertElement<HTMLAnchorElement>(osuDirectLink, 'a');
        osuDirectLink.href = `osu://dl/${setId}`;
    }

    private renderStars(stars: number, element: Element) {
        element.textContent = stars.toFixed(2);
    }

    private renderPP(status: ApprovalStatus, pp: number, element: Element) {
        if (status === ApprovalStatus.LOVED) {
            element.textContent = "-";
        } else {
            element.textContent = pp.toFixed(0);
        }
    }

    private renderLength(length: number, element: Element) {
        const minutes = Math.floor(length / 60);
        const seconds = Math.floor(length % 60);
        element.textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`
    }

    private renderCombo(maxCombo: number, element: Element) {
        element.textContent = maxCombo.toString();
    }

    private renderAR(ar: number, element: Element) {
        element.textContent = ar.toFixed(1);
    }

    private renderCS(cs: number, element: Element) {
        element.textContent = cs.toFixed(1);
    }

    private renderFCCount(fcCount: number, element: Element) {
        element.textContent = fcCount === 0 ? '' :
            fcCount < 0 ? `${-fcCount}xMiss` : `${fcCount} FCs`;
    }

    private renderFCMods(fcMods: FCMods, element: Element) {
        element.textContent = fcMods & FCMods.HDFL ? '+HDFL' : fcMods & FCMods.FL ? '+FL' : fcMods & FCMods.HD ? '+HD' : '';
    }

    private renderLocalData(info: LocalDataInfo | null, element: Element) {
        if (info === null) {
            if (element.children.length > 0) {
                element.children[0].classList.add(CLASS_NAME_HIDDEN);
            }
            return;
        }

        if (element.childNodes.length === 0) {
            element.appendChild(createElement('div', {}, [
                createElement('span'),
                createElement('span'),
            ]));
        }

        const div = element.children[0];
        div.classList.remove(CLASS_NAME_HIDDEN);

        const rank = div.children[0];
        rank.className = `rank-${LocalDataInfo.RANK_NAMES[info.rankAchived] ?? '-'}`;

        const played = div.children[1];
        played.textContent = !info.hasAnyInfo ? '' :
            info.hasLastPlayedDate ? info.lastPlayedDate.toISOString().split('T')[0] : '-';
    }
}

class SummaryTable {
    public readonly header: SummaryTableHeader;
    private readonly rows: SummaryTableRow[];

    public beatmapList: BeatmapInfo[] = [];

    public constructor(eventSink: EventSink<SortRequestEvent>) {
        this.header = new SummaryTableHeader(eventSink);
        this.rows = [];
    }

    public renderTo(table: Element) {
        assertElement(table, 'table');

        this.header.renderTo(table.children[0]!);

        const tbody = table.children[1]!;
        assertElement(tbody, 'tbody');

        while (this.rows.length < this.beatmapList.length) {
            this.rows.push(new SummaryTableRow());
        }

        while (tbody.children.length < this.rows.length) {
            tbody.appendChild(createElement('tr'));
        }

        for (let i = 0; i < this.rows.length; i += 1) {
            const row = this.rows[i];
            row.beatmapInfo = i < this.beatmapList.length ? this.beatmapList[i] : null;
            row.renderTo(tbody.children[i]);
        }
    }
}

class Loader {
    public visible: boolean = true;

    public renderTo(element: Element) {
        element.classList.toggle(CLASS_NAME_HIDDEN, !this.visible);
    }
}

class PageNavigation {
    public hasPrevious: boolean = false;
    public hasNext: boolean = false;

    public constructor(private readonly eventSink: EventSink<PageNavigationEvent>) {
    }

    public renderTo(nav: Element) {
        assertElement(nav, 'nav');

        this.renderPrevNext('prev', nav.children[0].children[0]);
        this.renderPrevNext('next', nav.children[0].children[1]);
    }

    private renderPrevNext(direction: 'prev' | 'next', element: Element) {
        const link = element.children[0];
        assertElement<HTMLAnchorElement>(link, 'a');

        if (link.onclick === null) {
            link.onclick = () => {
                this.eventSink.trigger({ kind: 'page', direction });
            };
            this.eventSink.registerStopCallback(() => link.onclick = null);
        }

        element.classList.toggle('disabled', direction === 'prev' ? !this.hasPrevious : !this.hasNext);
    }
}

class SongPreview {
    public readonly playingUri: ValueChange<string | null> = new ValueChange(null, true);
    public readonly volume: ValueChange<number> = new ValueChange(1, true);

    public constructor(private readonly eventSink: EventSink<SongPreviewEvent | LocalStorageStoreEvent>) { }

    public renderTo(div: Element) {
        const audio = div.children[0];
        assertElement<HTMLAudioElement>(audio, 'audio');

        if (audio.onended === null) {
            audio.onended = () => this.eventSink.trigger({ kind: 'song', beatmapSetId: null });
            this.eventSink.registerStopCallback(() => audio.onended = null);
        }

        if (audio.onvolumechange === null) {
            audio.onvolumechange = () => {
                this.eventSink.trigger({ kind: 'storage', key: 'list-maps/volume', value: audio.volume });
            }
            this.eventSink.registerStopCallback(() => audio.onvolumechange = null);
        }

        if (this.playingUri.pop()) {
            const uri = this.playingUri.get();
            if (uri === null) {
                audio.removeAttribute('src');
                audio.pause();
            } else {
                audio.src = uri;
                audio.currentTime = 0;
                audio.play();
            }
        }

        if (this.volume.pop()) {
            audio.volume = this.volume.get();
        }

        div.classList.toggle('hidden', this.playingUri.get() === null);
    }
}

class SummaryTableContainer {
    public startIndex: number = 0;
    public endIndex: number = 0;
    public perPageCount: number = 0;

    public readonly summaryTableLoader: Loader;
    public readonly summaryTable: SummaryTable;
    public readonly pageNavigation: PageNavigation;
    public readonly songPreview: SongPreview;

    private scrollToTop: boolean = false;

    public constructor(eventSink: EventSink<SortRequestEvent | PageNavigationEvent | SongPreviewEvent | LocalStorageStoreEvent>) {
        this.summaryTableLoader = new Loader();
        this.summaryTable = new SummaryTable(eventSink);
        this.pageNavigation = new PageNavigation(eventSink);
        this.songPreview = new SongPreview(eventSink);
    }

    public set(filteredList: BeatmapInfo[]) {
        this.startIndex = Math.min(this.startIndex, filteredList.length);
        this.endIndex = Math.min(this.startIndex + this.perPageCount, filteredList.length);

        this.summaryTableLoader.visible = false;

        this.summaryTable.beatmapList = filteredList.slice(this.startIndex, this.endIndex);

        this.pageNavigation.hasPrevious = this.startIndex > 0;
        this.pageNavigation.hasNext = this.endIndex < filteredList.length;
    }

    public getSorter(): BeatmapSorter {
        return this.summaryTable.header.sorter;
    }

    public processEvent(event: SortRequestEvent | SortOrderChangeEvent | StartIndexChangeEvent | PerPageCountChangeEvent | PageNavigationEvent | SongPreviewEvent) {
        switch (event.kind) {
            case 'sort':
                this.getSorter().requestSort(event.key, event.currentDirection);
                break;

            case 'sort_order':
                const sorter = this.getSorter();
                sorter.clear();
                for (const [key, direction] of event.order) {
                    sorter.push(key, direction);
                }
                break;

            case 'start':
                const newIndex = parseInt(event.value);
                if (Number.isFinite(newIndex) && newIndex >= 0)
                    this.startIndex = newIndex;
                break;

            case 'per_page_count':
                const newCount = parseInt(event.value);
                if (Number.isFinite(newCount) && newCount >= 0)
                    this.perPageCount = newCount;
                break;

            case 'page':
                if (event.direction === 'prev') {
                    this.endIndex = this.startIndex;
                    this.startIndex = Math.max(0, this.startIndex - this.perPageCount);
                } else {
                    this.startIndex = this.endIndex;
                    this.endIndex += this.perPageCount;
                    this.scrollToTop = true;
                }
                break;

            case 'song':
                if (event.beatmapSetId === null) {
                    this.songPreview.playingUri.set(null);
                } else {
                    const uri = `https://b.ppy.sh/preview/${event.beatmapSetId}.mp3`;
                    if (this.songPreview.playingUri.get() === uri) {
                        this.songPreview.playingUri.set(null);
                    } else {
                        this.songPreview.playingUri.set(uri);
                    }
                }
                break;
        }
    }

    public renderTo(container: Element) {
        assertElement(container, 'div');

        this.summaryTableLoader.renderTo(container.children[0]);
        this.summaryTable.renderTo(container.children[1]);
        this.pageNavigation.renderTo(container.children[2]);
        this.songPreview.renderTo(container.children[3]);

        if (this.scrollToTop) {
            container.scroll(0, 0);
            this.scrollToTop = false;
        }
    }
}

async function fetchBeatmapList(): Promise<BeatmapInfo[]> {
    const text = await (await fetch('./data/summary.csv')).text();
    const lines = text.split('\n').filter(line => line.length !== 0);
    return lines.map(BeatmapInfo.parse);
}

async function fetchPerModsData(mods: Mods, beatmapList: BeatmapInfo[]): Promise<void> {
    const infoMap = new Map(beatmapList.map(info => [info.meta.beatmapId, info]));
    const text = await (await fetch(`./data/mods-${mods}.csv`)).text();
    const lines = text.split('\n').filter(line => line.length !== 0);
    const perModsInfoList = lines.map(line => PerModsInfo.parse(line, id => infoMap.get(id)!.meta));
    for (const perModsInfo of perModsInfoList) {
        const beatmapInfo = infoMap.get(perModsInfo.beatmapId)!;
        beatmapInfo.perMods.set(perModsInfo.mods, perModsInfo);
    }
}

let toggleSongPreview: (beatmapSetId: number) => void = () => { };

async function main() {
    const eventStream = new EventStream<
        SortRequestEvent | SortOrderChangeEvent |
        FilterChangeEvent | ModsChangeEvent | StartIndexChangeEvent | PerPageCountChangeEvent |
        PageNavigationEvent | SongPreviewEvent |
        LocalStorageStoreEvent | LocalDataFileChange>();

    try {
        const dataFetchedMods: Map<Mods, true> = new Map();

        const filterTab = new BeatmapFilterTab(eventStream);
        const localDataTab = new LocalDataTab(eventStream);
        const container = new SummaryTableContainer(eventStream);
        const uriHash = new UriHash(eventStream);

        toggleSongPreview = beatmapSetId => {
            eventStream.trigger({ kind: 'song', beatmapSetId });
        };
        eventStream.registerStopCallback(() => toggleSongPreview = () => { });

        filterTab.initialize(document.getElementById('filters')!);
        localDataTab.initialize(document.getElementById('local-setting')!);
        uriHash.initialize();

        const beatmapList = await fetchBeatmapList();

        while (true) {
            const event = eventStream.pop();
            if (event === null) {
                const filterer = filterTab.filterer;
                const sorter = container.getSorter();

                const filteredList = filterer.filter(beatmapList);
                sorter.sort(filteredList, BeatmapSorter.getBeatmapSortKeyFunc);

                container.set(filteredList);
                {
                    const value = localStorage.getItem('list-maps/volume');
                    if (value !== null)
                        container.songPreview.volume.set(parseFloat(value));
                }

                filterTab.startIndex.set(container.startIndex);
                filterTab.pagePerCount.set(container.perPageCount);

                filterTab.endIndex = container.endIndex;
                filterTab.filteredCount = filteredList.length;

                const hashString = UriHash.formatHashString(
                    filterer, sorter,
                    filterTab.mods, container.startIndex, container.perPageCount);
                uriHash.hashString.set(hashString);

                filterTab.renderTo(document.getElementById('filters')!);
                localDataTab.renderTo(document.getElementById('local-setting')!);
                container.renderTo(document.getElementById('table-container')!);
                uriHash.render();

                await eventStream.wait();
                continue;
            }

            console.log(event);
            switch (event.kind) {
                case 'filter':
                    filterTab.processEvent(event);

                    for (const mods of filterTab.filterer.filters.query.requiredMods) {
                        if (!dataFetchedMods.get(mods)) {
                            await fetchPerModsData(mods, beatmapList);
                            dataFetchedMods.set(mods, true);
                        }
                    }
                    break;

                case 'mods':
                    const mods = DIFFICULTY_MODS.find(x => x.toString() === event.value) ?? -1;

                    if (mods !== -1 && !dataFetchedMods.get(mods)) {
                        await fetchPerModsData(mods, beatmapList);
                        dataFetchedMods.set(mods, true);
                    }

                    for (const info of beatmapList) {
                        info.currentMods = mods === -1 ? info.anyMods : info.perMods.get(mods)!;
                    }

                    filterTab.mods = mods;
                    break;

                case 'sort':
                case 'sort_order':
                case 'start':
                case 'per_page_count':
                case 'page':
                case 'song':
                    container.processEvent(event);
                    break;

                case 'storage':
                    localStorage.setItem(event.key, event.value.toString());
                    break;

                case 'localdata':
                    const database = localDataTab.stableDatabase;
                    database.clear();

                    if (event.file !== null) {
                        const buffer = await event.file.arrayBuffer();
                        database.load(buffer);
                    }

                    for (const info of beatmapList) {
                        info.localDataInfo = database.infoMap.get(info.meta.beatmapId) ?? null;
                    }
                    break;
            }
        }
    } finally {
        eventStream.stop();
    }
}

window.addEventListener('load', () => {
    main().catch(console.error)
});
