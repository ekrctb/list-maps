"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var ListMaps;
(function (ListMaps) {
    const MINIMUM_DATE = new Date(0);
    class SummaryRow {
        constructor(data) {
            this.data = data;
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
    class RankingRow {
        constructor(rank, data) {
            this.rank = rank;
            this.data = data;
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
    let summaryRows = [];
    let rankingRows = [];
    let unsortedTableRows = [];
    let currentSortOrder = [];
    let currentHashLink = '#';
    let previousIndices = '';
    let unsortedTableRowsChanged = false;
    function drawTable(indices) {
        const str = indices.join(',');
        if (!unsortedTableRowsChanged && previousIndices === str)
            return;
        unsortedTableRowsChanged = false;
        previousIndices = str;
        $('#summary-table > tbody')
            .empty()
            .append(indices.map(index => unsortedTableRows[index]));
    }
    class SearchQuery {
        constructor(source) {
            this.source = source;
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
            const regexp = new RegExp(`(${Object.keys(key_to_property_name).join('|')})(<=?|>=?|=|!=)([-\\w\\.]*)`);
            let check_func_source = 'return true';
            this.normalized_source = '';
            for (const token of source.split(' ')) {
                const trimmed = token.trim();
                if (trimmed === '')
                    continue;
                const match = regexp.exec(trimmed);
                if (match) {
                    const key = match[1];
                    const rel = match[2] === '=' ? '==' : match[2];
                    let val = parseFloat(match[3]);
                    if (isNaN(val))
                        val = match[3].toLowerCase();
                    const prop = key_to_property_name[key];
                    if (this.normalized_source !== '')
                        this.normalized_source += ' ';
                    this.normalized_source += match[1] + match[2] + match[3];
                    check_func_source += `&&${prop}${rel}${JSON.stringify(val)}`;
                }
                else {
                    const str = trimmed.toLowerCase();
                    const escaped = JSON.stringify(str);
                    if (this.normalized_source !== '')
                        this.normalized_source += ' ';
                    this.normalized_source += str;
                    check_func_source += `&&row.display_string_lower.indexOf(${escaped})!==-1`;
                }
            }
            this.check = new Function('row', check_func_source);
        }
    }
    const sortKeys = [
        (x) => x.approved_date_string,
        (x) => x.display_string_lower,
        (x) => x.stars,
        (x) => x.pp,
        (x) => x.hit_length,
        (x) => x.max_combo,
        (x) => x.approach_rate,
        (x) => x.circle_size,
        (x) => x.fcHDDT * 2 + x.fcDT * 1e8 +
            x.fcHDHR * 2 + x.fcHR * 1e4 +
            x.fcHD * 2 + x.fcNM -
            x.min_misses,
        (x) => x.update_date,
        (x) => !x.info ? MINIMUM_DATE.valueOf() : x.info.lastPlayed.valueOf()
    ];
    function stringifyObject(obj) {
        return Object.keys(obj)
            .map(k => k + '=' + encodeURIComponent(obj[k]))
            .join('&');
    }
    function parseObject(str) {
        const res = {};
        str.split('&').forEach(part => {
            const match = part.match(/(\w+)=(.+)/);
            if (match)
                res[match[1]] = decodeURIComponent(match[2]);
        });
        return res;
    }
    function drawTableForCurrentFiltering() {
        const filter_approved_status = parseInt($('#filter-approved-status').val());
        const filter_mode = parseInt($('#filter-mode').val());
        const filter_search_query = new SearchQuery($('#filter-search-query').val());
        const filter_fc_level = parseInt($('#filter-fc-level').val());
        const filter_local_data = parseInt($('#filter-local-data').val());
        const show_full_result = $('#show-full-result').prop('checked');
        const get_fc_level = (row) => {
            if (row.min_misses !== 0)
                return 1;
            if (row.fcDT !== 0 || row.fcHDDT !== 0)
                return 8;
            if (row.fcNM === 0 && row.fcHD === 0 && row.fcHR === 0 && row.fcHDHR === 0)
                return 2;
            if (row.fcNM === 0 && row.fcHD === 0)
                return 3;
            if (row.fcHD === 0)
                return 4;
            if (row.fcHR === 0 && row.fcHDHR === 0)
                return 5;
            if (row.fcHDHR === 0)
                return 6;
            return 7;
        };
        const get_local_data_flags = (row) => {
            if (beatmapInfoMap.size === 0)
                return -1;
            let flags = 0;
            const info = beatmapInfoMap.get(row.beatmap_id_number);
            if (!info)
                return 0;
            flags |= 2;
            if (info.lastPlayed.valueOf() !== MINIMUM_DATE.valueOf())
                flags |= 1;
            return flags;
        };
        currentHashLink = '#';
        const obj = {};
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
        if (show_full_result)
            obj.f = '1';
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
                    case 1:
                        if ((flags & 1) !== 0)
                            return false;
                        break;
                    case 2:
                        if ((flags & 1) === 0)
                            return false;
                        break;
                    case 3:
                        if ((flags & 2) !== 0)
                            return false;
                        break;
                    case 4:
                        if ((flags & 2) === 0)
                            return false;
                        break;
                    case 5:
                        if ((flags & 3) !== 2)
                            return false;
                        break;
                }
            }
            return true;
        });
        const prevIndex = Array(summaryRows.length);
        for (const ord of currentSortOrder) {
            if (ord === 0)
                continue;
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
        const truncate_num = show_full_result ? Infinity : 100;
        if (indices.length > truncate_num)
            indices.length = truncate_num;
        $('#hash-link-to-the-current-table').attr('href', currentHashLink);
        drawTable(indices);
    }
    function simplifySortOrder(order, [noTies, defaultOrder]) {
        const res = [];
        const seen = Array(sortKeys.length);
        for (let i = order.length - 1; i >= 0; --i) {
            const x = order[i];
            if (x === 0)
                continue;
            const key = Math.abs(x) - 1, sign = x > 0 ? 1 : -1;
            if (seen[key])
                continue;
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
    const summaryOrderConfig = [[0, 1, 2, 3, 4, 5, 9], -3];
    const rankingOrderConfig = [[0, 1, 7], 1];
    function setQueryAccordingToHash() {
        let obj;
        try {
            obj = parseObject(location.hash.substr(1));
        }
        catch (e) {
            obj = {};
        }
        if (obj.s === undefined)
            obj.s = '1';
        if (obj.m === undefined)
            obj.m = '3';
        if (obj.q === undefined)
            obj.q = '';
        if (obj.l === undefined)
            obj.l = '0';
        if (obj.o === undefined)
            obj.o = '';
        if (obj.f === undefined)
            obj.f = '0';
        if (obj.d === undefined)
            obj.d = '0';
        $('#filter-approved-status').val(parseInt(obj.s));
        $('#filter-mode').val(parseInt(obj.m));
        $('#filter-search-query').val(obj.q);
        $('#filter-fc-level').val(parseInt(obj.l));
        $('#filter-local-data').val(parseInt(obj.d));
        $('#show-full-result').prop('checked', !!parseInt(obj.f));
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
    function pad(x) {
        return (x < 10 ? '0' : '') + x;
    }
    function formatDate(date) {
        return date.toISOString().split('T')[0] +
            ' ' + pad(date.getHours()) +
            ':' + pad(date.getMinutes());
    }
    const rankAchievedClass = [
        'SSH', 'SH', 'SS', 'S', 'A',
        'B', 'C', 'D', 'F', '-'
    ];
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
        unsortedTableRows = summaryRows.map(row => $('<tr>').append([
            [
                $('<i>').addClass(approved_status_icons[row.approved_status + 2]),
                document.createTextNode(row.approved_date_string.split(' ')[0])
            ],
            [
                $('<i>').addClass(mode_icons[row.mode]),
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
            row.stars.toFixed(2),
            row.pp.toFixed(0),
            `${Math.floor(row.hit_length / 60)}:${pad(Math.floor(row.hit_length % 60))}`,
            row.max_combo.toString(),
            row.approach_rate.toFixed(1),
            row.circle_size.toFixed(1),
            (row.min_misses !== 0 ? (row.min_misses === 1 ? '1 miss' : row.min_misses + ' misses') :
                [row.fcNM, row.fcHD, row.fcHR, row.fcHDHR, row.fcDT, row.fcHDDT].join(', ')),
            row.update_date,
            beatmapInfoMap.size === 0 ? [] :
                [
                    $('<i class="fa">').addClass(row.info ? 'fa-check-square-o' : 'fa-square-o'),
                    $('<span>').addClass('rank-' + rankAchievedClass[!row.info ? 9 : row.info.rankAchieved]),
                    $('<span>').text(!row.info || row.info.lastPlayed.valueOf() === MINIMUM_DATE.valueOf()
                        ? '---' : formatDate(row.info.lastPlayed))
                ]
        ].map(x => $('<td>').append(x)))[0]);
        unsortedTableRowsChanged = true;
        return true;
    }
    function showErrorMessage(text) {
        $('#alerts').append($('<div class="alert alert-warning alert-dismissable">')
            .text(text)
            .append('<a class="close" data-dismiss="alert"><span>&times;'));
    }
    const LOCALSTORAGE_PREFIX = 'list-maps/';
    const ENABLE_LOCALSTORAGE_SAVE = false;
    const localFiles = {};
    /*
    function dataURItoUInt8Array(dataURI: string) {
        const base64 = dataURI.split(',')[1];
        const str = atob(base64);
        const len = str.length;
        const array = new Uint8Array(len);
        for (let i = 0; i < len; ++ i) {
            array[i] = str.charCodeAt(i);
        }
        return array;
    }
    */
    const registeredCallbackMap = new Map();
    function registerCallback(callback) {
        let id;
        do
            id = Math.random();
        while (registeredCallbackMap.has(id));
        registeredCallbackMap.set(id, callback);
        return id;
    }
    function newWorker() {
        return new Worker('dist/list-maps-worker.js');
    }
    function runWorker(message, using) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                const worker = using || newWorker();
                message.id = registerCallback(resolve);
                worker.postMessage(message);
                worker.addEventListener('message', (event) => {
                    const data = event.data;
                    if (data.type === 'callback' && typeof (data.id) === 'number') {
                        const callback = registeredCallbackMap.get(data.id);
                        if (callback) {
                            registeredCallbackMap.delete(data.id);
                            callback(data);
                        }
                    }
                }, false);
            });
        });
    }
    function compressBufferToString(buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const compressed = (yield runWorker({
                type: 'compress',
                data: new Uint8Array(buffer)
            })).data;
            const chars = new Array(Math.floor(compressed.length / 2));
            for (let i = 0; i < chars.length; i += 1) {
                const code = (compressed[i * 2 + 0] & 0xff) << 8 | (compressed[i * 2 + 1] & 0xff);
                chars[i] = String.fromCharCode(code);
            }
            let res = compressed.length % 2 ? '1' : '0';
            res += chars.join('');
            if (compressed.length % 2 !== 0)
                res += String.fromCharCode((compressed[compressed.length - 1] & 0xff) << 8);
            return res;
        });
    }
    ListMaps.compressBufferToString = compressBufferToString;
    function decompressBufferFromString(str) {
        return __awaiter(this, void 0, void 0, function* () {
            const parity = str[0] === '1' ? 1 : 0;
            const len = str.length - 1 - parity;
            const array = new Uint8Array(len * 2 + parity);
            for (let i = 0; i < len; i += 1) {
                const code = str.charCodeAt(i + 1);
                array[i * 2 + 0] = code >> 8;
                array[i * 2 + 1] = code & 0xff;
            }
            if (parity !== 0)
                array[len * 2] = str.charCodeAt(len + 1) >> 8;
            const decompressed = (yield runWorker({
                type: 'decompress',
                data: array
            })).data;
            return decompressed;
        });
    }
    ListMaps.decompressBufferFromString = decompressBufferFromString;
    function reloadLocalFile(name) {
        const f = localFiles[name];
        if (name === 'osu!.db')
            $('#filter-local-data').prop('disabled', f === undefined);
        $(name === 'osu!.db' ? '#current-osudb-file' : '#current-scoresdb-file')
            .text(!f ? 'No data' : formatDate(f.uploadedDate));
        if (!f)
            return;
        if (name === 'osu!.db') {
            loadOsuDB(f.data.buffer, f.uploadedDate);
        }
        else {
        }
    }
    function loadFromLocalStorage(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ENABLE_LOCALSTORAGE_SAVE)
                return;
            const dateStr = localStorage.getItem(LOCALSTORAGE_PREFIX + name + '/uploaded-date');
            if (!dateStr)
                return;
            const encoded = localStorage.getItem(LOCALSTORAGE_PREFIX + name + '/data');
            const data = yield decompressBufferFromString(encoded);
            console.log('file ' + name + ' loaded from localStorage');
            localFiles[name] = {
                data: data,
                uploadedDate: new Date(dateStr)
            };
        });
    }
    function setLocalFile(name, file) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                const fr = new FileReader();
                fr.onload = (event) => {
                    console.log('file ' + name + ' loaded');
                    const buffer = fr.result;
                    const uploadedDate = new Date();
                    localFiles[name] = {
                        data: new Uint8Array(buffer),
                        uploadedDate: uploadedDate,
                    };
                    reloadLocalFile(name);
                    compressBufferToString(buffer).then(dataStr => {
                        console.log('file ' + name + ' compressed');
                        const current = localFiles[name];
                        if (current && current.uploadedDate.valueOf() !== uploadedDate.valueOf())
                            return;
                        if (!ENABLE_LOCALSTORAGE_SAVE)
                            return;
                        try {
                            localStorage.setItem(LOCALSTORAGE_PREFIX + name + '/data', dataStr);
                            localStorage.setItem(LOCALSTORAGE_PREFIX + name + '/uploaded-date', uploadedDate.toISOString());
                            console.log('file ' + name + ' saved to localStorage');
                        }
                        catch (e) {
                            console.error('localStorage error: ', e);
                        }
                    });
                    return resolve();
                };
                fr.readAsArrayBuffer(file);
            });
        });
    }
    class SerializationReader {
        constructor(buffer) {
            this.dv = new DataView(buffer);
            this.offset = 0;
        }
        skip(bytes) {
            this.offset += bytes;
        }
        readInt8() {
            const result = this.dv.getInt8(this.offset);
            this.offset += 1;
            return result;
        }
        readInt16() {
            const result = this.dv.getInt16(this.offset, true);
            this.offset += 2;
            return result;
        }
        readInt32() {
            const result = this.dv.getInt32(this.offset, true);
            this.offset += 4;
            return result;
        }
        readByte() {
            return this.readInt8() | 0;
        }
        readUInt16() {
            return this.readInt16() | 0;
        }
        readUInt32() {
            return this.readInt32() | 0;
        }
        readBoolean() {
            return this.readInt8() !== 0;
        }
        readULEB128() {
            let result = 0;
            for (let shift = 0;; shift += 7) {
                const byte = this.dv.getUint8(this.offset);
                this.offset += 1;
                result |= (byte & 0x7f) << shift;
                if ((byte & 0x80) === 0)
                    return result;
            }
        }
        readUint8Array(length) {
            const result = new Uint8Array(this.dv.buffer, this.offset, length);
            this.offset += length;
            return result;
        }
        readString() {
            const header = this.readInt8();
            if (header === 0)
                return '';
            const length = this.readULEB128();
            const array = this.readUint8Array(length);
            return new TextDecoder('utf-8').decode(array);
        }
        readInt64Rounded() {
            const lo = this.dv.getUint32(this.offset, true);
            const hi = this.dv.getUint32(this.offset + 4, true);
            this.offset += 8;
            return hi * 0x100000000 + lo;
        }
        readDateTime() {
            // OFFSET = 621355968000000000 = ticks from 0001/1/1 to 1970/1/1
            let lo = this.readUInt32();
            let hi = this.readUInt32();
            lo -= 3444293632; // lo bits of OFFSET
            if (lo < 0) {
                lo += 4294967296; // 2^32
                hi -= 1;
            }
            hi -= 144670508; // hi bits of OFFSET
            const ticks = hi * 4294967296 + lo;
            return new Date(ticks * 1e-4);
        }
        readSingle() {
            const result = this.dv.getFloat32(this.offset, true);
            this.offset += 4;
            return result;
        }
        readDouble() {
            const result = this.dv.getFloat64(this.offset, true);
            this.offset += 8;
            return result;
        }
        readList(callback) {
            const count = this.readInt32();
            for (let i = 0; i < count; i += 1)
                callback(i);
        }
    }
    class BeatmapInfo {
        constructor(beatmapId, lastPlayed, rankAchieved) {
            this.beatmapId = beatmapId;
            this.lastPlayed = lastPlayed;
            this.rankAchieved = rankAchieved;
        }
    }
    function readBeatmap(sr) {
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
        return new BeatmapInfo(BeatmapId, new Date(Math.max(MINIMUM_DATE.valueOf(), DateLastPlayed.valueOf())), PlayerRankFruits);
    }
    const beatmapInfoMap = new Map();
    let beatmapInfoMapVersion = MINIMUM_DATE;
    function loadOsuDB(buffer, version) {
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
        beatmapInfoMapVersion = version;
    }
    function initTable(sortKeys, orderConfig, onSortOrderChanged) {
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
            const thIndex = th.data('thIndex');
            currentSortOrder.push((thIndex + 1) * sign);
            currentSortOrder = simplifySortOrder(currentSortOrder, orderConfig);
            setTableHeadSortingMark();
            onSortOrderChanged();
        });
    }
    function main() {
        Promise.all(['osu!.db', 'scores.db']
            .map(name => loadFromLocalStorage(name)
            .then(() => reloadLocalFile(name)))).then(() => {
            if (initUnsortedTableRows())
                drawTableForCurrentFiltering();
        });
        setQueryAccordingToHash();
        window.addEventListener('hashchange', () => {
            setQueryAccordingToHash();
            drawTableForCurrentFiltering();
        });
        const onChange = () => {
            drawTableForCurrentFiltering();
        };
        for (const id of ['filter-approved-status', 'filter-mode', 'filter-fc-level', 'filter-local-data', 'show-full-result'])
            $(`#${id}`).on('change', onChange);
        for (const id of ['filter-search-query'])
            $(`#${id}`).on('input', onChange);
        initTable(sortKeys, summaryOrderConfig, onChange);
        const loadData = (data, lastModified) => {
            $('#last-update-time')
                .append($('<time>')
                .attr('datetime', lastModified.toISOString())
                .text(lastModified.toISOString().split('T')[0]));
            summaryRows = data.map(x => new SummaryRow(x));
            initUnsortedTableRows();
            drawTableForCurrentFiltering();
            $('#summary-table-loader').hide();
        };
        $.getJSON('data/summary.json').then((data, _, xhr) => {
            loadData(data, new Date(xhr.getResponseHeader('Last-Modified')));
        });
        $('#db-file-input').change((event) => __awaiter(this, void 0, void 0, function* () {
            const elem = event.target;
            if (!elem.files)
                return;
            for (let i = 0; i < elem.files.length; i += 1) {
                const file = elem.files[i];
                const name = file.name;
                if (name.indexOf('osu!.db') !== -1) {
                    yield setLocalFile('osu!.db', file);
                }
                else if (name.indexOf('scores.db') !== -1) {
                    yield setLocalFile('scores.db', file);
                }
                else {
                    showErrorMessage(`Invalid file ${name}: Please select osu!.db or scores.db`);
                    continue;
                }
                if (initUnsortedTableRows())
                    drawTableForCurrentFiltering();
            }
            elem.value = '';
        }));
    }
    function initUnsortedRankingTableRows() {
        if (rankingRows.length === 0)
            return false;
        unsortedTableRows = rankingRows.map(row => $('<tr>').append([
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
        ].map(x => $('<td>').append(x)))[0]);
        unsortedTableRowsChanged = true;
        return true;
    }
    const rankingSortKeys = [
        (x) => x.rank,
        (x) => x.pp,
        (x) => x.username_lower,
        (x) => x.display_string_lower,
        (x) => x.mods,
        (x) => x.accuracy,
        (x) => x.combo_display,
        (x) => x.date_played_string,
    ];
    function drawRankingTable() {
        const indices = rankingRows.map((_row, i) => i);
        const prevIndex = Array(rankingRows.length);
        for (const ord of currentSortOrder) {
            if (ord === 0)
                continue;
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
    function rankingMain() {
        initTable(rankingSortKeys, rankingOrderConfig, drawRankingTable);
        const loadData = (data, lastModified) => {
            $('#last-update-time')
                .append($('<time>')
                .attr('datetime', lastModified.toISOString())
                .text(lastModified.toISOString().split('T')[0]));
            rankingRows = data.map((x, i) => new RankingRow(i + 1, x));
            initUnsortedRankingTableRows();
            drawRankingTable();
            $('#summary-table-loader').hide();
        };
        $.getJSON('data/ranking.json').then((data, _, xhr) => {
            loadData(data, new Date(xhr.getResponseHeader('Last-Modified')));
        });
    }
    if (/ranking\.html$/i.test(location.pathname)) {
        $(rankingMain);
    }
    else {
        $(main);
    }
})(ListMaps || (ListMaps = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1tYXBzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpc3QtbWFwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQSxJQUFVLFFBQVEsQ0FtK0JqQjtBQW4rQkQsV0FBVSxRQUFRO0lBZWQsTUFBTSxZQUFZLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakMsTUFBTSxVQUFVO1FBeUJaLFlBQTZCLElBQW9CO1lBQXBCLFNBQUksR0FBSixJQUFJLENBQWdCO1lBQzdDO2dCQUNJLElBQUksQ0FBQyxlQUFlO2dCQUNwQixJQUFJLENBQUMsb0JBQW9CO2dCQUN6QixJQUFJLENBQUMsSUFBSTtnQkFDVCxJQUFJLENBQUMsVUFBVTtnQkFDZixJQUFJLENBQUMsYUFBYTtnQkFDbEIsSUFBSSxDQUFDLGNBQWM7Z0JBQ25CLElBQUksQ0FBQyxLQUFLO2dCQUNWLElBQUksQ0FBQyxFQUFFO2dCQUNQLElBQUksQ0FBQyxVQUFVO2dCQUNmLElBQUksQ0FBQyxTQUFTO2dCQUNkLElBQUksQ0FBQyxhQUFhO2dCQUNsQixJQUFJLENBQUMsV0FBVztnQkFDaEIsSUFBSSxDQUFDLFVBQVU7Z0JBQ2YsSUFBSSxDQUFDLElBQUk7Z0JBQ1QsSUFBSSxDQUFDLElBQUk7Z0JBQ1QsSUFBSSxDQUFDLElBQUk7Z0JBQ1QsSUFBSSxDQUFDLE1BQU07Z0JBQ1gsSUFBSSxDQUFDLElBQUk7Z0JBQ1QsSUFBSSxDQUFDLE1BQU07Z0JBQ1gsSUFBSSxDQUFDLFdBQVc7YUFDbkIsR0FBRyxJQUFJLENBQUM7WUFDVCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO1lB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bStCakIiLCJzb3VyY2VzQ29udGVudCI6WyJcclxubmFtZXNwYWNlIExpc3RNYXBzIHtcclxuXHJcbiAgICBpbnRlcmZhY2UgSlF1ZXJ5IHtcclxuICAgICAgICB0YWJsZXNvcnQoKTogdm9pZDtcclxuICAgICAgICBkYXRhKGtleTogJ3NvcnRCeScsIGtleUZ1bmM6IChcclxuICAgICAgICAgICAgdGg6IEhUTUxUYWJsZUhlYWRlckNlbGxFbGVtZW50LFxyXG4gICAgICAgICAgICB0ZDogSFRNTFRhYmxlRGF0YUNlbGxFbGVtZW50LFxyXG4gICAgICAgICAgICB0YWJsZXNvcnQ6IGFueSkgPT4gdm9pZCk6IHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgdHlwZSBTdW1tYXJ5Um93RGF0YSA9XHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgICBudW1iZXIsIHN0cmluZywgbnVtYmVyLCBzdHJpbmcsIHN0cmluZywgc3RyaW5nLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLFxyXG4gICAgICAgICAgICBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIHN0cmluZ1xyXG4gICAgICAgIF07XHJcbiAgICBjb25zdCBNSU5JTVVNX0RBVEUgPSBuZXcgRGF0ZSgwKTtcclxuICAgIGNsYXNzIFN1bW1hcnlSb3cge1xyXG4gICAgICAgIGFwcHJvdmVkX3N0YXR1czogbnVtYmVyO1xyXG4gICAgICAgIGFwcHJvdmVkX2RhdGVfc3RyaW5nOiBzdHJpbmc7XHJcbiAgICAgICAgYXBwcm92ZWRfZGF0ZTogRGF0ZTtcclxuICAgICAgICBtb2RlOiBudW1iZXI7XHJcbiAgICAgICAgYmVhdG1hcF9pZDogc3RyaW5nO1xyXG4gICAgICAgIGJlYXRtYXBfaWRfbnVtYmVyOiBudW1iZXI7XHJcbiAgICAgICAgYmVhdG1hcHNldF9pZDogc3RyaW5nO1xyXG4gICAgICAgIGRpc3BsYXlfc3RyaW5nOiBzdHJpbmc7XHJcbiAgICAgICAgZGlzcGxheV9zdHJpbmdfbG93ZXI6IHN0cmluZztcclxuICAgICAgICBzdGFyczogbnVtYmVyO1xyXG4gICAgICAgIHBwOiBudW1iZXI7XHJcbiAgICAgICAgaGl0X2xlbmd0aDogbnVtYmVyO1xyXG4gICAgICAgIG1heF9jb21ibzogbnVtYmVyO1xyXG4gICAgICAgIGFwcHJvYWNoX3JhdGU6IG51bWJlcjtcclxuICAgICAgICBjaXJjbGVfc2l6ZTogbnVtYmVyO1xyXG4gICAgICAgIG1pbl9taXNzZXM6IG51bWJlcjtcclxuICAgICAgICBmY05NOiBudW1iZXI7XHJcbiAgICAgICAgZmNIRDogbnVtYmVyO1xyXG4gICAgICAgIGZjSFI6IG51bWJlcjtcclxuICAgICAgICBmY0hESFI6IG51bWJlcjtcclxuICAgICAgICBmY0RUOiBudW1iZXI7XHJcbiAgICAgICAgZmNIRERUOiBudW1iZXI7XHJcbiAgICAgICAgdXBkYXRlX2RhdGU6IHN0cmluZztcclxuICAgICAgICBpbmZvOiBCZWF0bWFwSW5mbyB8IG51bGw7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBkYXRhOiBTdW1tYXJ5Um93RGF0YSkge1xyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcHJvdmVkX3N0YXR1cyxcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwcm92ZWRfZGF0ZV9zdHJpbmcsXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmJlYXRtYXBfaWQsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmJlYXRtYXBzZXRfaWQsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXlfc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFycyxcclxuICAgICAgICAgICAgICAgIHRoaXMucHAsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmhpdF9sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1heF9jb21ibyxcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwcm9hY2hfcmF0ZSxcclxuICAgICAgICAgICAgICAgIHRoaXMuY2lyY2xlX3NpemUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbl9taXNzZXMsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZjTk0sXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZjSEQsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZjSFIsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZjSERIUixcclxuICAgICAgICAgICAgICAgIHRoaXMuZmNEVCxcclxuICAgICAgICAgICAgICAgIHRoaXMuZmNIRERULFxyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVfZGF0ZSxcclxuICAgICAgICAgICAgXSA9IGRhdGE7XHJcbiAgICAgICAgICAgIHRoaXMuYmVhdG1hcF9pZF9udW1iZXIgPSBwYXJzZUludCh0aGlzLmJlYXRtYXBfaWQpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcHJvdmVkX2RhdGUgPSBuZXcgRGF0ZSh0aGlzLmFwcHJvdmVkX2RhdGVfc3RyaW5nLnJlcGxhY2UoJyAnLCAnVCcpICsgJyswODowMCcpO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3BsYXlfc3RyaW5nX2xvd2VyID0gdGhpcy5kaXNwbGF5X3N0cmluZy50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmluZm8gPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0eXBlIFJhbmtpbmdSb3dEYXRhID1cclxuICAgICAgICBbXHJcbiAgICAgICAgICAgIG51bWJlciwgbnVtYmVyLCBzdHJpbmcsIHN0cmluZywgc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgc3RyaW5nLCBudW1iZXIsIHN0cmluZywgc3RyaW5nXHJcbiAgICAgICAgXTtcclxuICAgIGNsYXNzIFJhbmtpbmdSb3cge1xyXG4gICAgICAgIHN0YXJzOiBudW1iZXI7XHJcbiAgICAgICAgcHA6IG51bWJlcjtcclxuICAgICAgICB1c2VyX2lkOiBzdHJpbmc7XHJcbiAgICAgICAgdXNlcm5hbWU6IHN0cmluZztcclxuICAgICAgICB1c2VybmFtZV9sb3dlcjogc3RyaW5nO1xyXG4gICAgICAgIGJlYXRtYXBfaWQ6IHN0cmluZztcclxuICAgICAgICBiZWF0bWFwX2lkX251bWJlcjogbnVtYmVyO1xyXG4gICAgICAgIGJlYXRtYXBzZXRfaWQ6IHN0cmluZztcclxuICAgICAgICBkaXNwbGF5X3N0cmluZzogc3RyaW5nO1xyXG4gICAgICAgIGRpc3BsYXlfc3RyaW5nX2xvd2VyOiBzdHJpbmc7XHJcbiAgICAgICAgbW9kczogc3RyaW5nO1xyXG4gICAgICAgIGFjY3VyYWN5OiBudW1iZXI7XHJcbiAgICAgICAgY29tYm9fZGlzcGxheTogc3RyaW5nO1xyXG4gICAgICAgIGRhdGVfcGxheWVkX3N0cmluZzogc3RyaW5nO1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSByYW5rOiBudW1iZXIsIHByaXZhdGUgcmVhZG9ubHkgZGF0YTogUmFua2luZ1Jvd0RhdGEpIHtcclxuICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFycyxcclxuICAgICAgICAgICAgICAgIHRoaXMucHAsXHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJfaWQsXHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJuYW1lLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5iZWF0bWFwX2lkLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5iZWF0bWFwc2V0X2lkLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5X3N0cmluZyxcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kcyxcclxuICAgICAgICAgICAgICAgIHRoaXMuYWNjdXJhY3ksXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbWJvX2Rpc3BsYXksXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGVfcGxheWVkX3N0cmluZ1xyXG4gICAgICAgICAgICBdID0gZGF0YTtcclxuICAgICAgICAgICAgdGhpcy5iZWF0bWFwX2lkX251bWJlciA9IHBhcnNlSW50KHRoaXMuYmVhdG1hcF9pZCk7XHJcbiAgICAgICAgICAgIHRoaXMudXNlcm5hbWVfbG93ZXIgPSB0aGlzLnVzZXJuYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheV9zdHJpbmdfbG93ZXIgPSB0aGlzLmRpc3BsYXlfc3RyaW5nLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBsZXQgc3VtbWFyeVJvd3M6IFN1bW1hcnlSb3dbXSA9IFtdO1xyXG4gICAgbGV0IHJhbmtpbmdSb3dzOiBSYW5raW5nUm93W10gPSBbXTtcclxuICAgIGxldCB1bnNvcnRlZFRhYmxlUm93czogSFRNTFRhYmxlUm93RWxlbWVudFtdID0gW107XHJcbiAgICBsZXQgY3VycmVudFNvcnRPcmRlcjogbnVtYmVyW10gPSBbXTtcclxuICAgIGxldCBjdXJyZW50SGFzaExpbmsgPSAnIyc7XHJcblxyXG4gICAgbGV0IHByZXZpb3VzSW5kaWNlcyA9ICcnO1xyXG4gICAgbGV0IHVuc29ydGVkVGFibGVSb3dzQ2hhbmdlZCA9IGZhbHNlO1xyXG4gICAgZnVuY3Rpb24gZHJhd1RhYmxlKGluZGljZXM6IG51bWJlcltdKSB7XHJcbiAgICAgICAgY29uc3Qgc3RyID0gaW5kaWNlcy5qb2luKCcsJyk7XHJcbiAgICAgICAgaWYgKCF1bnNvcnRlZFRhYmxlUm93c0NoYW5nZWQgJiYgcHJldmlvdXNJbmRpY2VzID09PSBzdHIpIHJldHVybjtcclxuICAgICAgICB1bnNvcnRlZFRhYmxlUm93c0NoYW5nZWQgPSBmYWxzZTtcclxuICAgICAgICBwcmV2aW91c0luZGljZXMgPSBzdHI7XHJcbiAgICAgICAgJCgnI3N1bW1hcnktdGFibGUgPiB0Ym9keScpXHJcbiAgICAgICAgICAgIC5lbXB0eSgpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoaW5kaWNlcy5tYXAoaW5kZXggPT4gdW5zb3J0ZWRUYWJsZVJvd3NbaW5kZXhdKSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgU2VhcmNoUXVlcnkge1xyXG4gICAgICAgIHB1YmxpYyByZWFkb25seSBjaGVjazogKHJvdzogU3VtbWFyeVJvdykgPT4gYm9vbGVhbjtcclxuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgbm9ybWFsaXplZF9zb3VyY2U6IHN0cmluZztcclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgc291cmNlOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgY29uc3Qga2V5X3RvX3Byb3BlcnR5X25hbWUgPSB7XHJcbiAgICAgICAgICAgICAgICAnc3RhdHVzJzogJ1wicHBwcmFxbFwiW3Jvdy5hcHByb3ZlZF9zdGF0dXMrMl0nLFxyXG4gICAgICAgICAgICAgICAgJ21vZGUnOiAnXCJvdGNtXCJbcm93Lm1vZGVdJyxcclxuICAgICAgICAgICAgICAgICdzdGFycyc6ICdyb3cuc3RhcnMnLFxyXG4gICAgICAgICAgICAgICAgJ3BwJzogJ3Jvdy5wcCcsXHJcbiAgICAgICAgICAgICAgICAnbGVuZ3RoJzogJ3Jvdy5oaXRfbGVuZ3RoJyxcclxuICAgICAgICAgICAgICAgICdjb21ibyc6ICdyb3cubWF4X2NvbWJvJyxcclxuICAgICAgICAgICAgICAgICdhcic6ICdyb3cuYXBwcm9hY2hfcmF0ZScsXHJcbiAgICAgICAgICAgICAgICAnY3MnOiAncm93LmNpcmNsZV9zaXplJyxcclxuICAgICAgICAgICAgICAgICdwbGF5ZWQnOiBgKCFyb3cuaW5mbz9JbmZpbml0eTooJHtuZXcgRGF0ZSgpLnZhbHVlT2YoKX0tcm93LmluZm8ubGFzdFBsYXllZC52YWx1ZU9mKCkpLyR7MWUzICogNjAgKiA2MCAqIDI0fSlgLFxyXG4gICAgICAgICAgICAgICAgJ3VucGxheWVkJzogYChyb3cuaW5mbyYmcm93LmluZm8ubGFzdFBsYXllZC52YWx1ZU9mKCkhPT0ke01JTklNVU1fREFURS52YWx1ZU9mKCl9Pyd5JzonJylgLFxyXG4gICAgICAgICAgICAgICAgJ2RhdGUnOiBgKCR7bmV3IERhdGUoKS52YWx1ZU9mKCl9LXJvdy5hcHByb3ZlZF9kYXRlLnZhbHVlT2YoKSkvJHsxZTMgKiA2MCAqIDYwICogMjR9YCxcclxuICAgICAgICAgICAgICAgICdyYW5rJzogYCgke0pTT04uc3RyaW5naWZ5KHJhbmtBY2hpZXZlZENsYXNzKX1bIXJvdy5pbmZvPzk6cm93LmluZm8ucmFua0FjaGlldmVkXSkudG9Mb3dlckNhc2UoKWBcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgY29uc3QgcmVnZXhwID0gbmV3IFJlZ0V4cChgKCR7XHJcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhrZXlfdG9fcHJvcGVydHlfbmFtZSkuam9pbignfCcpXHJcbiAgICAgICAgICAgICAgICB9KSg8PT98Pj0/fD18IT0pKFstXFxcXHdcXFxcLl0qKWApO1xyXG4gICAgICAgICAgICBsZXQgY2hlY2tfZnVuY19zb3VyY2UgPSAncmV0dXJuIHRydWUnO1xyXG4gICAgICAgICAgICB0aGlzLm5vcm1hbGl6ZWRfc291cmNlID0gJyc7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgdG9rZW4gb2Ygc291cmNlLnNwbGl0KCcgJykpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRyaW1tZWQgPSB0b2tlbi50cmltKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodHJpbW1lZCA9PT0gJycpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSByZWdleHAuZXhlYyh0cmltbWVkKTtcclxuICAgICAgICAgICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IG1hdGNoWzFdO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbCA9IG1hdGNoWzJdID09PSAnPScgPyAnPT0nIDogbWF0Y2hbMl07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbDogbnVtYmVyIHwgc3RyaW5nID0gcGFyc2VGbG9hdChtYXRjaFszXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzTmFOKHZhbCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IG1hdGNoWzNdLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcCA9IChrZXlfdG9fcHJvcGVydHlfbmFtZSBhcyBhbnkpW2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubm9ybWFsaXplZF9zb3VyY2UgIT09ICcnKSB0aGlzLm5vcm1hbGl6ZWRfc291cmNlICs9ICcgJztcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5vcm1hbGl6ZWRfc291cmNlICs9IG1hdGNoWzFdICsgbWF0Y2hbMl0gKyBtYXRjaFszXTtcclxuICAgICAgICAgICAgICAgICAgICBjaGVja19mdW5jX3NvdXJjZSArPSBgJiYke3Byb3B9JHtyZWx9JHtKU09OLnN0cmluZ2lmeSh2YWwpfWA7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0ciA9IHRyaW1tZWQudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlc2NhcGVkID0gSlNPTi5zdHJpbmdpZnkoc3RyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5ub3JtYWxpemVkX3NvdXJjZSAhPT0gJycpIHRoaXMubm9ybWFsaXplZF9zb3VyY2UgKz0gJyAnO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubm9ybWFsaXplZF9zb3VyY2UgKz0gc3RyO1xyXG4gICAgICAgICAgICAgICAgICAgIGNoZWNrX2Z1bmNfc291cmNlICs9IGAmJnJvdy5kaXNwbGF5X3N0cmluZ19sb3dlci5pbmRleE9mKCR7ZXNjYXBlZH0pIT09LTFgO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuY2hlY2sgPSBuZXcgRnVuY3Rpb24oJ3JvdycsIGNoZWNrX2Z1bmNfc291cmNlKSBhcyBhbnk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNvcnRLZXlzID0gW1xyXG4gICAgICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LmFwcHJvdmVkX2RhdGVfc3RyaW5nLFxyXG4gICAgICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LmRpc3BsYXlfc3RyaW5nX2xvd2VyLFxyXG4gICAgICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LnN0YXJzLFxyXG4gICAgICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LnBwLFxyXG4gICAgICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LmhpdF9sZW5ndGgsXHJcbiAgICAgICAgKHg6IFN1bW1hcnlSb3cpID0+IHgubWF4X2NvbWJvLFxyXG4gICAgICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LmFwcHJvYWNoX3JhdGUsXHJcbiAgICAgICAgKHg6IFN1bW1hcnlSb3cpID0+IHguY2lyY2xlX3NpemUsXHJcbiAgICAgICAgKHg6IFN1bW1hcnlSb3cpID0+XHJcbiAgICAgICAgICAgIHguZmNIRERUICogMiArIHguZmNEVCAqIDFlOCArXHJcbiAgICAgICAgICAgIHguZmNIREhSICogMiArIHguZmNIUiAqIDFlNCArXHJcbiAgICAgICAgICAgIHguZmNIRCAqIDIgKyB4LmZjTk0gLVxyXG4gICAgICAgICAgICB4Lm1pbl9taXNzZXMsXHJcbiAgICAgICAgKHg6IFN1bW1hcnlSb3cpID0+IHgudXBkYXRlX2RhdGUsXHJcbiAgICAgICAgKHg6IFN1bW1hcnlSb3cpID0+ICF4LmluZm8gPyBNSU5JTVVNX0RBVEUudmFsdWVPZigpIDogeC5pbmZvLmxhc3RQbGF5ZWQudmFsdWVPZigpXHJcbiAgICBdO1xyXG5cclxuICAgIGZ1bmN0aW9uIHN0cmluZ2lmeU9iamVjdChvYmo6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nOyB9KTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKVxyXG4gICAgICAgICAgICAubWFwKGsgPT4gayArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChvYmpba10pKVxyXG4gICAgICAgICAgICAuam9pbignJicpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlT2JqZWN0KHN0cjogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgcmVzID0ge307XHJcbiAgICAgICAgc3RyLnNwbGl0KCcmJykuZm9yRWFjaChwYXJ0ID0+IHtcclxuICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSBwYXJ0Lm1hdGNoKC8oXFx3Kyk9KC4rKS8pO1xyXG4gICAgICAgICAgICBpZiAobWF0Y2gpXHJcbiAgICAgICAgICAgICAgICAocmVzIGFzIGFueSlbbWF0Y2hbMV1dID0gZGVjb2RlVVJJQ29tcG9uZW50KG1hdGNoWzJdKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRyYXdUYWJsZUZvckN1cnJlbnRGaWx0ZXJpbmcoKSB7XHJcbiAgICAgICAgY29uc3QgZmlsdGVyX2FwcHJvdmVkX3N0YXR1cyA9IHBhcnNlSW50KCQoJyNmaWx0ZXItYXBwcm92ZWQtc3RhdHVzJykudmFsKCkgYXMgc3RyaW5nKTtcclxuICAgICAgICBjb25zdCBmaWx0ZXJfbW9kZSA9IHBhcnNlSW50KCQoJyNmaWx0ZXItbW9kZScpLnZhbCgpIGFzIHN0cmluZyk7XHJcbiAgICAgICAgY29uc3QgZmlsdGVyX3NlYXJjaF9xdWVyeSA9IG5ldyBTZWFyY2hRdWVyeSgoJCgnI2ZpbHRlci1zZWFyY2gtcXVlcnknKS52YWwoKSBhcyBzdHJpbmcpKTtcclxuICAgICAgICBjb25zdCBmaWx0ZXJfZmNfbGV2ZWwgPSBwYXJzZUludCgkKCcjZmlsdGVyLWZjLWxldmVsJykudmFsKCkgYXMgc3RyaW5nKTtcclxuICAgICAgICBjb25zdCBmaWx0ZXJfbG9jYWxfZGF0YSA9IHBhcnNlSW50KCQoJyNmaWx0ZXItbG9jYWwtZGF0YScpLnZhbCgpIGFzIHN0cmluZyk7XHJcbiAgICAgICAgY29uc3Qgc2hvd19mdWxsX3Jlc3VsdCA9ICQoJyNzaG93LWZ1bGwtcmVzdWx0JykucHJvcCgnY2hlY2tlZCcpO1xyXG5cclxuICAgICAgICBjb25zdCBnZXRfZmNfbGV2ZWwgPSAocm93OiBTdW1tYXJ5Um93KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyb3cubWluX21pc3NlcyAhPT0gMCkgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIGlmIChyb3cuZmNEVCAhPT0gMCB8fCByb3cuZmNIRERUICE9PSAwKSByZXR1cm4gODtcclxuICAgICAgICAgICAgaWYgKHJvdy5mY05NID09PSAwICYmIHJvdy5mY0hEID09PSAwICYmIHJvdy5mY0hSID09PSAwICYmIHJvdy5mY0hESFIgPT09IDApIHJldHVybiAyO1xyXG4gICAgICAgICAgICBpZiAocm93LmZjTk0gPT09IDAgJiYgcm93LmZjSEQgPT09IDApIHJldHVybiAzO1xyXG4gICAgICAgICAgICBpZiAocm93LmZjSEQgPT09IDApIHJldHVybiA0O1xyXG4gICAgICAgICAgICBpZiAocm93LmZjSFIgPT09IDAgJiYgcm93LmZjSERIUiA9PT0gMCkgcmV0dXJuIDU7XHJcbiAgICAgICAgICAgIGlmIChyb3cuZmNIREhSID09PSAwKSByZXR1cm4gNjtcclxuICAgICAgICAgICAgcmV0dXJuIDc7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgZ2V0X2xvY2FsX2RhdGFfZmxhZ3MgPSAocm93OiBTdW1tYXJ5Um93KTogbnVtYmVyID0+IHtcclxuICAgICAgICAgICAgaWYgKGJlYXRtYXBJbmZvTWFwLnNpemUgPT09IDApIHJldHVybiAtMTtcclxuICAgICAgICAgICAgbGV0IGZsYWdzID0gMDtcclxuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGJlYXRtYXBJbmZvTWFwLmdldChyb3cuYmVhdG1hcF9pZF9udW1iZXIpO1xyXG4gICAgICAgICAgICBpZiAoIWluZm8pIHJldHVybiAwO1xyXG4gICAgICAgICAgICBmbGFncyB8PSAyO1xyXG4gICAgICAgICAgICBpZiAoaW5mby5sYXN0UGxheWVkLnZhbHVlT2YoKSAhPT0gTUlOSU1VTV9EQVRFLnZhbHVlT2YoKSlcclxuICAgICAgICAgICAgICAgIGZsYWdzIHw9IDE7XHJcbiAgICAgICAgICAgIHJldHVybiBmbGFncztcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjdXJyZW50SGFzaExpbmsgPSAnIyc7XHJcbiAgICAgICAgY29uc3Qgb2JqID0ge30gYXMgeyBba2V5OiBzdHJpbmddOiBzdHJpbmc7IH07XHJcbiAgICAgICAgaWYgKGZpbHRlcl9hcHByb3ZlZF9zdGF0dXMgIT09IDEpXHJcbiAgICAgICAgICAgIG9iai5zID0gZmlsdGVyX2FwcHJvdmVkX3N0YXR1cy50b1N0cmluZygpO1xyXG4gICAgICAgIGlmIChmaWx0ZXJfbW9kZSAhPT0gMylcclxuICAgICAgICAgICAgb2JqLm0gPSBmaWx0ZXJfbW9kZS50b1N0cmluZygpO1xyXG4gICAgICAgIGlmIChmaWx0ZXJfc2VhcmNoX3F1ZXJ5Lm5vcm1hbGl6ZWRfc291cmNlICE9PSAnJylcclxuICAgICAgICAgICAgb2JqLnEgPSBmaWx0ZXJfc2VhcmNoX3F1ZXJ5Lm5vcm1hbGl6ZWRfc291cmNlO1xyXG4gICAgICAgIGlmIChmaWx0ZXJfZmNfbGV2ZWwgIT09IDApXHJcbiAgICAgICAgICAgIG9iai5sID0gZmlsdGVyX2ZjX2xldmVsLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgaWYgKGZpbHRlcl9sb2NhbF9kYXRhICE9PSAwKVxyXG4gICAgICAgICAgICBvYmouZCA9IGZpbHRlcl9sb2NhbF9kYXRhLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRTb3J0T3JkZXIubGVuZ3RoICE9PSAwKVxyXG4gICAgICAgICAgICBvYmoubyA9IGN1cnJlbnRTb3J0T3JkZXIuam9pbignLicpO1xyXG4gICAgICAgIGlmIChzaG93X2Z1bGxfcmVzdWx0KVxyXG4gICAgICAgICAgICBvYmouZiA9ICcxJztcclxuXHJcbiAgICAgICAgY3VycmVudEhhc2hMaW5rICs9IHN0cmluZ2lmeU9iamVjdChvYmopO1xyXG4gICAgICAgIGhpc3RvcnkucmVwbGFjZVN0YXRlKHt9LCBkb2N1bWVudC50aXRsZSwgbG9jYXRpb24ucGF0aG5hbWUgKyAoY3VycmVudEhhc2hMaW5rID09PSAnIycgPyAnJyA6IGN1cnJlbnRIYXNoTGluaykpO1xyXG5cclxuICAgICAgICBjb25zdCBpbmRpY2VzID0gc3VtbWFyeVJvd3MubWFwKChfLCBpbmRleCkgPT4gaW5kZXgpLmZpbHRlcihpbmRleCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJvdyA9IHN1bW1hcnlSb3dzW2luZGV4XTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmaWx0ZXJfYXBwcm92ZWRfc3RhdHVzID09PSAxICYmXHJcbiAgICAgICAgICAgICAgICAocm93LmFwcHJvdmVkX3N0YXR1cyAhPT0gMSAmJiByb3cuYXBwcm92ZWRfc3RhdHVzICE9PSAyKSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgaWYgKGZpbHRlcl9hcHByb3ZlZF9zdGF0dXMgPT09IDIgJiYgcm93LmFwcHJvdmVkX3N0YXR1cyAhPT0gNClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmaWx0ZXJfbW9kZSA9PT0gMSAmJiByb3cubW9kZSAhPT0gMClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgaWYgKGZpbHRlcl9tb2RlID09PSAyICYmIHJvdy5tb2RlICE9PSAyKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFmaWx0ZXJfc2VhcmNoX3F1ZXJ5LmNoZWNrKHJvdykpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAoZmlsdGVyX2ZjX2xldmVsICE9PSAwICYmIGdldF9mY19sZXZlbChyb3cpICE9PSBmaWx0ZXJfZmNfbGV2ZWwpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAoZmlsdGVyX2xvY2FsX2RhdGEgIT09IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZsYWdzID0gZ2V0X2xvY2FsX2RhdGFfZmxhZ3Mocm93KTtcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZmlsdGVyX2xvY2FsX2RhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6IGlmICgoZmxhZ3MgJiAxKSAhPT0gMCkgcmV0dXJuIGZhbHNlOyBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6IGlmICgoZmxhZ3MgJiAxKSA9PT0gMCkgcmV0dXJuIGZhbHNlOyBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDM6IGlmICgoZmxhZ3MgJiAyKSAhPT0gMCkgcmV0dXJuIGZhbHNlOyBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDQ6IGlmICgoZmxhZ3MgJiAyKSA9PT0gMCkgcmV0dXJuIGZhbHNlOyBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDU6IGlmICgoZmxhZ3MgJiAzKSAhPT0gMikgcmV0dXJuIGZhbHNlOyBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHByZXZJbmRleCA9IEFycmF5KHN1bW1hcnlSb3dzLmxlbmd0aCk7XHJcbiAgICAgICAgZm9yIChjb25zdCBvcmQgb2YgY3VycmVudFNvcnRPcmRlcikge1xyXG4gICAgICAgICAgICBpZiAob3JkID09PSAwKSBjb250aW51ZTtcclxuICAgICAgICAgICAgaW5kaWNlcy5mb3JFYWNoKCh4LCBpKSA9PiBwcmV2SW5kZXhbeF0gPSBpKTtcclxuICAgICAgICAgICAgY29uc3Qgc29ydEtleSA9IHNvcnRLZXlzW01hdGguYWJzKG9yZCkgLSAxXTtcclxuICAgICAgICAgICAgY29uc3Qgc2lnbiA9IG9yZCA+IDAgPyAxIDogLTE7XHJcbiAgICAgICAgICAgIGluZGljZXMuc29ydCgoeCwgeSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qga3ggPSBzb3J0S2V5KHN1bW1hcnlSb3dzW3hdKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGt5ID0gc29ydEtleShzdW1tYXJ5Um93c1t5XSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ga3ggPCBreSA/IC1zaWduIDoga3ggPiBreSA/IHNpZ24gOiBwcmV2SW5kZXhbeF0gLSBwcmV2SW5kZXhbeV07XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJCgnI251bS1yZXN1bHRzJykudGV4dChpbmRpY2VzLmxlbmd0aCA9PT0gMSA/ICcxIG1hcCcgOiBpbmRpY2VzLmxlbmd0aC50b1N0cmluZygpICsgJyBtYXBzJyk7XHJcbiAgICAgICAgY29uc3QgdHJ1bmNhdGVfbnVtID0gc2hvd19mdWxsX3Jlc3VsdCA/IEluZmluaXR5IDogMTAwO1xyXG4gICAgICAgIGlmIChpbmRpY2VzLmxlbmd0aCA+IHRydW5jYXRlX251bSlcclxuICAgICAgICAgICAgaW5kaWNlcy5sZW5ndGggPSB0cnVuY2F0ZV9udW07XHJcblxyXG4gICAgICAgICQoJyNoYXNoLWxpbmstdG8tdGhlLWN1cnJlbnQtdGFibGUnKS5hdHRyKCdocmVmJywgY3VycmVudEhhc2hMaW5rKTtcclxuXHJcbiAgICAgICAgZHJhd1RhYmxlKGluZGljZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNpbXBsaWZ5U29ydE9yZGVyKG9yZGVyOiBudW1iZXJbXSwgW25vVGllcywgZGVmYXVsdE9yZGVyXTogW251bWJlcltdLCBudW1iZXJdKTogbnVtYmVyW10ge1xyXG4gICAgICAgIGNvbnN0IHJlcyA9IFtdO1xyXG4gICAgICAgIGNvbnN0IHNlZW4gPSBBcnJheShzb3J0S2V5cy5sZW5ndGgpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSBvcmRlci5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xyXG4gICAgICAgICAgICBjb25zdCB4ID0gb3JkZXJbaV07XHJcbiAgICAgICAgICAgIGlmICh4ID09PSAwKSBjb250aW51ZTtcclxuICAgICAgICAgICAgY29uc3Qga2V5ID0gTWF0aC5hYnMoeCkgLSAxLCBzaWduID0geCA+IDAgPyAxIDogLTE7XHJcbiAgICAgICAgICAgIGlmIChzZWVuW2tleV0pIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBzZWVuW2tleV0gPSBzaWduO1xyXG4gICAgICAgICAgICByZXMucHVzaCh4KTtcclxuICAgICAgICAgICAgaWYgKG5vVGllcy5pbmRleE9mKGtleSkgIT09IC0xKSAvLyB0aGVyZSBpcyBhbG1vc3Qgbm8gdGllc1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZXMubGVuZ3RoICE9PSAwICYmIHJlc1tyZXMubGVuZ3RoIC0gMV0gPT09IGRlZmF1bHRPcmRlcilcclxuICAgICAgICAgICAgcmVzLnBvcCgpO1xyXG4gICAgICAgIHJlcy5yZXZlcnNlKCk7XHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzdW1tYXJ5T3JkZXJDb25maWc6IFtudW1iZXJbXSwgbnVtYmVyXSA9IFtbMCwgMSwgMiwgMywgNCwgNSwgOV0sIC0zXTtcclxuICAgIGNvbnN0IHJhbmtpbmdPcmRlckNvbmZpZzogW251bWJlcltdLCBudW1iZXJdID0gW1swLCAxLCA3XSwgMV07XHJcbiAgICBmdW5jdGlvbiBzZXRRdWVyeUFjY29yZGluZ1RvSGFzaCgpIHtcclxuICAgICAgICBsZXQgb2JqOiB7IFtrOiBzdHJpbmddOiBzdHJpbmc7IH07XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgb2JqID0gcGFyc2VPYmplY3QobG9jYXRpb24uaGFzaC5zdWJzdHIoMSkpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgb2JqID0ge307XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvYmoucyA9PT0gdW5kZWZpbmVkKSBvYmoucyA9ICcxJztcclxuICAgICAgICBpZiAob2JqLm0gPT09IHVuZGVmaW5lZCkgb2JqLm0gPSAnMyc7XHJcbiAgICAgICAgaWYgKG9iai5xID09PSB1bmRlZmluZWQpIG9iai5xID0gJyc7XHJcbiAgICAgICAgaWYgKG9iai5sID09PSB1bmRlZmluZWQpIG9iai5sID0gJzAnO1xyXG4gICAgICAgIGlmIChvYmoubyA9PT0gdW5kZWZpbmVkKSBvYmoubyA9ICcnO1xyXG4gICAgICAgIGlmIChvYmouZiA9PT0gdW5kZWZpbmVkKSBvYmouZiA9ICcwJztcclxuICAgICAgICBpZiAob2JqLmQgPT09IHVuZGVmaW5lZCkgb2JqLmQgPSAnMCc7XHJcbiAgICAgICAgJCgnI2ZpbHRlci1hcHByb3ZlZC1zdGF0dXMnKS52YWwocGFyc2VJbnQob2JqLnMpKTtcclxuICAgICAgICAkKCcjZmlsdGVyLW1vZGUnKS52YWwocGFyc2VJbnQob2JqLm0pKTtcclxuICAgICAgICAkKCcjZmlsdGVyLXNlYXJjaC1xdWVyeScpLnZhbChvYmoucSk7XHJcbiAgICAgICAgJCgnI2ZpbHRlci1mYy1sZXZlbCcpLnZhbChwYXJzZUludChvYmoubCkpO1xyXG4gICAgICAgICQoJyNmaWx0ZXItbG9jYWwtZGF0YScpLnZhbChwYXJzZUludChvYmouZCkpO1xyXG4gICAgICAgICQoJyNzaG93LWZ1bGwtcmVzdWx0JykucHJvcCgnY2hlY2tlZCcsICEhcGFyc2VJbnQob2JqLmYpKTtcclxuICAgICAgICBjdXJyZW50U29ydE9yZGVyID0gc2ltcGxpZnlTb3J0T3JkZXIob2JqLm8uc3BsaXQoJy4nKS5tYXAoeCA9PiBwYXJzZUludCh4KSB8fCAwKSwgc3VtbWFyeU9yZGVyQ29uZmlnKTtcclxuICAgICAgICBzZXRUYWJsZUhlYWRTb3J0aW5nTWFyaygpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNldFRhYmxlSGVhZFNvcnRpbmdNYXJrKCkge1xyXG4gICAgICAgICQoJy5zb3J0ZWQnKS5yZW1vdmVDbGFzcygnc29ydGVkIGFzY2VuZGluZyBkZXNjZW5kaW5nJyk7XHJcbiAgICAgICAgY29uc3QgeCA9IGN1cnJlbnRTb3J0T3JkZXIubGVuZ3RoID09PSAwID9cclxuICAgICAgICAgICAgLTMgOiAvLyBzdGFycyBkZXNjXHJcbiAgICAgICAgICAgIGN1cnJlbnRTb3J0T3JkZXJbY3VycmVudFNvcnRPcmRlci5sZW5ndGggLSAxXTtcclxuICAgICAgICBjb25zdCBpbmRleCA9IE1hdGguYWJzKHgpIC0gMTtcclxuICAgICAgICAkKCQoJyNzdW1tYXJ5LXRhYmxlID4gdGhlYWQgPiB0ciA+IHRoJylbaW5kZXhdKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ3NvcnRlZCcpLmFkZENsYXNzKHggPiAwID8gJ2FzY2VuZGluZycgOiAnZGVzY2VuZGluZycpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhZCh4OiBudW1iZXIpIHtcclxuICAgICAgICByZXR1cm4gKHggPCAxMCA/ICcwJyA6ICcnKSArIHg7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZm9ybWF0RGF0ZShkYXRlOiBEYXRlKSB7XHJcbiAgICAgICAgcmV0dXJuIGRhdGUudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdICtcclxuICAgICAgICAgICAgJyAnICsgcGFkKGRhdGUuZ2V0SG91cnMoKSkgK1xyXG4gICAgICAgICAgICAnOicgKyBwYWQoZGF0ZS5nZXRNaW51dGVzKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJhbmtBY2hpZXZlZENsYXNzID0gW1xyXG4gICAgICAgICdTU0gnLCAnU0gnLCAnU1MnLCAnUycsICdBJyxcclxuICAgICAgICAnQicsICdDJywgJ0QnLCAnRicsICctJ1xyXG4gICAgXTtcclxuXHJcbiAgICBsZXQgYmVhdG1hcEluZm9NYXBVc2VkVmVyc2lvbiA9IE1JTklNVU1fREFURTtcclxuICAgIGZ1bmN0aW9uIGluaXRVbnNvcnRlZFRhYmxlUm93cygpIHtcclxuICAgICAgICBpZiAoc3VtbWFyeVJvd3MubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICh1bnNvcnRlZFRhYmxlUm93cy5sZW5ndGggIT09IDAgJiYgYmVhdG1hcEluZm9NYXBVc2VkVmVyc2lvbiA9PT0gYmVhdG1hcEluZm9NYXBWZXJzaW9uKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgYmVhdG1hcEluZm9NYXBVc2VkVmVyc2lvbiA9IGJlYXRtYXBJbmZvTWFwVmVyc2lvbjtcclxuICAgICAgICBpZiAoYmVhdG1hcEluZm9NYXAuc2l6ZSAhPT0gMCkge1xyXG4gICAgICAgICAgICBzdW1tYXJ5Um93cy5mb3JFYWNoKHJvdyA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gYmVhdG1hcEluZm9NYXAuZ2V0KHJvdy5iZWF0bWFwX2lkX251bWJlcik7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5mbylcclxuICAgICAgICAgICAgICAgICAgICByb3cuaW5mbyA9IGluZm87XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbW9kZV9pY29ucyA9IFtcclxuICAgICAgICAgICAgJ2ZhIGZhLWV4Y2hhbmdlJyxcclxuICAgICAgICAgICAgJycsXHJcbiAgICAgICAgICAgICdmYSBmYS10aW50JyxcclxuICAgICAgICAgICAgJycsXHJcbiAgICAgICAgXTtcclxuICAgICAgICBjb25zdCBhcHByb3ZlZF9zdGF0dXNfaWNvbnMgPSBbXHJcbiAgICAgICAgICAgICdmYSBmYS1xdWVzdGlvbicsXHJcbiAgICAgICAgICAgICdmYSBmYS1xdWVzdGlvbicsXHJcbiAgICAgICAgICAgICdmYSBmYS1xdWVzdGlvbicsXHJcbiAgICAgICAgICAgICdmYSBmYS1hbmdsZS1kb3VibGUtcmlnaHQnLFxyXG4gICAgICAgICAgICAnZmEgZmEtZmlyZScsXHJcbiAgICAgICAgICAgICdmYSBmYS1jaGVjaycsXHJcbiAgICAgICAgICAgICdmYSBmYS1oZWFydC1vJyxcclxuICAgICAgICBdO1xyXG4gICAgICAgIHVuc29ydGVkVGFibGVSb3dzID0gc3VtbWFyeVJvd3MubWFwKHJvdyA9PlxyXG4gICAgICAgICAgICAkKCc8dHI+JykuYXBwZW5kKFtcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICAkKCc8aT4nKS5hZGRDbGFzcyhhcHByb3ZlZF9zdGF0dXNfaWNvbnNbcm93LmFwcHJvdmVkX3N0YXR1cyArIDJdKSxcclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShyb3cuYXBwcm92ZWRfZGF0ZV9zdHJpbmcuc3BsaXQoJyAnKVswXSlcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgJCgnPGk+JykuYWRkQ2xhc3MobW9kZV9pY29uc1tyb3cubW9kZV0pLFxyXG4gICAgICAgICAgICAgICAgICAgICQoJzxhPicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYGh0dHBzOi8vb3N1LnBweS5zaC9iLyR7cm93LmJlYXRtYXBfaWR9P209MmApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC50ZXh0KHJvdy5kaXNwbGF5X3N0cmluZyksXHJcbiAgICAgICAgICAgICAgICAgICAgcm93LmJlYXRtYXBfaWRfbnVtYmVyID4gMCA/ICQoJzxkaXYgY2xhc3M9XCJmbG9hdC1yaWdodFwiPicpLmFwcGVuZChbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJzxhPjxpIGNsYXNzPVwiZmEgZmEtcGljdHVyZS1vXCI+JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYGh0dHBzOi8vYi5wcHkuc2gvdGh1bWIvJHtyb3cuYmVhdG1hcHNldF9pZH0uanBnYCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJzxhPjxpIGNsYXNzPVwiZmEgZmEtZG93bmxvYWRcIj4nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9vc3UucHB5LnNoL2QvJHtyb3cuYmVhdG1hcHNldF9pZH1uYCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJzxhPjxpIGNsYXNzPVwiZmEgZmEtY2xvdWQtZG93bmxvYWRcIj4nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgb3N1Oi8vZGwvJHtyb3cuYmVhdG1hcHNldF9pZH1gKVxyXG4gICAgICAgICAgICAgICAgICAgIF0pIDogJCgpXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgcm93LnN0YXJzLnRvRml4ZWQoMiksXHJcbiAgICAgICAgICAgICAgICByb3cucHAudG9GaXhlZCgwKSxcclxuICAgICAgICAgICAgICAgIGAke01hdGguZmxvb3Iocm93LmhpdF9sZW5ndGggLyA2MCl9OiR7cGFkKE1hdGguZmxvb3Iocm93LmhpdF9sZW5ndGggJSA2MCkpfWAsXHJcbiAgICAgICAgICAgICAgICByb3cubWF4X2NvbWJvLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICByb3cuYXBwcm9hY2hfcmF0ZS50b0ZpeGVkKDEpLFxyXG4gICAgICAgICAgICAgICAgcm93LmNpcmNsZV9zaXplLnRvRml4ZWQoMSksXHJcbiAgICAgICAgICAgICAgICAocm93Lm1pbl9taXNzZXMgIT09IDAgPyAocm93Lm1pbl9taXNzZXMgPT09IDEgPyAnMSBtaXNzJyA6IHJvdy5taW5fbWlzc2VzICsgJyBtaXNzZXMnKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgW3Jvdy5mY05NLCByb3cuZmNIRCwgcm93LmZjSFIsIHJvdy5mY0hESFIsIHJvdy5mY0RULCByb3cuZmNIRERUXS5qb2luKCcsICcpKSxcclxuICAgICAgICAgICAgICAgIHJvdy51cGRhdGVfZGF0ZSxcclxuICAgICAgICAgICAgICAgIGJlYXRtYXBJbmZvTWFwLnNpemUgPT09IDAgPyBbXSA6XHJcbiAgICAgICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCc8aSBjbGFzcz1cImZhXCI+JykuYWRkQ2xhc3Mocm93LmluZm8gPyAnZmEtY2hlY2stc3F1YXJlLW8nIDogJ2ZhLXNxdWFyZS1vJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJzxzcGFuPicpLmFkZENsYXNzKCdyYW5rLScgKyByYW5rQWNoaWV2ZWRDbGFzc1shcm93LmluZm8gPyA5IDogcm93LmluZm8ucmFua0FjaGlldmVkXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJzxzcGFuPicpLnRleHQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcm93LmluZm8gfHwgcm93LmluZm8ubGFzdFBsYXllZC52YWx1ZU9mKCkgPT09IE1JTklNVU1fREFURS52YWx1ZU9mKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICctLS0nIDogZm9ybWF0RGF0ZShyb3cuaW5mby5sYXN0UGxheWVkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICBdLm1hcCh4ID0+ICQoJzx0ZD4nKS5hcHBlbmQoeCkpKVswXSBhcyBIVE1MVGFibGVSb3dFbGVtZW50KTtcclxuXHJcbiAgICAgICAgdW5zb3J0ZWRUYWJsZVJvd3NDaGFuZ2VkID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzaG93RXJyb3JNZXNzYWdlKHRleHQ6IHN0cmluZykge1xyXG4gICAgICAgICQoJyNhbGVydHMnKS5hcHBlbmQoXHJcbiAgICAgICAgICAgICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC13YXJuaW5nIGFsZXJ0LWRpc21pc3NhYmxlXCI+JylcclxuICAgICAgICAgICAgICAgIC50ZXh0KHRleHQpXHJcbiAgICAgICAgICAgICAgICAuYXBwZW5kKCc8YSBjbGFzcz1cImNsb3NlXCIgZGF0YS1kaXNtaXNzPVwiYWxlcnRcIj48c3Bhbj4mdGltZXM7JykpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IExPQ0FMU1RPUkFHRV9QUkVGSVggPSAnbGlzdC1tYXBzLyc7XHJcbiAgICBjb25zdCBFTkFCTEVfTE9DQUxTVE9SQUdFX1NBVkUgPSBmYWxzZTtcclxuICAgIHR5cGUgTG9jYWxGaWxlTmFtZSA9ICdvc3UhLmRiJyB8ICdzY29yZXMuZGInO1xyXG4gICAgaW50ZXJmYWNlIExvY2FsRmlsZSB7XHJcbiAgICAgICAgZGF0YTogVWludDhBcnJheTtcclxuICAgICAgICB1cGxvYWRlZERhdGU6IERhdGU7XHJcbiAgICB9XHJcbiAgICBjb25zdCBsb2NhbEZpbGVzOiB7XHJcbiAgICAgICAgWydvc3UhLmRiJ10/OiBMb2NhbEZpbGUsXHJcbiAgICAgICAgWydzY29yZXMuZGInXT86IExvY2FsRmlsZTtcclxuICAgIH0gPSB7fTtcclxuXHJcbiAgICAvKlxyXG4gICAgZnVuY3Rpb24gZGF0YVVSSXRvVUludDhBcnJheShkYXRhVVJJOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBiYXNlNjQgPSBkYXRhVVJJLnNwbGl0KCcsJylbMV07XHJcbiAgICAgICAgY29uc3Qgc3RyID0gYXRvYihiYXNlNjQpO1xyXG4gICAgICAgIGNvbnN0IGxlbiA9IHN0ci5sZW5ndGg7XHJcbiAgICAgICAgY29uc3QgYXJyYXkgPSBuZXcgVWludDhBcnJheShsZW4pO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyArKyBpKSB7XHJcbiAgICAgICAgICAgIGFycmF5W2ldID0gc3RyLmNoYXJDb2RlQXQoaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnJheTtcclxuICAgIH1cclxuICAgICovXHJcblxyXG4gICAgY29uc3QgcmVnaXN0ZXJlZENhbGxiYWNrTWFwID0gbmV3IE1hcDxudW1iZXIsIChkYXRhOiBhbnkpID0+IGFueT4oKTtcclxuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyQ2FsbGJhY2soY2FsbGJhY2s6IChkYXRhOiBhbnkpID0+IGFueSk6IG51bWJlciB7XHJcbiAgICAgICAgbGV0IGlkO1xyXG4gICAgICAgIGRvXHJcbiAgICAgICAgICAgIGlkID0gTWF0aC5yYW5kb20oKTtcclxuICAgICAgICB3aGlsZSAocmVnaXN0ZXJlZENhbGxiYWNrTWFwLmhhcyhpZCkpO1xyXG4gICAgICAgIHJlZ2lzdGVyZWRDYWxsYmFja01hcC5zZXQoaWQsIGNhbGxiYWNrKTtcclxuICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbmV3V29ya2VyKCk6IFdvcmtlciB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBXb3JrZXIoJ2Rpc3QvbGlzdC1tYXBzLXdvcmtlci5qcycpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIHJ1bldvcmtlcihtZXNzYWdlOiBvYmplY3QsIHVzaW5nPzogV29ya2VyKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8YW55PihyZXNvbHZlID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgd29ya2VyID0gdXNpbmcgfHwgbmV3V29ya2VyKCk7XHJcbiAgICAgICAgICAgIChtZXNzYWdlIGFzIGFueSkuaWQgPSByZWdpc3RlckNhbGxiYWNrKHJlc29sdmUpO1xyXG4gICAgICAgICAgICB3b3JrZXIucG9zdE1lc3NhZ2UobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHdvcmtlci5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBldmVudC5kYXRhO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEudHlwZSA9PT0gJ2NhbGxiYWNrJyAmJiB0eXBlb2YgKGRhdGEuaWQpID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gcmVnaXN0ZXJlZENhbGxiYWNrTWFwLmdldChkYXRhLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnaXN0ZXJlZENhbGxiYWNrTWFwLmRlbGV0ZShkYXRhLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbXByZXNzQnVmZmVyVG9TdHJpbmcoYnVmZmVyOiBBcnJheUJ1ZmZlcik6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICAgICAgY29uc3QgY29tcHJlc3NlZCA9IChhd2FpdCBydW5Xb3JrZXIoe1xyXG4gICAgICAgICAgICB0eXBlOiAnY29tcHJlc3MnLFxyXG4gICAgICAgICAgICBkYXRhOiBuZXcgVWludDhBcnJheShidWZmZXIpXHJcbiAgICAgICAgfSkpLmRhdGEgYXMgVWludDhBcnJheTtcclxuICAgICAgICBjb25zdCBjaGFycyA9IG5ldyBBcnJheShNYXRoLmZsb29yKGNvbXByZXNzZWQubGVuZ3RoIC8gMikpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hhcnMubGVuZ3RoOyBpICs9IDEpIHtcclxuICAgICAgICAgICAgY29uc3QgY29kZSA9IChjb21wcmVzc2VkW2kgKiAyICsgMF0gJiAweGZmKSA8PCA4IHwgKGNvbXByZXNzZWRbaSAqIDIgKyAxXSAmIDB4ZmYpO1xyXG4gICAgICAgICAgICBjaGFyc1tpXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCByZXMgPSBjb21wcmVzc2VkLmxlbmd0aCAlIDIgPyAnMScgOiAnMCc7XHJcbiAgICAgICAgcmVzICs9IGNoYXJzLmpvaW4oJycpO1xyXG4gICAgICAgIGlmIChjb21wcmVzc2VkLmxlbmd0aCAlIDIgIT09IDApXHJcbiAgICAgICAgICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjb21wcmVzc2VkW2NvbXByZXNzZWQubGVuZ3RoIC0gMV0gJiAweGZmKSA8PCA4KTtcclxuICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWNvbXByZXNzQnVmZmVyRnJvbVN0cmluZyhzdHI6IHN0cmluZyk6IFByb21pc2U8VWludDhBcnJheT4ge1xyXG4gICAgICAgIGNvbnN0IHBhcml0eSA9IHN0clswXSA9PT0gJzEnID8gMSA6IDA7XHJcbiAgICAgICAgY29uc3QgbGVuID0gc3RyLmxlbmd0aCAtIDEgLSBwYXJpdHk7XHJcbiAgICAgICAgY29uc3QgYXJyYXkgPSBuZXcgVWludDhBcnJheShsZW4gKiAyICsgcGFyaXR5KTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBzdHIuY2hhckNvZGVBdChpICsgMSk7XHJcbiAgICAgICAgICAgIGFycmF5W2kgKiAyICsgMF0gPSBjb2RlID4+IDg7XHJcbiAgICAgICAgICAgIGFycmF5W2kgKiAyICsgMV0gPSBjb2RlICYgMHhmZjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHBhcml0eSAhPT0gMClcclxuICAgICAgICAgICAgYXJyYXlbbGVuICogMl0gPSBzdHIuY2hhckNvZGVBdChsZW4gKyAxKSA+PiA4O1xyXG4gICAgICAgIGNvbnN0IGRlY29tcHJlc3NlZCA9IChhd2FpdCBydW5Xb3JrZXIoe1xyXG4gICAgICAgICAgICB0eXBlOiAnZGVjb21wcmVzcycsXHJcbiAgICAgICAgICAgIGRhdGE6IGFycmF5XHJcbiAgICAgICAgfSkpLmRhdGEgYXMgVWludDhBcnJheTtcclxuICAgICAgICByZXR1cm4gZGVjb21wcmVzc2VkO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJlbG9hZExvY2FsRmlsZShuYW1lOiBMb2NhbEZpbGVOYW1lKSB7XHJcbiAgICAgICAgY29uc3QgZiA9IGxvY2FsRmlsZXNbbmFtZV07XHJcbiAgICAgICAgaWYgKG5hbWUgPT09ICdvc3UhLmRiJylcclxuICAgICAgICAgICAgJCgnI2ZpbHRlci1sb2NhbC1kYXRhJykucHJvcCgnZGlzYWJsZWQnLCBmID09PSB1bmRlZmluZWQpO1xyXG4gICAgICAgICQobmFtZSA9PT0gJ29zdSEuZGInID8gJyNjdXJyZW50LW9zdWRiLWZpbGUnIDogJyNjdXJyZW50LXNjb3Jlc2RiLWZpbGUnKVxyXG4gICAgICAgICAgICAudGV4dCghZiA/ICdObyBkYXRhJyA6IGZvcm1hdERhdGUoZi51cGxvYWRlZERhdGUpKTtcclxuICAgICAgICBpZiAoIWYpIHJldHVybjtcclxuICAgICAgICBpZiAobmFtZSA9PT0gJ29zdSEuZGInKSB7XHJcbiAgICAgICAgICAgIGxvYWRPc3VEQihmLmRhdGEuYnVmZmVyLCBmLnVwbG9hZGVkRGF0ZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIGxvYWRGcm9tTG9jYWxTdG9yYWdlKG5hbWU6IExvY2FsRmlsZU5hbWUpIHtcclxuICAgICAgICBpZiAoIUVOQUJMRV9MT0NBTFNUT1JBR0VfU0FWRSkgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGRhdGVTdHIgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShMT0NBTFNUT1JBR0VfUFJFRklYICsgbmFtZSArICcvdXBsb2FkZWQtZGF0ZScpO1xyXG4gICAgICAgIGlmICghZGF0ZVN0cikgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGVuY29kZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShMT0NBTFNUT1JBR0VfUFJFRklYICsgbmFtZSArICcvZGF0YScpITtcclxuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgZGVjb21wcmVzc0J1ZmZlckZyb21TdHJpbmcoZW5jb2RlZCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2ZpbGUgJyArIG5hbWUgKyAnIGxvYWRlZCBmcm9tIGxvY2FsU3RvcmFnZScpO1xyXG4gICAgICAgIGxvY2FsRmlsZXNbbmFtZV0gPSB7XHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgICAgIHVwbG9hZGVkRGF0ZTogbmV3IERhdGUoZGF0ZVN0cilcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIHNldExvY2FsRmlsZShuYW1lOiBMb2NhbEZpbGVOYW1lLCBmaWxlOiBGaWxlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBmciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgIGZyLm9ubG9hZCA9IChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpbGUgJyArIG5hbWUgKyAnIGxvYWRlZCcpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZmVyID0gZnIucmVzdWx0IGFzIEFycmF5QnVmZmVyO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdXBsb2FkZWREYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgICAgICAgIGxvY2FsRmlsZXNbbmFtZV0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKSxcclxuICAgICAgICAgICAgICAgICAgICB1cGxvYWRlZERhdGU6IHVwbG9hZGVkRGF0ZSxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICByZWxvYWRMb2NhbEZpbGUobmFtZSk7XHJcbiAgICAgICAgICAgICAgICBjb21wcmVzc0J1ZmZlclRvU3RyaW5nKGJ1ZmZlcikudGhlbihkYXRhU3RyID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZmlsZSAnICsgbmFtZSArICcgY29tcHJlc3NlZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSBsb2NhbEZpbGVzW25hbWVdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50ICYmIGN1cnJlbnQudXBsb2FkZWREYXRlLnZhbHVlT2YoKSAhPT0gdXBsb2FkZWREYXRlLnZhbHVlT2YoKSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghRU5BQkxFX0xPQ0FMU1RPUkFHRV9TQVZFKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oTE9DQUxTVE9SQUdFX1BSRUZJWCArIG5hbWUgKyAnL2RhdGEnLCBkYXRhU3RyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oTE9DQUxTVE9SQUdFX1BSRUZJWCArIG5hbWUgKyAnL3VwbG9hZGVkLWRhdGUnLCB1cGxvYWRlZERhdGUudG9JU09TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmaWxlICcgKyBuYW1lICsgJyBzYXZlZCB0byBsb2NhbFN0b3JhZ2UnKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2xvY2FsU3RvcmFnZSBlcnJvcjogJywgZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBmci5yZWFkQXNBcnJheUJ1ZmZlcihmaWxlKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBTZXJpYWxpemF0aW9uUmVhZGVyIHtcclxuICAgICAgICBwcml2YXRlIGR2OiBEYXRhVmlldztcclxuICAgICAgICBwcml2YXRlIG9mZnNldDogbnVtYmVyO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihidWZmZXI6IEFycmF5QnVmZmVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZHYgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcclxuICAgICAgICAgICAgdGhpcy5vZmZzZXQgPSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHNraXAoYnl0ZXM6IG51bWJlcikge1xyXG4gICAgICAgICAgICB0aGlzLm9mZnNldCArPSBieXRlcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyByZWFkSW50OCgpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5kdi5nZXRJbnQ4KHRoaXMub2Zmc2V0KTtcclxuICAgICAgICAgICAgdGhpcy5vZmZzZXQgKz0gMTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyByZWFkSW50MTYoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0SW50MTYodGhpcy5vZmZzZXQsIHRydWUpO1xyXG4gICAgICAgICAgICB0aGlzLm9mZnNldCArPSAyO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHJlYWRJbnQzMigpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5kdi5nZXRJbnQzMih0aGlzLm9mZnNldCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMub2Zmc2V0ICs9IDQ7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgcmVhZEJ5dGUoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWRJbnQ4KCkgfCAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHJlYWRVSW50MTYoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWRJbnQxNigpIHwgMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyByZWFkVUludDMyKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWFkSW50MzIoKSB8IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgcmVhZEJvb2xlYW4oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWRJbnQ4KCkgIT09IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHJlYWRVTEVCMTI4KCkge1xyXG4gICAgICAgICAgICBsZXQgcmVzdWx0ID0gMDtcclxuICAgICAgICAgICAgZm9yIChsZXQgc2hpZnQgPSAwOyA7IHNoaWZ0ICs9IDcpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJ5dGUgPSB0aGlzLmR2LmdldFVpbnQ4KHRoaXMub2Zmc2V0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMub2Zmc2V0ICs9IDE7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgfD0gKGJ5dGUgJiAweDdmKSA8PCBzaGlmdDtcclxuICAgICAgICAgICAgICAgIGlmICgoYnl0ZSAmIDB4ODApID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyByZWFkVWludDhBcnJheShsZW5ndGg6IG51bWJlcikge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh0aGlzLmR2LmJ1ZmZlciwgdGhpcy5vZmZzZXQsIGxlbmd0aCk7XHJcbiAgICAgICAgICAgIHRoaXMub2Zmc2V0ICs9IGxlbmd0aDtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyByZWFkU3RyaW5nKCkge1xyXG4gICAgICAgICAgICBjb25zdCBoZWFkZXIgPSB0aGlzLnJlYWRJbnQ4KCk7XHJcbiAgICAgICAgICAgIGlmIChoZWFkZXIgPT09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMucmVhZFVMRUIxMjgoKTtcclxuICAgICAgICAgICAgY29uc3QgYXJyYXkgPSB0aGlzLnJlYWRVaW50OEFycmF5KGxlbmd0aCk7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgVGV4dERlY29kZXIoJ3V0Zi04JykuZGVjb2RlKGFycmF5KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyByZWFkSW50NjRSb3VuZGVkKCkge1xyXG4gICAgICAgICAgICBjb25zdCBsbyA9IHRoaXMuZHYuZ2V0VWludDMyKHRoaXMub2Zmc2V0LCB0cnVlKTtcclxuICAgICAgICAgICAgY29uc3QgaGkgPSB0aGlzLmR2LmdldFVpbnQzMih0aGlzLm9mZnNldCArIDQsIHRydWUpO1xyXG4gICAgICAgICAgICB0aGlzLm9mZnNldCArPSA4O1xyXG4gICAgICAgICAgICByZXR1cm4gaGkgKiAweDEwMDAwMDAwMCArIGxvO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHJlYWREYXRlVGltZSgpIHtcclxuICAgICAgICAgICAgLy8gT0ZGU0VUID0gNjIxMzU1OTY4MDAwMDAwMDAwID0gdGlja3MgZnJvbSAwMDAxLzEvMSB0byAxOTcwLzEvMVxyXG4gICAgICAgICAgICBsZXQgbG8gPSB0aGlzLnJlYWRVSW50MzIoKTtcclxuICAgICAgICAgICAgbGV0IGhpID0gdGhpcy5yZWFkVUludDMyKCk7XHJcbiAgICAgICAgICAgIGxvIC09IDM0NDQyOTM2MzI7IC8vIGxvIGJpdHMgb2YgT0ZGU0VUXHJcbiAgICAgICAgICAgIGlmIChsbyA8IDApIHtcclxuICAgICAgICAgICAgICAgIGxvICs9IDQyOTQ5NjcyOTY7ICAgLy8gMl4zMlxyXG4gICAgICAgICAgICAgICAgaGkgLT0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBoaSAtPSAxNDQ2NzA1MDg7ICAvLyBoaSBiaXRzIG9mIE9GRlNFVFxyXG4gICAgICAgICAgICBjb25zdCB0aWNrcyA9IGhpICogNDI5NDk2NzI5NiArIGxvO1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IERhdGUodGlja3MgKiAxZS00KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyByZWFkU2luZ2xlKCkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmR2LmdldEZsb2F0MzIodGhpcy5vZmZzZXQsIHRydWUpO1xyXG4gICAgICAgICAgICB0aGlzLm9mZnNldCArPSA0O1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHJlYWREb3VibGUoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0RmxvYXQ2NCh0aGlzLm9mZnNldCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMub2Zmc2V0ICs9IDg7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgcmVhZExpc3QoY2FsbGJhY2s6IChpbmRleDogbnVtYmVyKSA9PiBhbnkpIHtcclxuICAgICAgICAgICAgY29uc3QgY291bnQgPSB0aGlzLnJlYWRJbnQzMigpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpICs9IDEpXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgQmVhdG1hcEluZm8ge1xyXG4gICAgICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGJlYXRtYXBJZDogbnVtYmVyLFxyXG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgbGFzdFBsYXllZDogRGF0ZSxcclxuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IHJhbmtBY2hpZXZlZDogbnVtYmVyKSB7IH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByZWFkQmVhdG1hcChzcjogU2VyaWFsaXphdGlvblJlYWRlcikge1xyXG4gICAgICAgIGNvbnN0IFNpemVJbkJ5dGVzID0gc3IucmVhZEludDMyKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IEFydGlzdCA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgICAgICBjb25zdCBBcnRpc3RVbmljb2RlID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgICAgIGNvbnN0IFRpdGxlID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgICAgIGNvbnN0IFRpdGxlVW5pY29kZSA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgICAgICBjb25zdCBDcmVhdG9yID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgICAgIGNvbnN0IFZlcnNpb24gPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICAgICAgY29uc3QgQXVkaW9GaWxlbmFtZSA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgICAgICBjb25zdCBCZWF0bWFwQ2hlY2tzdW0gPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICAgICAgY29uc3QgRmlsZW5hbWUgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICAgICAgY29uc3QgU3VibWlzc2lvblN0YXR1cyA9IHNyLnJlYWRCeXRlKCk7XHJcbiAgICAgICAgY29uc3QgY291bnROb3JtYWwgPSBzci5yZWFkVUludDE2KCk7XHJcbiAgICAgICAgY29uc3QgY291bnRTbGlkZXIgPSBzci5yZWFkVUludDE2KCk7XHJcbiAgICAgICAgY29uc3QgY291bnRTcGlubmVyID0gc3IucmVhZFVJbnQxNigpO1xyXG4gICAgICAgIGNvbnN0IERhdGVNb2RpZmllZCA9IHNyLnJlYWREYXRlVGltZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBEaWZmaWN1bHR5QXBwcm9hY2hSYXRlID0gc3IucmVhZFNpbmdsZSgpO1xyXG4gICAgICAgIGNvbnN0IERpZmZpY3VsdHlDaXJjbGVTaXplID0gc3IucmVhZFNpbmdsZSgpO1xyXG4gICAgICAgIGNvbnN0IERpZmZpY3VsdHlIcERyYWluUmF0ZSA9IHNyLnJlYWRTaW5nbGUoKTtcclxuICAgICAgICBjb25zdCBEaWZmaWN1bHR5T3ZlcmFsbCA9IHNyLnJlYWRTaW5nbGUoKTtcclxuXHJcbiAgICAgICAgY29uc3QgRGlmZmljdWx0eVNsaWRlck11bHRpcGxpZXIgPSBzci5yZWFkRG91YmxlKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgIHNyLnJlYWRMaXN0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHNyLnJlYWRJbnQzMigpO1xyXG4gICAgICAgICAgICAgICAgc3IucmVhZEludDE2KCk7XHJcbiAgICAgICAgICAgICAgICBzci5yZWFkRG91YmxlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgRHJhaW5MZW5ndGggPSBzci5yZWFkSW50MzIoKTtcclxuICAgICAgICBjb25zdCBUb3RhbExlbmd0aCA9IHNyLnJlYWRJbnQzMigpO1xyXG4gICAgICAgIGNvbnN0IFByZXZpZXdUaW1lID0gc3IucmVhZEludDMyKCk7XHJcbiAgICAgICAgc3IucmVhZExpc3QoKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBCZWF0TGVuZ3RoID0gc3IucmVhZERvdWJsZSgpO1xyXG4gICAgICAgICAgICBjb25zdCBPZmZzZXQgPSBzci5yZWFkRG91YmxlKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IFRpbWluZ0NoYW5nZSA9IHNyLnJlYWRCb29sZWFuKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc3QgQmVhdG1hcElkID0gc3IucmVhZEludDMyKCk7XHJcbiAgICAgICAgY29uc3QgQmVhdG1hcFNldElkID0gc3IucmVhZEludDMyKCk7XHJcbiAgICAgICAgY29uc3QgQmVhdG1hcFRvcGljSWQgPSBzci5yZWFkSW50MzIoKTtcclxuICAgICAgICBjb25zdCBQbGF5ZXJSYW5rT3N1ID0gc3IucmVhZEJ5dGUoKTtcclxuICAgICAgICBjb25zdCBQbGF5ZXJSYW5rRnJ1aXRzID0gc3IucmVhZEJ5dGUoKTtcclxuICAgICAgICBjb25zdCBQbGF5ZXJSYW5rVGFpa28gPSBzci5yZWFkQnl0ZSgpO1xyXG4gICAgICAgIGNvbnN0IFBsYXllclJhbmtNYW5pYSA9IHNyLnJlYWRCeXRlKCk7XHJcbiAgICAgICAgY29uc3QgUGxheWVyT2Zmc2V0ID0gc3IucmVhZEludDE2KCk7XHJcbiAgICAgICAgY29uc3QgU3RhY2tMZW5pZW5jeSA9IHNyLnJlYWRTaW5nbGUoKTtcclxuICAgICAgICBjb25zdCBQbGF5TW9kZSA9IHNyLnJlYWRCeXRlKCk7XHJcbiAgICAgICAgY29uc3QgU291cmNlID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgICAgIGNvbnN0IFRhZ3MgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICAgICAgY29uc3QgT25saW5lT2Zmc2V0ID0gc3IucmVhZEludDE2KCk7XHJcbiAgICAgICAgY29uc3QgT25saW5lRGlzcGxheVRpdGxlID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgICAgIGNvbnN0IE5ld0ZpbGUgPSBzci5yZWFkQm9vbGVhbigpO1xyXG4gICAgICAgIGNvbnN0IERhdGVMYXN0UGxheWVkID0gc3IucmVhZERhdGVUaW1lKCk7XHJcbiAgICAgICAgY29uc3QgSW5Pc3pDb250YWluZXIgPSBzci5yZWFkQm9vbGVhbigpO1xyXG4gICAgICAgIGNvbnN0IENvbnRhaW5pbmdGb2xkZXJBYnNvbHV0ZSA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgICAgICBjb25zdCBMYXN0SW5mb1VwZGF0ZSA9IHNyLnJlYWREYXRlVGltZSgpO1xyXG4gICAgICAgIGNvbnN0IERpc2FibGVTYW1wbGVzID0gc3IucmVhZEJvb2xlYW4oKTtcclxuICAgICAgICBjb25zdCBEaXNhYmxlU2tpbiA9IHNyLnJlYWRCb29sZWFuKCk7XHJcbiAgICAgICAgY29uc3QgRGlzYWJsZVN0b3J5Ym9hcmQgPSBzci5yZWFkQm9vbGVhbigpO1xyXG4gICAgICAgIGNvbnN0IERpc2FibGVWaWRlbyA9IHNyLnJlYWRCb29sZWFuKCk7XHJcbiAgICAgICAgY29uc3QgVmlzdWFsU2V0dGluZ3NPdmVycmlkZSA9IHNyLnJlYWRCb29sZWFuKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IExhc3RFZGl0VGltZSA9IHNyLnJlYWRJbnQzMigpO1xyXG4gICAgICAgIGNvbnN0IE1hbmlhU3BlZWQgPSBzci5yZWFkQnl0ZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IEJlYXRtYXBJbmZvKFxyXG4gICAgICAgICAgICBCZWF0bWFwSWQsXHJcbiAgICAgICAgICAgIG5ldyBEYXRlKE1hdGgubWF4KE1JTklNVU1fREFURS52YWx1ZU9mKCksIERhdGVMYXN0UGxheWVkLnZhbHVlT2YoKSkpLFxyXG4gICAgICAgICAgICBQbGF5ZXJSYW5rRnJ1aXRzKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBiZWF0bWFwSW5mb01hcCA9IG5ldyBNYXA8bnVtYmVyLCBCZWF0bWFwSW5mbz4oKTtcclxuICAgIGxldCBiZWF0bWFwSW5mb01hcFZlcnNpb24gPSBNSU5JTVVNX0RBVEU7XHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZE9zdURCKGJ1ZmZlcjogQXJyYXlCdWZmZXIsIHZlcnNpb246IERhdGUpIHtcclxuICAgICAgICBiZWF0bWFwSW5mb01hcC5jbGVhcigpO1xyXG4gICAgICAgIGNvbnN0IHNyID0gbmV3IFNlcmlhbGl6YXRpb25SZWFkZXIoYnVmZmVyKTtcclxuICAgICAgICBzci5za2lwKDQgKyA0ICsgMSArIDgpO1xyXG4gICAgICAgIHNyLnJlYWRTdHJpbmcoKTtcclxuICAgICAgICBjb25zdCBiZWF0bWFwQ291bnQgPSBzci5yZWFkSW50MzIoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiZWF0bWFwQ291bnQ7IGkgKz0gMSkge1xyXG4gICAgICAgICAgICBjb25zdCBiZWF0bWFwID0gcmVhZEJlYXRtYXAoc3IpO1xyXG4gICAgICAgICAgICBpZiAoYmVhdG1hcC5iZWF0bWFwSWQgPiAwKVxyXG4gICAgICAgICAgICAgICAgYmVhdG1hcEluZm9NYXAuc2V0KGJlYXRtYXAuYmVhdG1hcElkLCBiZWF0bWFwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGJlYXRtYXBJbmZvTWFwVmVyc2lvbiA9IHZlcnNpb247XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdFRhYmxlKHNvcnRLZXlzOiB7fVtdLCBvcmRlckNvbmZpZzogW251bWJlcltdLCBudW1iZXJdLCBvblNvcnRPcmRlckNoYW5nZWQ6ICgpID0+IHZvaWQpIHtcclxuICAgICAgICBjb25zdCB0aExpc3QgPSAkKCcjc3VtbWFyeS10YWJsZSA+IHRoZWFkID4gdHIgPiB0aCcpO1xyXG4gICAgICAgIHNvcnRLZXlzLmZvckVhY2goKF8sIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICQuZGF0YSh0aExpc3RbaW5kZXhdLCAndGhJbmRleCcsIGluZGV4KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aExpc3QuY2xpY2soKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRoID0gJChldmVudC50YXJnZXQpO1xyXG4gICAgICAgICAgICBsZXQgc2lnbjtcclxuICAgICAgICAgICAgaWYgKHRoLmhhc0NsYXNzKCdzb3J0ZWQnKSlcclxuICAgICAgICAgICAgICAgIHNpZ24gPSB0aC5oYXNDbGFzcygnZGVzY2VuZGluZycpID8gMSA6IC0xO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBzaWduID0gdGguaGFzQ2xhc3MoJ2Rlc2MtZmlyc3QnKSA/IC0xIDogMTtcclxuICAgICAgICAgICAgY29uc3QgdGhJbmRleCA9IHRoLmRhdGEoJ3RoSW5kZXgnKSBhcyBudW1iZXI7XHJcbiAgICAgICAgICAgIGN1cnJlbnRTb3J0T3JkZXIucHVzaCgodGhJbmRleCArIDEpICogc2lnbik7XHJcbiAgICAgICAgICAgIGN1cnJlbnRTb3J0T3JkZXIgPSBzaW1wbGlmeVNvcnRPcmRlcihjdXJyZW50U29ydE9yZGVyLCBvcmRlckNvbmZpZyk7XHJcbiAgICAgICAgICAgIHNldFRhYmxlSGVhZFNvcnRpbmdNYXJrKCk7XHJcbiAgICAgICAgICAgIG9uU29ydE9yZGVyQ2hhbmdlZCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG1haW4oKSB7XHJcbiAgICAgICAgUHJvbWlzZS5hbGwoXHJcbiAgICAgICAgICAgIChbJ29zdSEuZGInLCAnc2NvcmVzLmRiJ10gYXMgTG9jYWxGaWxlTmFtZVtdKVxyXG4gICAgICAgICAgICAgICAgLm1hcChuYW1lID0+XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZEZyb21Mb2NhbFN0b3JhZ2UobmFtZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gcmVsb2FkTG9jYWxGaWxlKG5hbWUpKSkpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluaXRVbnNvcnRlZFRhYmxlUm93cygpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRyYXdUYWJsZUZvckN1cnJlbnRGaWx0ZXJpbmcoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgc2V0UXVlcnlBY2NvcmRpbmdUb0hhc2goKTtcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsICgpID0+IHtcclxuICAgICAgICAgICAgc2V0UXVlcnlBY2NvcmRpbmdUb0hhc2goKTtcclxuICAgICAgICAgICAgZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnN0IG9uQ2hhbmdlID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBmb3IgKGNvbnN0IGlkIG9mIFsnZmlsdGVyLWFwcHJvdmVkLXN0YXR1cycsICdmaWx0ZXItbW9kZScsICdmaWx0ZXItZmMtbGV2ZWwnLCAnZmlsdGVyLWxvY2FsLWRhdGEnLCAnc2hvdy1mdWxsLXJlc3VsdCddKVxyXG4gICAgICAgICAgICAkKGAjJHtpZH1gKS5vbignY2hhbmdlJywgb25DaGFuZ2UpO1xyXG4gICAgICAgIGZvciAoY29uc3QgaWQgb2YgWydmaWx0ZXItc2VhcmNoLXF1ZXJ5J10pXHJcbiAgICAgICAgICAgICQoYCMke2lkfWApLm9uKCdpbnB1dCcsIG9uQ2hhbmdlKTtcclxuICAgICAgICBpbml0VGFibGUoc29ydEtleXMsIHN1bW1hcnlPcmRlckNvbmZpZywgb25DaGFuZ2UpO1xyXG5cclxuICAgICAgICBjb25zdCBsb2FkRGF0YSA9IChkYXRhOiBTdW1tYXJ5Um93RGF0YVtdLCBsYXN0TW9kaWZpZWQ6IERhdGUpID0+IHtcclxuICAgICAgICAgICAgJCgnI2xhc3QtdXBkYXRlLXRpbWUnKVxyXG4gICAgICAgICAgICAgICAgLmFwcGVuZCgkKCc8dGltZT4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdkYXRldGltZScsIGxhc3RNb2RpZmllZC50b0lTT1N0cmluZygpKVxyXG4gICAgICAgICAgICAgICAgICAgIC50ZXh0KGxhc3RNb2RpZmllZC50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF0pKTtcclxuICAgICAgICAgICAgc3VtbWFyeVJvd3MgPSBkYXRhLm1hcCh4ID0+IG5ldyBTdW1tYXJ5Um93KHgpKTtcclxuICAgICAgICAgICAgaW5pdFVuc29ydGVkVGFibGVSb3dzKCk7XHJcbiAgICAgICAgICAgIGRyYXdUYWJsZUZvckN1cnJlbnRGaWx0ZXJpbmcoKTtcclxuICAgICAgICAgICAgJCgnI3N1bW1hcnktdGFibGUtbG9hZGVyJykuaGlkZSgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgJC5nZXRKU09OKCdkYXRhL3N1bW1hcnkuanNvbicpLnRoZW4oKGRhdGEsIF8sIHhocikgPT4ge1xyXG4gICAgICAgICAgICBsb2FkRGF0YShkYXRhLCBuZXcgRGF0ZSh4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnKSBhcyBzdHJpbmcpKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAkKCcjZGItZmlsZS1pbnB1dCcpLmNoYW5nZShhc3luYyBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBldmVudC50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudDtcclxuICAgICAgICAgICAgaWYgKCFlbGVtLmZpbGVzKSByZXR1cm47XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbS5maWxlcy5sZW5ndGg7IGkgKz0gMSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IGVsZW0uZmlsZXNbaV07XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gZmlsZS5uYW1lO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5hbWUuaW5kZXhPZignb3N1IS5kYicpICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHNldExvY2FsRmlsZSgnb3N1IS5kYicsIGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChuYW1lLmluZGV4T2YoJ3Njb3Jlcy5kYicpICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHNldExvY2FsRmlsZSgnc2NvcmVzLmRiJywgZmlsZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHNob3dFcnJvck1lc3NhZ2UoYEludmFsaWQgZmlsZSAke25hbWV9OiBQbGVhc2Ugc2VsZWN0IG9zdSEuZGIgb3Igc2NvcmVzLmRiYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5pdFVuc29ydGVkVGFibGVSb3dzKCkpXHJcbiAgICAgICAgICAgICAgICAgICAgZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsZW0udmFsdWUgPSAnJztcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpbml0VW5zb3J0ZWRSYW5raW5nVGFibGVSb3dzKCkge1xyXG4gICAgICAgIGlmIChyYW5raW5nUm93cy5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgdW5zb3J0ZWRUYWJsZVJvd3MgPSByYW5raW5nUm93cy5tYXAocm93ID0+XHJcbiAgICAgICAgICAgICQoJzx0cj4nKS5hcHBlbmQoW1xyXG4gICAgICAgICAgICAgICAgcm93LnJhbmsudG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgIHJvdy5wcC50b0ZpeGVkKDIpLFxyXG4gICAgICAgICAgICAgICAgJCgnPGE+JykuYXR0cignaHJlZicsIGBodHRwczovL29zdS5wcHkuc2gvdS8ke3Jvdy51c2VyX2lkfWApLnRleHQocm93LnVzZXJuYW1lKSxcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICAkKCc8YT4nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignaHJlZicsIGBodHRwczovL29zdS5wcHkuc2gvYi8ke3Jvdy5iZWF0bWFwX2lkfT9tPTJgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAudGV4dChyb3cuZGlzcGxheV9zdHJpbmcpLFxyXG4gICAgICAgICAgICAgICAgICAgIHJvdy5iZWF0bWFwX2lkX251bWJlciA+IDAgPyAkKCc8ZGl2IGNsYXNzPVwiZmxvYXQtcmlnaHRcIj4nKS5hcHBlbmQoW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLXBpY3R1cmUtb1wiPicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignaHJlZicsIGBodHRwczovL2IucHB5LnNoL3RodW1iLyR7cm93LmJlYXRtYXBzZXRfaWR9LmpwZ2ApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLWRvd25sb2FkXCI+JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYGh0dHBzOi8vb3N1LnBweS5zaC9kLyR7cm93LmJlYXRtYXBzZXRfaWR9bmApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLWNsb3VkLWRvd25sb2FkXCI+JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYG9zdTovL2RsLyR7cm93LmJlYXRtYXBzZXRfaWR9YClcclxuICAgICAgICAgICAgICAgICAgICBdKSA6ICQoKVxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIHJvdy5tb2RzLFxyXG4gICAgICAgICAgICAgICAgcm93LmFjY3VyYWN5LnRvRml4ZWQoMikgKyAnJScsXHJcbiAgICAgICAgICAgICAgICByb3cuY29tYm9fZGlzcGxheSxcclxuICAgICAgICAgICAgICAgIHJvdy5kYXRlX3BsYXllZF9zdHJpbmcsXHJcbiAgICAgICAgICAgIF0ubWFwKHggPT4gJCgnPHRkPicpLmFwcGVuZCh4KSkpWzBdIGFzIEhUTUxUYWJsZVJvd0VsZW1lbnQpO1xyXG5cclxuICAgICAgICB1bnNvcnRlZFRhYmxlUm93c0NoYW5nZWQgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJhbmtpbmdTb3J0S2V5cyA9IFtcclxuICAgICAgICAoeDogUmFua2luZ1JvdykgPT4geC5yYW5rLFxyXG4gICAgICAgICh4OiBSYW5raW5nUm93KSA9PiB4LnBwLFxyXG4gICAgICAgICh4OiBSYW5raW5nUm93KSA9PiB4LnVzZXJuYW1lX2xvd2VyLFxyXG4gICAgICAgICh4OiBSYW5raW5nUm93KSA9PiB4LmRpc3BsYXlfc3RyaW5nX2xvd2VyLFxyXG4gICAgICAgICh4OiBSYW5raW5nUm93KSA9PiB4Lm1vZHMsXHJcbiAgICAgICAgKHg6IFJhbmtpbmdSb3cpID0+IHguYWNjdXJhY3ksXHJcbiAgICAgICAgKHg6IFJhbmtpbmdSb3cpID0+IHguY29tYm9fZGlzcGxheSxcclxuICAgICAgICAoeDogUmFua2luZ1JvdykgPT4geC5kYXRlX3BsYXllZF9zdHJpbmcsXHJcbiAgICBdO1xyXG5cclxuICAgIGZ1bmN0aW9uIGRyYXdSYW5raW5nVGFibGUoKSB7XHJcbiAgICAgICAgY29uc3QgaW5kaWNlcyA9IHJhbmtpbmdSb3dzLm1hcCgoX3JvdywgaSkgPT4gaSk7XHJcbiAgICAgICAgY29uc3QgcHJldkluZGV4ID0gQXJyYXkocmFua2luZ1Jvd3MubGVuZ3RoKTtcclxuICAgICAgICBmb3IgKGNvbnN0IG9yZCBvZiBjdXJyZW50U29ydE9yZGVyKSB7XHJcbiAgICAgICAgICAgIGlmIChvcmQgPT09IDApIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBpbmRpY2VzLmZvckVhY2goKHgsIGkpID0+IHByZXZJbmRleFt4XSA9IGkpO1xyXG4gICAgICAgICAgICBjb25zdCBzb3J0S2V5ID0gcmFua2luZ1NvcnRLZXlzW01hdGguYWJzKG9yZCkgLSAxXTtcclxuICAgICAgICAgICAgY29uc3Qgc2lnbiA9IG9yZCA+IDAgPyAxIDogLTE7XHJcbiAgICAgICAgICAgIGluZGljZXMuc29ydCgoeCwgeSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qga3ggPSBzb3J0S2V5KHJhbmtpbmdSb3dzW3hdKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGt5ID0gc29ydEtleShyYW5raW5nUm93c1t5XSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ga3ggPCBreSA/IC1zaWduIDoga3ggPiBreSA/IHNpZ24gOiBwcmV2SW5kZXhbeF0gLSBwcmV2SW5kZXhbeV07XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkcmF3VGFibGUoaW5kaWNlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmFua2luZ01haW4oKSB7XHJcbiAgICAgICAgaW5pdFRhYmxlKHJhbmtpbmdTb3J0S2V5cywgcmFua2luZ09yZGVyQ29uZmlnLCBkcmF3UmFua2luZ1RhYmxlKTtcclxuICAgICAgICBjb25zdCBsb2FkRGF0YSA9IChkYXRhOiBSYW5raW5nUm93RGF0YVtdLCBsYXN0TW9kaWZpZWQ6IERhdGUpID0+IHtcclxuICAgICAgICAgICAgJCgnI2xhc3QtdXBkYXRlLXRpbWUnKVxyXG4gICAgICAgICAgICAgICAgLmFwcGVuZCgkKCc8dGltZT4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdkYXRldGltZScsIGxhc3RNb2RpZmllZC50b0lTT1N0cmluZygpKVxyXG4gICAgICAgICAgICAgICAgICAgIC50ZXh0KGxhc3RNb2RpZmllZC50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF0pKTtcclxuICAgICAgICAgICAgcmFua2luZ1Jvd3MgPSBkYXRhLm1hcCgoeCwgaSkgPT4gbmV3IFJhbmtpbmdSb3coaSArIDEsIHgpKTtcclxuICAgICAgICAgICAgaW5pdFVuc29ydGVkUmFua2luZ1RhYmxlUm93cygpO1xyXG4gICAgICAgICAgICBkcmF3UmFua2luZ1RhYmxlKCk7XHJcbiAgICAgICAgICAgICQoJyNzdW1tYXJ5LXRhYmxlLWxvYWRlcicpLmhpZGUoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgICQuZ2V0SlNPTignZGF0YS9yYW5raW5nLmpzb24nKS50aGVuKChkYXRhLCBfLCB4aHIpID0+IHtcclxuICAgICAgICAgICAgbG9hZERhdGEoZGF0YSwgbmV3IERhdGUoeGhyLmdldFJlc3BvbnNlSGVhZGVyKCdMYXN0LU1vZGlmaWVkJykgYXMgc3RyaW5nKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKC9yYW5raW5nXFwuaHRtbCQvaS50ZXN0KGxvY2F0aW9uLnBhdGhuYW1lKSkge1xyXG4gICAgICAgICQocmFua2luZ01haW4pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAkKG1haW4pO1xyXG4gICAgfVxyXG5cclxufVxyXG4iXX0=