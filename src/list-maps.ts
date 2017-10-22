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
let currentOrderingIndices: number[] = [];

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
    public readonly hash_str: string;
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
        this.hash_str = '';
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
                this.hash_str += ' ' + prop + ' ' + rel + ' ' + val;
                check_func_source += `&&row.${prop}${rel}${val}`;
            } else {
                const str = trimmed.toLowerCase();
                const escaped = JSON.stringify(str);
                this.hash_str += ' ' + escaped;
                check_func_source += `&&row.display_string_lower.indexOf(${escaped})!==-1`;
            }
        }
        this.check = new Function('row', check_func_source) as any;
    }
}


function drawTableForCurrentFiltering() {
    const filter_approved_status = parseInt($('*[name="filter_approved_status"]').val() as string);
    const filter_mode = $('*[name="filter_mode"]').val() as string;
    const filter_search_query = new SearchQuery(($('*[name="filter_search_query"]').val() as string));
    const filter_fc_level = parseInt($('*[name="filter_fc_level"]').val() as string);
    const filter_expression = $('*[name="filter_expression"]').val() as string;

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

    const indices = currentOrderingIndices.filter(index => {
        const row = summaryRows[index];

        if (filter_approved_status === 1 &&
            (row.approved_status !== 1 && row.approved_status !== 2))
            return false;
        if (filter_approved_status === 2 && row.approved_status !== 4)
            return false;

        if (filter_mode === '1' && row.mode !== 0)
            return false;
        if (filter_mode === '2' && row.mode !== 2)
            return false;

        if (!filter_search_query.check(row))
            return false;

        if (filter_fc_level !== 0 && get_fc_level(row) !== filter_fc_level)
            return false;

        return true;
    });
    drawTable(indices);
}

$(() => {
    const onChange = () => {
        drawTableForCurrentFiltering();
    };
    for (const name of ['filter_approved_status', 'filter_mode', 'filter_fc_level'])
        $(`select[name="${name}"]`).on('change', onChange);
    for (const name of ['filter_search_query'])
        $(`input[name="${name}"]`).on('input', onChange);

    const thList = $('#summary-table > thead > tr > th');
    [
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
    ].forEach((sortKey: (x: SummaryRow) => number | string, index) => {
        $.data(thList[index], 'sortKey', sortKey);
    });
    $.getJSON('data/summary.json').then((data: SummaryRowData[], _, xhr) => {
        const last_modified = new Date(xhr.getResponseHeader('Last-Modified') as string);
        $('#last-update-time')
            .attr('datetime', last_modified.toISOString())
            .text(last_modified.toISOString().split('T')[0]);
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
        currentOrderingIndices = summaryRows.map((_, index) => index);
        drawTableForCurrentFiltering();
        $('#summary-table-loader').removeClass('active');
    });
    thList.click((event) => {
        const th = $(event.target);
        thList.filter('.sorted')
            .filter((_, x) => x !== event.target)
            .removeClass('sorted descending ascending');
        if (th.hasClass('sorted'))
            th.toggleClass('descending ascending');
        else
            th.addClass('sorted')
                .addClass(th.hasClass('desc-first') ? 'descending' : 'ascending');
        const sortKey = th.data('sortKey') as (x: SummaryRow) => any;
        const sign = th.hasClass('descending') ? -1 : 1;
        currentOrderingIndices.sort((x, y) => {
            const kx = sortKey(summaryRows[x]);
            const ky = sortKey(summaryRows[y]);
            return (kx < ky ? -1 : kx > ky ? 1 : 0) * sign;
        });
        drawTableForCurrentFiltering();
    });
});

}
