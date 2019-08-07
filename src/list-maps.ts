

type SummaryRowData =
    [
        number, string, number, string, string, string, number, number, number,
        number, number, number, number, number, number, number, number, number, number, string
    ];
const MINIMUM_DATE = new Date(0);
class SummaryRow {
    approved_status: number;
    approved_date_string: string;
    approved_date: Date;
    mode: number;
    beatmap_id: string;
    beatmap_id_number: number;
    beatmapset_id: string;
    display_string: string;
    display_string_lower: string;
    stars: number;
    pp: number;
    hit_length: number;
    max_combo: number;
    approach_rate: number;
    circle_size: number;
    min_misses: number;
    fcNM: number;
    fcHD: number;
    fcHR: number;
    fcHDHR: number;
    fcDT: number;
    fcHDDT: number;
    update_date: string;
    info: BeatmapInfo | null;
    constructor(private readonly data: SummaryRowData) {
        [
            this.approved_status,
            this.approved_date_string,
            this.mode,
            this.beatmap_id,
            this.beatmapset_id,
            this.display_string,
            this.stars,
            this.pp,
            this.hit_length,
            this.max_combo,
            this.approach_rate,
            this.circle_size,
            this.min_misses,
            this.fcNM,
            this.fcHD,
            this.fcHR,
            this.fcHDHR,
            this.fcDT,
            this.fcHDDT,
            this.update_date,
        ] = data;
        this.beatmap_id_number = parseInt(this.beatmap_id);
        this.approved_date = new Date(this.approved_date_string.replace(' ', 'T') + '+08:00');
        this.display_string_lower = this.display_string.toLowerCase();
        this.info = null;
    }
}

type RankingRowData =
    [
        number, number, string, string, string, string, string, string, number, string, string
    ];
class RankingRow {
    stars: number;
    pp: number;
    user_id: string;
    username: string;
    username_lower: string;
    beatmap_id: string;
    beatmap_id_number: number;
    beatmapset_id: string;
    display_string: string;
    display_string_lower: string;
    mods: string;
    accuracy: number;
    combo_display: string;
    date_played_string: string;
    constructor(public readonly rank: number, private readonly data: RankingRowData) {
        [
            this.stars,
            this.pp,
            this.user_id,
            this.username,
            this.beatmap_id,
            this.beatmapset_id,
            this.display_string,
            this.mods,
            this.accuracy,
            this.combo_display,
            this.date_played_string
        ] = data;
        this.beatmap_id_number = parseInt(this.beatmap_id);
        this.username_lower = this.username.toLowerCase();
        this.display_string_lower = this.display_string.toLowerCase();
    }
}


let summaryRows: SummaryRow[] = [];
let rankingRows: RankingRow[] = [];
let unsortedTableRows: HTMLTableRowElement[] = [];
let currentSortOrder: number[] = [];
let currentHashLink = '#';

let previousIndices = '';
let unsortedTableRowsChanged = false;
function drawTable(indices: number[]) {
    const str = indices.join(',');
    if (!unsortedTableRowsChanged && previousIndices === str) return;
    unsortedTableRowsChanged = false;
    previousIndices = str;
    $('#summary-table > tbody')
        .empty()
        .append(indices.map(index => unsortedTableRows[index]));
}

class SearchQuery {
    public readonly check: (row: SummaryRow) => boolean;
    public readonly normalized_source: string;
    constructor(public readonly source: string) {
        const key_to_property_name = {
            'status': '"pppraql"[row.approved_status+2]',
            'mode': '"otcm"[row.mode]',
            'stars': 'row.stars',
            'pp': 'row.pp',
            'length': 'row.hit_length',
            'combo': 'row.max_combo',
            'ar': 'row.approach_rate',
            'cs': 'row.circle_size',
            'played': `(!row.info?Infinity:(${new Date().valueOf()}-row.info.lastPlayed.valueOf())/${1e3 * 60 * 60 * 24})`,
            'unplayed': `(row.info&&row.info.lastPlayed.valueOf()!==${MINIMUM_DATE.valueOf()}?'y':'')`,
            'date': `(${new Date().valueOf()}-row.approved_date.valueOf())/${1e3 * 60 * 60 * 24}`,
            'rank': `(${JSON.stringify(rankAchievedClass)}[!row.info?9:row.info.rankAchieved]).toLowerCase()`
        };
        const regexp = new RegExp(`(${
            Object.keys(key_to_property_name).join('|')
            })(<=?|>=?|=|!=)([-\\w\\.]*)`);
        let check_func_source = 'return true';
        this.normalized_source = '';
        for (const token of source.split(' ')) {
            const trimmed = token.trim();
            if (trimmed === '') continue;
            const match = regexp.exec(trimmed);
            if (match) {
                const key = match[1];
                const rel = match[2] === '=' ? '==' : match[2];
                let val: number | string = parseFloat(match[3]);
                if (isNaN(val))
                    val = match[3].toLowerCase();
                const prop = (key_to_property_name as any)[key];
                if (this.normalized_source !== '') this.normalized_source += ' ';
                this.normalized_source += match[1] + match[2] + match[3];
                check_func_source += `&&${prop}${rel}${JSON.stringify(val)}`;
            } else {
                const str = trimmed.toLowerCase();
                const escaped = JSON.stringify(str);
                if (this.normalized_source !== '') this.normalized_source += ' ';
                this.normalized_source += str;
                check_func_source += `&&row.display_string_lower.indexOf(${escaped})!==-1`;
            }
        }
        this.check = new Function('row', check_func_source) as any;
    }
}

const sortKeys = [
    (x: SummaryRow) => x.approved_date_string,
    (x: SummaryRow) => x.display_string_lower,
    (x: SummaryRow) => x.stars,
    (x: SummaryRow) => x.pp,
    (x: SummaryRow) => x.hit_length,
    (x: SummaryRow) => x.max_combo,
    (x: SummaryRow) => x.approach_rate,
    (x: SummaryRow) => x.circle_size,
    (x: SummaryRow) =>
        x.fcHDDT * 2 + x.fcDT * 1e8 +
        x.fcHDHR * 2 + x.fcHR * 1e4 +
        x.fcHD * 2 + x.fcNM -
        x.min_misses,
    (x: SummaryRow) => x.update_date,
    (x: SummaryRow) => !x.info ? MINIMUM_DATE.valueOf() : x.info.lastPlayed.valueOf()
];

function stringifyObject(obj: { [key: string]: string; }): string {
    return Object.keys(obj)
        .map(k => k + '=' + encodeURIComponent(obj[k]))
        .join('&');
}

function parseObject(str: string) {
    const res = {};
    str.split('&').forEach(part => {
        const match = part.match(/(\w+)=(.+)/);
        if (match)
            (res as any)[match[1]] = decodeURIComponent(match[2]);
    });
    return res;
}

function drawTableForCurrentFiltering() {
    const filter_approved_status = parseInt($('#filter-approved-status').val() as string);
    const filter_mode = parseInt($('#filter-mode').val() as string);
    const filter_search_query = new SearchQuery(($('#filter-search-query').val() as string));
    const filter_fc_level = parseInt($('#filter-fc-level').val() as string);
    const filter_local_data = parseInt($('#filter-local-data').val() as string);
    const index_start = parseInt($('#result-index-start').val() as string) || 0;
    const count_limit = parseInt($('#result-count-limit').val() as string) || 100;

    const get_fc_level = (row: SummaryRow) => {
        if (row.min_misses !== 0) return 1;
        if (row.fcDT !== 0 || row.fcHDDT !== 0) return 8;
        if (row.fcNM === 0 && row.fcHD === 0 && row.fcHR === 0 && row.fcHDHR === 0) return 2;
        if (row.fcNM === 0 && row.fcHD === 0) return 3;
        if (row.fcHD === 0) return 4;
        if (row.fcHR === 0 && row.fcHDHR === 0) return 5;
        if (row.fcHDHR === 0) return 6;
        return 7;
    };

    const get_local_data_flags = (row: SummaryRow): number => {
        if (beatmapInfoMap.size === 0) return -1;
        let flags = 0;
        const info = beatmapInfoMap.get(row.beatmap_id_number);
        if (!info) return 0;
        flags |= 2;
        if (info.lastPlayed.valueOf() !== MINIMUM_DATE.valueOf())
            flags |= 1;
        return flags;
    };

    currentHashLink = '#';
    const obj = {} as { [key: string]: string; };
    if (filter_approved_status !== 1)
        obj.s = filter_approved_status.toString();
    if (filter_mode !== 3)
        obj.m = filter_mode.toString();
    if (filter_search_query.normalized_source !== '')
        obj.q = filter_search_query.normalized_source;
    if (filter_fc_level !== 0)
        obj.l = filter_fc_level.toString();
    if (filter_local_data !== 0)
        obj.d = filter_local_data.toString();
    if (currentSortOrder.length !== 0)
        obj.o = currentSortOrder.join('.');
    if (index_start !== 0)
        obj.i = index_start.toString();
    if (count_limit !== 100)
        obj.n = count_limit.toString();

    currentHashLink += stringifyObject(obj);
    history.replaceState({}, document.title, location.pathname + (currentHashLink === '#' ? '' : currentHashLink));

    const indices = summaryRows.map((_, index) => index).filter(index => {
        const row = summaryRows[index];

        if (filter_approved_status === 1 &&
            (row.approved_status !== 1 && row.approved_status !== 2))
            return false;
        if (filter_approved_status === 2 && row.approved_status !== 4)
            return false;

        if (filter_mode === 1 && row.mode !== 0)
            return false;
        if (filter_mode === 2 && row.mode !== 2)
            return false;

        if (!filter_search_query.check(row))
            return false;

        if (filter_fc_level !== 0 && get_fc_level(row) !== filter_fc_level)
            return false;

        if (filter_local_data !== 0) {
            const flags = get_local_data_flags(row);
            switch (filter_local_data) {
                case 1: if ((flags & 1) !== 0) return false; break;
                case 2: if ((flags & 1) === 0) return false; break;
                case 3: if ((flags & 2) !== 0) return false; break;
                case 4: if ((flags & 2) === 0) return false; break;
                case 5: if ((flags & 3) !== 2) return false; break;
            }
        }

        return true;
    });

    const prevIndex = Array(summaryRows.length);
    for (const ord of currentSortOrder) {
        if (ord === 0) continue;
        indices.forEach((x, i) => prevIndex[x] = i);
        const sortKey = sortKeys[Math.abs(ord) - 1];
        const sign = ord > 0 ? 1 : -1;
        indices.sort((x, y) => {
            const kx = sortKey(summaryRows[x]);
            const ky = sortKey(summaryRows[y]);
            return kx < ky ? -sign : kx > ky ? sign : prevIndex[x] - prevIndex[y];
        });
    }

    $('#num-results').text(indices.length === 1 ? '1 map' : indices.length.toString() + ' maps');

    const indexStart = Math.min(Math.max(index_start, 0), indices.length);
    const indexEnd = Math.min(Math.max(index_start + count_limit, 0), indices.length);

    $('#result-index-start').val(indexStart.toString());
    $('#result-index-end').text(indexEnd.toString());
    $('#result-count-limit').val(count_limit.toString());

    $('#hash-link-to-the-current-table').attr('href', currentHashLink);

    $('#page-prev').toggleClass('disabled', indexStart === 0);
    $('#page-next').toggleClass('disabled', indexEnd === indices.length);

    indices.splice(0, indexStart);
    indices.length = indexEnd - indexStart;

    drawTable(indices);
}

function simplifySortOrder(order: number[], [noTies, defaultOrder]: [number[], number]): number[] {
    const res = [];
    const seen = Array(sortKeys.length);
    for (let i = order.length - 1; i >= 0; --i) {
        const x = order[i];
        if (x === 0) continue;
        const key = Math.abs(x) - 1, sign = x > 0 ? 1 : -1;
        if (seen[key]) continue;
        seen[key] = sign;
        res.push(x);
        if (noTies.indexOf(key) !== -1) // there is almost no ties
            break;
    }
    if (res.length !== 0 && res[res.length - 1] === defaultOrder)
        res.pop();
    res.reverse();
    return res;
}

const summaryOrderConfig: [number[], number] = [[0, 1, 2, 3, 4, 5, 9], -3];
const rankingOrderConfig: [number[], number] = [[0, 1, 7], 1];
function setQueryAccordingToHash() {
    let obj: { [k: string]: string; };
    try {
        obj = parseObject(location.hash.substr(1));
    } catch (e) {
        obj = {};
    }
    if (obj.s === undefined) obj.s = '1';
    if (obj.m === undefined) obj.m = '3';
    if (obj.q === undefined) obj.q = '';
    if (obj.l === undefined) obj.l = '0';
    if (obj.o === undefined) obj.o = '';
    if (obj.d === undefined) obj.d = '0';
    if (obj.i === undefined) obj.i = '0';
    if (obj.n === undefined) obj.n = '100';
    $('#filter-approved-status').val(parseInt(obj.s));
    $('#filter-mode').val(parseInt(obj.m));
    $('#filter-search-query').val(obj.q);
    $('#filter-fc-level').val(parseInt(obj.l));
    $('#filter-local-data').val(parseInt(obj.d));
    $('#result-index-start').val(parseInt(obj.i));
    $('#result-count-limit').val(parseInt(obj.n));
    currentSortOrder = simplifySortOrder(obj.o.split('.').map(x => parseInt(x) || 0), summaryOrderConfig);
    setTableHeadSortingMark();
}

function setTableHeadSortingMark() {
    $('.sorted').removeClass('sorted ascending descending');
    const x = currentSortOrder.length === 0 ?
        -3 : // stars desc
        currentSortOrder[currentSortOrder.length - 1];
    const index = Math.abs(x) - 1;
    $($('#summary-table > thead > tr > th')[index])
        .addClass('sorted').addClass(x > 0 ? 'ascending' : 'descending');
}

function pad(x: number) {
    return (x < 10 ? '0' : '') + x;
}

function formatDate(date: Date) {
    return date.toISOString().split('T')[0] +
        ' ' + pad(date.getHours()) +
        ':' + pad(date.getMinutes());
}

const rankAchievedClass = [
    'SSH', 'SH', 'SS', 'S', 'A',
    'B', 'C', 'D', 'F', '-'
];

function displayFCLevel(row: SummaryRow) {
    if (row.min_misses > 0)
        return row.min_misses + (row.min_misses === 1 ? ' miss' : ' misses');
    if (row.fcDT + row.fcHDDT !== 0)
        return (row.fcHDDT !== 0 ? 'HD' : '') + 'DT';
    if (row.fcHR + row.fcHDHR !== 0)
        return (row.fcHDHR !== 0 ? 'HD' : '') + 'HR';
    if (row.fcHD + row.fcNM !== 0)
        return (row.fcHD !== 0 ? 'HD' : 'NM');
    return 'EZ only';
}

let beatmapInfoMapUsedVersion = MINIMUM_DATE;
function initUnsortedTableRows() {
    if (summaryRows.length === 0)
        return false;

    if (unsortedTableRows.length !== 0 && beatmapInfoMapUsedVersion === beatmapInfoMapVersion)
        return false;
    beatmapInfoMapUsedVersion = beatmapInfoMapVersion;
    if (beatmapInfoMap.size !== 0) {
        summaryRows.forEach(row => {
            const info = beatmapInfoMap.get(row.beatmap_id_number);
            if (info)
                row.info = info;
        });
    }

    const mode_icons = [
        'fa fa-exchange',
        '',
        'fa fa-tint',
        '',
    ];
    const approved_status_icons = [
        'fa fa-question',
        'fa fa-question',
        'fa fa-question',
        'fa fa-angle-double-right',
        'fa fa-fire',
        'fa fa-check',
        'fa fa-heart-o',
    ];
    unsortedTableRows = summaryRows.map(row =>
        $('<tr>').append([
            [
                $('<i>').addClass(approved_status_icons[row.approved_status + 2]),
                document.createTextNode(row.approved_date_string.split(' ')[0])
            ],
            $('<div>').addClass('map-cell').append([
                $('<div>').append([
                    $('<i>').addClass(mode_icons[row.mode]),
                    $('<a>')
                        .attr('href', `https://osu.ppy.sh/b/${row.beatmap_id}?m=2`)
                        .attr('target', '_blank')
                        .text(row.display_string)]
                ),
                row.beatmap_id_number > 0 ? $('<div>').append([
                    $('<a><i class="fa fa-picture-o">')
                        .attr('target', '_blank')
                        .attr('href', `https://b.ppy.sh/thumb/${row.beatmapset_id}.jpg`),
                    $('<a><i class="fa fa-download">')
                        .attr('target', '_blank')
                        .attr('href', `https://osu.ppy.sh/d/${row.beatmapset_id}n`),
                    $('<a><i class="fa fa-cloud-download">')
                        .attr('href', `osu://dl/${row.beatmapset_id}`)
                ]) : $()
            ]),
            row.stars.toFixed(2),
            row.pp.toFixed(0),
            `${Math.floor(row.hit_length / 60)}:${pad(Math.floor(row.hit_length % 60))}`,
            row.max_combo.toString(),
            row.approach_rate.toFixed(1),
            row.circle_size.toFixed(1),
            displayFCLevel(row),
            row.update_date,
            beatmapInfoMap.size === 0 ? [] :
                [
                    $('<i class="fa">').addClass(row.info ? 'fa-check-square-o' : 'fa-square-o'),
                    $('<span>').addClass('rank-' + rankAchievedClass[!row.info ? 9 : row.info.rankAchieved]),
                    $('<span>').text(
                        !row.info || row.info.lastPlayed.valueOf() === MINIMUM_DATE.valueOf()
                            ? '---' : formatDate(row.info.lastPlayed)
                    )
                ]
        ].map(x => $('<td>').append(x)))[0] as HTMLTableRowElement);

    unsortedTableRowsChanged = true;
    return true;
}

function showErrorMessage(text: string) {
    $('#alerts').append(
        $('<div class="alert alert-warning alert-dismissable">')
            .text(text)
            .append('<a class="close" data-dismiss="alert"><span>&times;'));
}

type LocalFileName = 'osu!.db';

function setOsuDBData(name: LocalFileName, data: ArrayBuffer | null) {
    $('#filter-local-data').prop('disabled', data === null);
    if (data) {
        const time = performance.now();
        loadOsuDB(data, new Date());
        console.log('osu!.db loaded in', performance.now() - time, 'ms');
    }
}

function readFileToArrayBuffer(file: File) {
    return new Promise<ArrayBuffer>(resolve => {
        const fr = new FileReader();
        fr.onload = () => {
            console.log('file ' + file.name + ' loaded');
            return resolve(fr.result as ArrayBuffer);
        };
        fr.readAsArrayBuffer(file);
    });
}

async function loadLocalFile(name: LocalFileName, file: File) {
    const data = await readFileToArrayBuffer(file);
    switch (name) {
        case 'osu!.db':
            setOsuDBData(name, data);
            break;
    }
}

class SerializationReader {
    private dv: DataView;
    private offset: number;

    constructor(buffer: ArrayBuffer) {
        this.dv = new DataView(buffer);
        this.offset = 0;
    }

    public skip(bytes: number) {
        this.offset += bytes;
    }

    public readInt8() {
        const result = this.dv.getInt8(this.offset);
        this.offset += 1;
        return result;
    }

    public readInt16() {
        const result = this.dv.getInt16(this.offset, true);
        this.offset += 2;
        return result;
    }

    public readInt32() {
        const result = this.dv.getInt32(this.offset, true);
        this.offset += 4;
        return result;
    }

    public readByte() {
        return this.readInt8() | 0;
    }

    public readUInt16() {
        return this.readInt16() | 0;
    }

    public readUInt32() {
        return this.readInt32() | 0;
    }

    public readBoolean() {
        return this.readInt8() !== 0;
    }

    private readULEB128() {
        let result = 0;
        for (let shift = 0; ; shift += 7) {
            const byte = this.dv.getUint8(this.offset);
            this.offset += 1;
            result |= (byte & 0x7f) << shift;
            if ((byte & 0x80) === 0)
                return result;
        }
    }

    public readUint8Array(length: number) {
        const result = new Uint8Array(this.dv.buffer, this.offset, length);
        this.offset += length;
        return result;
    }

    public readString() {
        const header = this.readInt8();
        if (header === 0)
            return '';
        const length = this.readULEB128();
        const array = this.readUint8Array(length);
        return new TextDecoder('utf-8').decode(array);
    }

    public readInt64Rounded() {
        const lo = this.dv.getUint32(this.offset, true);
        const hi = this.dv.getUint32(this.offset + 4, true);
        this.offset += 8;
        return hi * 0x100000000 + lo;
    }

    public readDateTime() {
        // OFFSET = 621355968000000000 = ticks from 0001/1/1 to 1970/1/1
        let lo = this.readUInt32();
        let hi = this.readUInt32();
        lo -= 3444293632; // lo bits of OFFSET
        if (lo < 0) {
            lo += 4294967296;   // 2^32
            hi -= 1;
        }
        hi -= 144670508;  // hi bits of OFFSET
        const ticks = hi * 4294967296 + lo;
        return new Date(ticks * 1e-4);
    }

    public readSingle() {
        const result = this.dv.getFloat32(this.offset, true);
        this.offset += 4;
        return result;
    }

    public readDouble() {
        const result = this.dv.getFloat64(this.offset, true);
        this.offset += 8;
        return result;
    }

    public readList(callback: (index: number) => any) {
        const count = this.readInt32();
        for (let i = 0; i < count; i += 1)
            callback(i);
    }
}

class BeatmapInfo {
    public constructor(
        public readonly beatmapId: number,
        public readonly lastPlayed: Date,
        public readonly rankAchieved: number) { }
}

function readBeatmap(sr: SerializationReader) {
    const SizeInBytes = sr.readInt32();

    const Artist = sr.readString();
    const ArtistUnicode = sr.readString();
    const Title = sr.readString();
    const TitleUnicode = sr.readString();
    const Creator = sr.readString();
    const Version = sr.readString();
    const AudioFilename = sr.readString();
    const BeatmapChecksum = sr.readString();
    const Filename = sr.readString();
    const SubmissionStatus = sr.readByte();
    const countNormal = sr.readUInt16();
    const countSlider = sr.readUInt16();
    const countSpinner = sr.readUInt16();
    const DateModified = sr.readDateTime();

    const DifficultyApproachRate = sr.readSingle();
    const DifficultyCircleSize = sr.readSingle();
    const DifficultyHpDrainRate = sr.readSingle();
    const DifficultyOverall = sr.readSingle();

    const DifficultySliderMultiplier = sr.readDouble();

    for (let i = 0; i < 4; i += 1) {
        sr.readList(() => {
            sr.readInt32();
            sr.readInt16();
            sr.readDouble();
        });
    }

    const DrainLength = sr.readInt32();
    const TotalLength = sr.readInt32();
    const PreviewTime = sr.readInt32();
    sr.readList(() => {
        const BeatLength = sr.readDouble();
        const Offset = sr.readDouble();
        const TimingChange = sr.readBoolean();
    });
    const BeatmapId = sr.readInt32();
    const BeatmapSetId = sr.readInt32();
    const BeatmapTopicId = sr.readInt32();
    const PlayerRankOsu = sr.readByte();
    const PlayerRankFruits = sr.readByte();
    const PlayerRankTaiko = sr.readByte();
    const PlayerRankMania = sr.readByte();
    const PlayerOffset = sr.readInt16();
    const StackLeniency = sr.readSingle();
    const PlayMode = sr.readByte();
    const Source = sr.readString();
    const Tags = sr.readString();
    const OnlineOffset = sr.readInt16();
    const OnlineDisplayTitle = sr.readString();
    const NewFile = sr.readBoolean();
    const DateLastPlayed = sr.readDateTime();
    const InOszContainer = sr.readBoolean();
    const ContainingFolderAbsolute = sr.readString();
    const LastInfoUpdate = sr.readDateTime();
    const DisableSamples = sr.readBoolean();
    const DisableSkin = sr.readBoolean();
    const DisableStoryboard = sr.readBoolean();
    const DisableVideo = sr.readBoolean();
    const VisualSettingsOverride = sr.readBoolean();

    const LastEditTime = sr.readInt32();
    const ManiaSpeed = sr.readByte();

    return new BeatmapInfo(
        BeatmapId,
        new Date(Math.max(MINIMUM_DATE.valueOf(), DateLastPlayed.valueOf())),
        PlayerRankFruits);
}

const beatmapInfoMap = new Map<number, BeatmapInfo>();
let beatmapInfoMapVersion = MINIMUM_DATE;

function loadOsuDB(buffer: ArrayBuffer, timestamp: Date) {
    beatmapInfoMap.clear();
    const sr = new SerializationReader(buffer);
    sr.skip(4 + 4 + 1 + 8);
    sr.readString();
    const beatmapCount = sr.readInt32();

    for (let i = 0; i < beatmapCount; i += 1) {
        const beatmap = readBeatmap(sr);
        if (beatmap.beatmapId > 0)
            beatmapInfoMap.set(beatmap.beatmapId, beatmap);
    }

    beatmapInfoMapVersion = timestamp;
}

function initTable(sortKeys: {}[], orderConfig: [number[], number], onSortOrderChanged: () => void) {
    const thList = $('#summary-table > thead > tr > th');
    sortKeys.forEach((_, index) => {
        $.data(thList[index], 'thIndex', index);
    });
    thList.click((event) => {
        const th = $(event.target);
        let sign;
        if (th.hasClass('sorted'))
            sign = th.hasClass('descending') ? 1 : -1;
        else
            sign = th.hasClass('desc-first') ? -1 : 1;
        const thIndex = th.data('thIndex') as number;
        currentSortOrder.push((thIndex + 1) * sign);
        currentSortOrder = simplifySortOrder(currentSortOrder, orderConfig);
        setTableHeadSortingMark();
        onSortOrderChanged();
    });
}

async function main() {
    setQueryAccordingToHash();
    window.addEventListener('hashchange', () => {
        setQueryAccordingToHash();
        drawTableForCurrentFiltering();
    });
    const onChange = () => {
        drawTableForCurrentFiltering();
    };
    for (const id of ['filter-approved-status', 'filter-mode', 'filter-fc-level', 'filter-local-data',
        'result-index-start', 'result-count-limit'])
        $(`#${id}`).on('change', onChange);
    for (const id of ['filter-search-query'])
        $(`#${id}`).on('input', onChange);
    initTable(sortKeys, summaryOrderConfig, onChange);

    const loadData = (data: SummaryRowData[], lastModified: Date) => {
        $('#last-update-time')
            .append($('<time>')
                .attr('datetime', lastModified.toISOString())
                .text(lastModified.toISOString().split('T')[0]));
        summaryRows = data.map(x => new SummaryRow(x));
        initUnsortedTableRows();
        drawTableForCurrentFiltering();
        $('#summary-table-loader').hide();
    };
    $('#db-file-input').change(async event => {
        const elem = event.target as HTMLInputElement;
        if (!elem.files) return;
        for (let i = 0; i < elem.files.length; i += 1) {
            const file = elem.files[i];
            const name = file.name;
            if (name.indexOf('osu!.db') !== -1) {
                await loadLocalFile('osu!.db', file);
            } else {
                showErrorMessage(`Invalid file ${name}: Please select osu!.db`);
                continue;
            }
            if (initUnsortedTableRows())
                drawTableForCurrentFiltering();
        }
        elem.value = '';
    });

    $('#page-prev > a, #page-next > a').click(e => {
        const start = parseInt($('#result-index-start').val() as string);
        const count = parseInt($('#result-count-limit').val() as string);
        const isPrev = e.target.parentElement!.id === 'page-prev';
        $('#result-index-start').val(
            Math.max(0, isPrev ? start - count : start + count).toString());
        drawTableForCurrentFiltering();
        if (!isPrev) $('.main').get()[0].scroll(0, 0);
    });

    const resp = await fetch('data/summary.json');
    loadData(await resp.json(), new Date(resp.headers.get('Last-Modified') || '0'));
}

function initUnsortedRankingTableRows() {
    if (rankingRows.length === 0)
        return false;

    unsortedTableRows = rankingRows.map(row =>
        $('<tr>').append([
            row.rank.toString(),
            row.pp.toFixed(2),
            $('<a>').attr('href', `https://osu.ppy.sh/u/${row.user_id}`).text(row.username),
            [
                $('<a>')
                    .attr('href', `https://osu.ppy.sh/b/${row.beatmap_id}?m=2`)
                    .text(row.display_string),
                row.beatmap_id_number > 0 ? $('<div class="float-right">').append([
                    $('<a><i class="fa fa-picture-o">')
                        .attr('href', `https://b.ppy.sh/thumb/${row.beatmapset_id}.jpg`),
                    $('<a><i class="fa fa-download">')
                        .attr('href', `https://osu.ppy.sh/d/${row.beatmapset_id}n`),
                    $('<a><i class="fa fa-cloud-download">')
                        .attr('href', `osu://dl/${row.beatmapset_id}`)
                ]) : $()
            ],
            row.mods,
            row.accuracy.toFixed(2) + '%',
            row.combo_display,
            row.date_played_string,
        ].map(x => $('<td>').append(x)))[0] as HTMLTableRowElement);

    unsortedTableRowsChanged = true;
    return true;
}

const rankingSortKeys = [
    (x: RankingRow) => x.rank,
    (x: RankingRow) => x.pp,
    (x: RankingRow) => x.username_lower,
    (x: RankingRow) => x.display_string_lower,
    (x: RankingRow) => x.mods,
    (x: RankingRow) => x.accuracy,
    (x: RankingRow) => x.combo_display,
    (x: RankingRow) => x.date_played_string,
];

function drawRankingTable() {
    const indices = rankingRows.map((_row, i) => i);
    const prevIndex = Array(rankingRows.length);
    for (const ord of currentSortOrder) {
        if (ord === 0) continue;
        indices.forEach((x, i) => prevIndex[x] = i);
        const sortKey = rankingSortKeys[Math.abs(ord) - 1];
        const sign = ord > 0 ? 1 : -1;
        indices.sort((x, y) => {
            const kx = sortKey(rankingRows[x]);
            const ky = sortKey(rankingRows[y]);
            return kx < ky ? -sign : kx > ky ? sign : prevIndex[x] - prevIndex[y];
        });
    }
    drawTable(indices);
}

async function rankingMain() {
    initTable(rankingSortKeys, rankingOrderConfig, drawRankingTable);
    const loadData = (data: RankingRowData[], lastModified: Date) => {
        $('#last-update-time')
            .append($('<time>')
                .attr('datetime', lastModified.toISOString())
                .text(lastModified.toISOString().split('T')[0]));
        rankingRows = data.map((x, i) => new RankingRow(i + 1, x));
        initUnsortedRankingTableRows();
        drawRankingTable();
        $('#summary-table-loader').hide();
    };
    const resp = await fetch('data/ranking.json');
    loadData(await resp.json(), new Date(resp.headers.get('Last-Modified') || '0'));
}

if (/ranking\.html$/i.test(location.pathname)) {
    $(rankingMain);
} else {
    $(main);
}
