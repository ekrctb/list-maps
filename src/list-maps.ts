/// <reference types="jquery" />
namespace ListMaps {

interface JQuery {
    tablesort(): void;
    data(key: 'sortBy', keyFunc: (
        th: HTMLTableHeaderCellElement,
        td: HTMLTableDataCellElement,
        tablesort: any) => void): this;
}

type SummaryRowData =
[
    number, string, number, string, string, string, number, number, number,
    number, number, number, number, number, number, number, number, number, number, number
];
class SummaryRow {
    approved_status: number;
    approved_date: string;
    mode: number;
    beatmap_id: string;
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
    constructor(private readonly data: SummaryRowData) {
        [
            this.approved_status,
            this.approved_date,
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
        ] = data;
        this.display_string_lower = this.display_string.toLowerCase();
    }
}

let summaryRows: SummaryRow[] = [];
let unsortedTableRows: HTMLTableRowElement[] = [];
let currentSortOrder: number[] = [];
let currentHashLink = '#';

let previousIndices = '';
function drawTable(indices: number[]) {
    const str = indices.join(',');
    if (previousIndices === str) return;
    previousIndices = str;
    $('#summary-table > tbody')
        .html('')
        .append(indices.map(index => unsortedTableRows[index]));
}

class SearchQuery {
    public readonly check: (row: SummaryRow) => boolean;
    public readonly normalized_source: string;
    constructor(public readonly source: string) {
        const key_to_property_name = {
            'status': 'approved_status',
            'mode': 'mode',
            'stars': 'stars',
            'pp': 'pp',
            'length': 'hit_length',
            'combo': 'max_combo',
            'ar': 'approach_rate',
            'cs': 'circle_size',
        };
        let check_func_source = 'return true';
        this.normalized_source = '';
        for (const token of source.split(' ')) {
            const trimmed = token.trim();
            if (trimmed === '') continue;
            const match =
                /(status|mode|stars|pp|length|combo|ar|cs)(<|<=|>|>=|=|!=)([-\d\.]+)/.exec(trimmed);
            if (match) {
                const key = match[1];
                const rel = match[2] === '=' ? '==' : match[2];
                const val = parseFloat(match[3]);
                if (isNaN(val)) continue;
                const prop = (key_to_property_name as any)[key];
                if (this.normalized_source !== '') this.normalized_source += ' ';
                this.normalized_source += match[1] + match[2] + match[3];
                check_func_source += `&&row.${prop}${rel}${val}`;
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
    (x: SummaryRow) => x.approved_date,
    (x: SummaryRow) => x.display_string,
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
    const filter_approved_status = parseInt($('*[name="filter_approved_status"]').val() as string);
    const filter_mode = parseInt($('*[name="filter_mode"]').val() as string);
    const filter_search_query = new SearchQuery(($('*[name="filter_search_query"]').val() as string));
    const filter_fc_level = parseInt($('*[name="filter_fc_level"]').val() as string);

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

    currentHashLink = '#';
    const obj = {} as { [key: string]: string; };
    if (filter_approved_status !== 1)
        obj.s = filter_approved_status.toString();
    if (filter_mode !== 1)
        obj.m = filter_mode.toString();
    if (filter_search_query.normalized_source !== '')
        obj.q = filter_search_query.normalized_source;
    if (filter_fc_level !== 0)
        obj.l = filter_fc_level.toString();
    if (currentSortOrder.length !== 0)
        obj.o = currentSortOrder.join('.');

    currentHashLink += stringifyObject(obj);
    if (currentHashLink === '#')
        history.replaceState({}, document.title, location.pathname);
    else
        location.hash = currentHashLink;

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

        return true;
    });

    for (const ord of currentSortOrder) {
        if (ord === 0) continue;
        const prevIndex = Array(indices.length);
        indices.forEach((x, i) => prevIndex[x] = i);
        const sortKey = sortKeys[Math.abs(ord) - 1];
        const sign = ord > 0 ? 1 : -1;
        indices.sort((x, y) => {
            const kx = sortKey(summaryRows[x]);
            const ky = sortKey(summaryRows[y]);
            return kx < ky ? -sign : kx > ky ? sign : prevIndex[y] - prevIndex[x];
        });
    }

    $('#hash-link-to-the-current-table').attr('href', currentHashLink);

    drawTable(indices);
}

function simplySortOrder(order: number[]): number[] {
    const res = [];
    const seen = Array(sortKeys.length);
    for (let i = order.length - 1; i >= 0; -- i) {
        const x = order[i];
        if (x === 0) continue;
        const key = Math.abs(x) - 1, sign = x > 0 ? 1 : -1;
        if (seen[key]) continue;
        seen[key] = sign;
        res.push(x);
        if ([0, 1, 2, 3, 4, 5].indexOf(key) !== -1) // there is almost no ties
            break;
    }
    if (res.length !== 0 && res[res.length - 1] === -3)
        res.pop();
    res.reverse();
    return res;
}

function setQueryAccordingToHash() {
    let obj: { [k: string]: string; };
    try {
        obj = parseObject(location.hash.substr(1));
    } catch (e) {
        obj = {};
    }
    if (typeof(obj.s) === 'undefined') obj.s = '1';
    if (typeof(obj.m) === 'undefined') obj.m = '1';
    if (typeof(obj.q) === 'undefined') obj.q = '';
    if (typeof(obj.l) === 'undefined') obj.l = '0';
    if (typeof(obj.o) === 'undefined') obj.o = '';
    $('*[name="filter_approved_status"]').val(parseInt(obj.s));
    $('*[name="filter_mode"]').val(parseInt(obj.m));
    $('*[name="filter_search_query"]').val(obj.q);
    $('*[name="filter_fc_level"]').val(parseInt(obj.l));
    currentSortOrder = simplySortOrder(obj.o.split('.').map(x => parseInt(x) || 0));
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

$(() => {
    setQueryAccordingToHash();
    window.addEventListener('hashchange', () => {
        setQueryAccordingToHash();
        drawTableForCurrentFiltering();
    });
    const onChange = () => {
        drawTableForCurrentFiltering();
    };
    for (const name of ['filter_approved_status', 'filter_mode', 'filter_fc_level'])
        $(`select[name="${name}"]`).on('change', onChange);
    for (const name of ['filter_search_query'])
        $(`input[name="${name}"]`).on('input', onChange);

    const thList = $('#summary-table > thead > tr > th');
    sortKeys.forEach((_, index) => {
        $.data(thList[index], 'thIndex', index);
    });
    $.getJSON('data/summary.json').then((data: SummaryRowData[], _, xhr) => {
        const last_modified = new Date(xhr.getResponseHeader('Last-Modified') as string);
        $('#last-update-time')
            .append($('<time>')
                .attr('datetime', last_modified.toISOString())
                .text(last_modified.toISOString().split('T')[0]));
        const pad = (x: number) => (x < 10 ? '0' : '') + x;
        const mode_icons = [
            'exchange icon',
            '',
            'theme icon',
            '',
        ];
        const approved_status_icons = [
            'help icon',
            'angle double up icon',
            'fire icon',
            'checkmark icon',
            'empty heart icon',
        ];
        summaryRows = data.map(x => new SummaryRow(x));
        unsortedTableRows = summaryRows.map(row =>
            $('<tr>').append([
                [
                    $('<i>').addClass(approved_status_icons[row.approved_status]),
                    document.createTextNode(row.approved_date.split(' ')[0])
                ],
                [
                    $('<i>').addClass(mode_icons[row.mode]),
                    $('<a>')
                        .attr('href', `https://osu.ppy.sh/b/${row.beatmap_id}?m=2`)
                        .text(row.display_string),
                    $('<div style="float:right">').append([
                        $('<a><i class="image icon">')
                            .attr('href', `https://b.ppy.sh/thumb/${row.beatmapset_id}.jpg`),
                        $('<a><i class="download icon">')
                            .attr('href', `https://osu.ppy.sh/d/${row.beatmapset_id}n`)
                    ])
                ],
                row.stars.toFixed(2),
                row.pp.toFixed(0),
                `${Math.floor(row.hit_length / 60)}:${pad(Math.floor(row.hit_length % 60))}`,
                row.max_combo.toString(),
                row.approach_rate.toFixed(1),
                row.circle_size.toFixed(1),
                    row.min_misses !== 0 ? (row.min_misses === 1 ? '1 miss' : row.min_misses + ' misses') :
                    [row.fcNM, row.fcHD, row.fcHR, row.fcHDHR, row.fcDT, row.fcHDDT].join(', ')
            ].map(x => $('<td>').append(x)))[0] as HTMLTableRowElement);
        drawTableForCurrentFiltering();
        $('#summary-table-loader').removeClass('active');
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
        currentSortOrder = simplySortOrder(currentSortOrder);
        setTableHeadSortingMark();
        drawTableForCurrentFiltering();
    });
});

}
