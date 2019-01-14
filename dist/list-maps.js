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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1tYXBzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpc3QtbWFwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQSxJQUFVLFFBQVEsQ0FrK0JqQjtBQWwrQkQsV0FBVSxRQUFRO0lBZWxCLE1BQU0sWUFBWSxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pDLE1BQU0sVUFBVTtRQXlCWixZQUE2QixJQUFvQjtZQUFwQixTQUFJLEdBQUosSUFBSSxDQUFnQjtZQUM3QztnQkFDSSxJQUFJLENBQUMsZUFBZTtnQkFDcEIsSUFBSSxDQUFDLG9CQUFvQjtnQkFDekIsSUFBSSxDQUFDLElBQUk7Z0JBQ1QsSUFBSSxDQUFDLFVBQVU7Z0JBQ2YsSUFBSSxDQUFDLGFBQWE7Z0JBQ2xCLElBQUksQ0FBQyxjQUFjO2dCQUNuQixJQUFJLENBQUMsS0FBSztnQkFDVixJQUFJLENBQUMsRUFBRTtnQkFDUCxJQUFJLENBQUMsVUFBVTtnQkFDZixJQUFJLENBQUMsU0FBUztnQkFDZCxJQUFJLENBQUMsYUFBYTtnQkFDbEIsSUFBSSxDQUFDLFdBQVc7Z0JBQ2hCLElBQUksQ0FBQyxVQUFVO2dCQUNmLElBQUksQ0FBQyxJQUFJO2dCQUNULElBQUksQ0FBQyxJQUFJO2dCQUNULElBQUksQ0FBQyxJQUFJO2dCQUNULElBQUksQ0FBQyxNQUFNO2dCQUNYLElBQUksQ0FBQyxJQUFJO2dCQUNULElBQUksQ0FBQyxNQUFNO2dCQUNYLElBQUksQ0FBQyxXQUFXO2FBQ25CLEdBQUcsSUFBSSxDQUFDO1lBQ1QsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQztZ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cGFjZSBMaXN0TWFwcyB7XG5cbmludGVyZmFjZSBKUXVlcnkge1xuICAgIHRhYmxlc29ydCgpOiB2b2lkO1xuICAgIGRhdGEoa2V5OiAnc29ydEJ5Jywga2V5RnVuYzogKFxuICAgICAgICB0aDogSFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnQsXG4gICAgICAgIHRkOiBIVE1MVGFibGVEYXRhQ2VsbEVsZW1lbnQsXG4gICAgICAgIHRhYmxlc29ydDogYW55KSA9PiB2b2lkKTogdGhpcztcbn1cblxudHlwZSBTdW1tYXJ5Um93RGF0YSA9XG5bXG4gICAgbnVtYmVyLCBzdHJpbmcsIG51bWJlciwgc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgbnVtYmVyLCBudW1iZXIsIG51bWJlcixcbiAgICBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIHN0cmluZ1xuXTtcbmNvbnN0IE1JTklNVU1fREFURSA9IG5ldyBEYXRlKDApO1xuY2xhc3MgU3VtbWFyeVJvdyB7XG4gICAgYXBwcm92ZWRfc3RhdHVzOiBudW1iZXI7XG4gICAgYXBwcm92ZWRfZGF0ZV9zdHJpbmc6IHN0cmluZztcbiAgICBhcHByb3ZlZF9kYXRlOiBEYXRlO1xuICAgIG1vZGU6IG51bWJlcjtcbiAgICBiZWF0bWFwX2lkOiBzdHJpbmc7XG4gICAgYmVhdG1hcF9pZF9udW1iZXI6IG51bWJlcjtcbiAgICBiZWF0bWFwc2V0X2lkOiBzdHJpbmc7XG4gICAgZGlzcGxheV9zdHJpbmc6IHN0cmluZztcbiAgICBkaXNwbGF5X3N0cmluZ19sb3dlcjogc3RyaW5nO1xuICAgIHN0YXJzOiBudW1iZXI7XG4gICAgcHA6IG51bWJlcjtcbiAgICBoaXRfbGVuZ3RoOiBudW1iZXI7XG4gICAgbWF4X2NvbWJvOiBudW1iZXI7XG4gICAgYXBwcm9hY2hfcmF0ZTogbnVtYmVyO1xuICAgIGNpcmNsZV9zaXplOiBudW1iZXI7XG4gICAgbWluX21pc3NlczogbnVtYmVyO1xuICAgIGZjTk06IG51bWJlcjtcbiAgICBmY0hEOiBudW1iZXI7XG4gICAgZmNIUjogbnVtYmVyO1xuICAgIGZjSERIUjogbnVtYmVyO1xuICAgIGZjRFQ6IG51bWJlcjtcbiAgICBmY0hERFQ6IG51bWJlcjtcbiAgICB1cGRhdGVfZGF0ZTogc3RyaW5nO1xuICAgIGluZm86IEJlYXRtYXBJbmZvIHwgbnVsbDtcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGRhdGE6IFN1bW1hcnlSb3dEYXRhKSB7XG4gICAgICAgIFtcbiAgICAgICAgICAgIHRoaXMuYXBwcm92ZWRfc3RhdHVzLFxuICAgICAgICAgICAgdGhpcy5hcHByb3ZlZF9kYXRlX3N0cmluZyxcbiAgICAgICAgICAgIHRoaXMubW9kZSxcbiAgICAgICAgICAgIHRoaXMuYmVhdG1hcF9pZCxcbiAgICAgICAgICAgIHRoaXMuYmVhdG1hcHNldF9pZCxcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheV9zdHJpbmcsXG4gICAgICAgICAgICB0aGlzLnN0YXJzLFxuICAgICAgICAgICAgdGhpcy5wcCxcbiAgICAgICAgICAgIHRoaXMuaGl0X2xlbmd0aCxcbiAgICAgICAgICAgIHRoaXMubWF4X2NvbWJvLFxuICAgICAgICAgICAgdGhpcy5hcHByb2FjaF9yYXRlLFxuICAgICAgICAgICAgdGhpcy5jaXJjbGVfc2l6ZSxcbiAgICAgICAgICAgIHRoaXMubWluX21pc3NlcyxcbiAgICAgICAgICAgIHRoaXMuZmNOTSxcbiAgICAgICAgICAgIHRoaXMuZmNIRCxcbiAgICAgICAgICAgIHRoaXMuZmNIUixcbiAgICAgICAgICAgIHRoaXMuZmNIREhSLFxuICAgICAgICAgICAgdGhpcy5mY0RULFxuICAgICAgICAgICAgdGhpcy5mY0hERFQsXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZV9kYXRlLFxuICAgICAgICBdID0gZGF0YTtcbiAgICAgICAgdGhpcy5iZWF0bWFwX2lkX251bWJlciA9IHBhcnNlSW50KHRoaXMuYmVhdG1hcF9pZCk7XG4gICAgICAgIHRoaXMuYXBwcm92ZWRfZGF0ZSA9IG5ldyBEYXRlKHRoaXMuYXBwcm92ZWRfZGF0ZV9zdHJpbmcucmVwbGFjZSgnICcsICdUJykgKyAnKzA4OjAwJyk7XG4gICAgICAgIHRoaXMuZGlzcGxheV9zdHJpbmdfbG93ZXIgPSB0aGlzLmRpc3BsYXlfc3RyaW5nLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHRoaXMuaW5mbyA9IG51bGw7XG4gICAgfVxufVxuXG50eXBlIFJhbmtpbmdSb3dEYXRhID1cbltcbiAgICBudW1iZXIsIG51bWJlciwgc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgbnVtYmVyLCBzdHJpbmcsIHN0cmluZ1xuXTtcbmNsYXNzIFJhbmtpbmdSb3cge1xuICAgIHN0YXJzOiBudW1iZXI7XG4gICAgcHA6IG51bWJlcjtcbiAgICB1c2VyX2lkOiBzdHJpbmc7XG4gICAgdXNlcm5hbWU6IHN0cmluZztcbiAgICB1c2VybmFtZV9sb3dlcjogc3RyaW5nO1xuICAgIGJlYXRtYXBfaWQ6IHN0cmluZztcbiAgICBiZWF0bWFwX2lkX251bWJlcjogbnVtYmVyO1xuICAgIGJlYXRtYXBzZXRfaWQ6IHN0cmluZztcbiAgICBkaXNwbGF5X3N0cmluZzogc3RyaW5nO1xuICAgIGRpc3BsYXlfc3RyaW5nX2xvd2VyOiBzdHJpbmc7XG4gICAgbW9kczogc3RyaW5nO1xuICAgIGFjY3VyYWN5OiBudW1iZXI7XG4gICAgY29tYm9fZGlzcGxheTogc3RyaW5nO1xuICAgIGRhdGVfcGxheWVkX3N0cmluZzogc3RyaW5nO1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSByYW5rOiBudW1iZXIsIHByaXZhdGUgcmVhZG9ubHkgZGF0YTogUmFua2luZ1Jvd0RhdGEpIHtcbiAgICAgICAgW1xuICAgICAgICAgICAgdGhpcy5zdGFycyxcbiAgICAgICAgICAgIHRoaXMucHAsXG4gICAgICAgICAgICB0aGlzLnVzZXJfaWQsXG4gICAgICAgICAgICB0aGlzLnVzZXJuYW1lLFxuICAgICAgICAgICAgdGhpcy5iZWF0bWFwX2lkLFxuICAgICAgICAgICAgdGhpcy5iZWF0bWFwc2V0X2lkLFxuICAgICAgICAgICAgdGhpcy5kaXNwbGF5X3N0cmluZyxcbiAgICAgICAgICAgIHRoaXMubW9kcyxcbiAgICAgICAgICAgIHRoaXMuYWNjdXJhY3ksXG4gICAgICAgICAgICB0aGlzLmNvbWJvX2Rpc3BsYXksXG4gICAgICAgICAgICB0aGlzLmRhdGVfcGxheWVkX3N0cmluZ1xuICAgICAgICBdID0gZGF0YTtcbiAgICAgICAgdGhpcy5iZWF0bWFwX2lkX251bWJlciA9IHBhcnNlSW50KHRoaXMuYmVhdG1hcF9pZCk7XG4gICAgICAgIHRoaXMudXNlcm5hbWVfbG93ZXIgPSB0aGlzLnVzZXJuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHRoaXMuZGlzcGxheV9zdHJpbmdfbG93ZXIgPSB0aGlzLmRpc3BsYXlfc3RyaW5nLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxufVxuXG5cbmxldCBzdW1tYXJ5Um93czogU3VtbWFyeVJvd1tdID0gW107XG5sZXQgcmFua2luZ1Jvd3M6IFJhbmtpbmdSb3dbXSA9IFtdO1xubGV0IHVuc29ydGVkVGFibGVSb3dzOiBIVE1MVGFibGVSb3dFbGVtZW50W10gPSBbXTtcbmxldCBjdXJyZW50U29ydE9yZGVyOiBudW1iZXJbXSA9IFtdO1xubGV0IGN1cnJlbnRIYXNoTGluayA9ICcjJztcblxubGV0IHByZXZpb3VzSW5kaWNlcyA9ICcnO1xubGV0IHVuc29ydGVkVGFibGVSb3dzQ2hhbmdlZCA9IGZhbHNlO1xuZnVuY3Rpb24gZHJhd1RhYmxlKGluZGljZXM6IG51bWJlcltdKSB7XG4gICAgY29uc3Qgc3RyID0gaW5kaWNlcy5qb2luKCcsJyk7XG4gICAgaWYgKCF1bnNvcnRlZFRhYmxlUm93c0NoYW5nZWQgJiYgcHJldmlvdXNJbmRpY2VzID09PSBzdHIpIHJldHVybjtcbiAgICB1bnNvcnRlZFRhYmxlUm93c0NoYW5nZWQgPSBmYWxzZTtcbiAgICBwcmV2aW91c0luZGljZXMgPSBzdHI7XG4gICAgJCgnI3N1bW1hcnktdGFibGUgPiB0Ym9keScpXG4gICAgICAgIC5lbXB0eSgpXG4gICAgICAgIC5hcHBlbmQoaW5kaWNlcy5tYXAoaW5kZXggPT4gdW5zb3J0ZWRUYWJsZVJvd3NbaW5kZXhdKSk7XG59XG5cbmNsYXNzIFNlYXJjaFF1ZXJ5IHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgY2hlY2s6IChyb3c6IFN1bW1hcnlSb3cpID0+IGJvb2xlYW47XG4gICAgcHVibGljIHJlYWRvbmx5IG5vcm1hbGl6ZWRfc291cmNlOiBzdHJpbmc7XG4gICAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IHNvdXJjZTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGtleV90b19wcm9wZXJ0eV9uYW1lID0ge1xuICAgICAgICAgICAgJ3N0YXR1cyc6ICdcInBwcHJhcWxcIltyb3cuYXBwcm92ZWRfc3RhdHVzKzJdJyxcbiAgICAgICAgICAgICdtb2RlJzogJ1wib3RjbVwiW3Jvdy5tb2RlXScsXG4gICAgICAgICAgICAnc3RhcnMnOiAncm93LnN0YXJzJyxcbiAgICAgICAgICAgICdwcCc6ICdyb3cucHAnLFxuICAgICAgICAgICAgJ2xlbmd0aCc6ICdyb3cuaGl0X2xlbmd0aCcsXG4gICAgICAgICAgICAnY29tYm8nOiAncm93Lm1heF9jb21ibycsXG4gICAgICAgICAgICAnYXInOiAncm93LmFwcHJvYWNoX3JhdGUnLFxuICAgICAgICAgICAgJ2NzJzogJ3Jvdy5jaXJjbGVfc2l6ZScsXG4gICAgICAgICAgICAncGxheWVkJzogYCghcm93LmluZm8/SW5maW5pdHk6KCR7bmV3IERhdGUoKS52YWx1ZU9mKCl9LXJvdy5pbmZvLmxhc3RQbGF5ZWQudmFsdWVPZigpKS8kezFlMyAqIDYwICogNjAgKiAyNH0pYCxcbiAgICAgICAgICAgICd1bnBsYXllZCc6IGAocm93LmluZm8mJnJvdy5pbmZvLmxhc3RQbGF5ZWQudmFsdWVPZigpIT09JHtNSU5JTVVNX0RBVEUudmFsdWVPZigpfT8neSc6JycpYCxcbiAgICAgICAgICAgICdkYXRlJzogYCgke25ldyBEYXRlKCkudmFsdWVPZigpfS1yb3cuYXBwcm92ZWRfZGF0ZS52YWx1ZU9mKCkpLyR7MWUzICogNjAgKiA2MCAqIDI0fWAsXG4gICAgICAgICAgICAncmFuayc6IGAoJHtKU09OLnN0cmluZ2lmeShyYW5rQWNoaWV2ZWRDbGFzcyl9WyFyb3cuaW5mbz85OnJvdy5pbmZvLnJhbmtBY2hpZXZlZF0pLnRvTG93ZXJDYXNlKClgXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHJlZ2V4cCA9IG5ldyBSZWdFeHAoYCgke1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoa2V5X3RvX3Byb3BlcnR5X25hbWUpLmpvaW4oJ3wnKVxuICAgICAgICB9KSg8PT98Pj0/fD18IT0pKFstXFxcXHdcXFxcLl0qKWApO1xuICAgICAgICBsZXQgY2hlY2tfZnVuY19zb3VyY2UgPSAncmV0dXJuIHRydWUnO1xuICAgICAgICB0aGlzLm5vcm1hbGl6ZWRfc291cmNlID0gJyc7XG4gICAgICAgIGZvciAoY29uc3QgdG9rZW4gb2Ygc291cmNlLnNwbGl0KCcgJykpIHtcbiAgICAgICAgICAgIGNvbnN0IHRyaW1tZWQgPSB0b2tlbi50cmltKCk7XG4gICAgICAgICAgICBpZiAodHJpbW1lZCA9PT0gJycpIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSByZWdleHAuZXhlYyh0cmltbWVkKTtcbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IG1hdGNoWzFdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlbCA9IG1hdGNoWzJdID09PSAnPScgPyAnPT0nIDogbWF0Y2hbMl07XG4gICAgICAgICAgICAgICAgbGV0IHZhbDogbnVtYmVyIHwgc3RyaW5nID0gcGFyc2VGbG9hdChtYXRjaFszXSk7XG4gICAgICAgICAgICAgICAgaWYgKGlzTmFOKHZhbCkpXG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IG1hdGNoWzNdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcCA9IChrZXlfdG9fcHJvcGVydHlfbmFtZSBhcyBhbnkpW2tleV07XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubm9ybWFsaXplZF9zb3VyY2UgIT09ICcnKSB0aGlzLm5vcm1hbGl6ZWRfc291cmNlICs9ICcgJztcbiAgICAgICAgICAgICAgICB0aGlzLm5vcm1hbGl6ZWRfc291cmNlICs9IG1hdGNoWzFdICsgbWF0Y2hbMl0gKyBtYXRjaFszXTtcbiAgICAgICAgICAgICAgICBjaGVja19mdW5jX3NvdXJjZSArPSBgJiYke3Byb3B9JHtyZWx9JHtKU09OLnN0cmluZ2lmeSh2YWwpfWA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0ciA9IHRyaW1tZWQudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlc2NhcGVkID0gSlNPTi5zdHJpbmdpZnkoc3RyKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ub3JtYWxpemVkX3NvdXJjZSAhPT0gJycpIHRoaXMubm9ybWFsaXplZF9zb3VyY2UgKz0gJyAnO1xuICAgICAgICAgICAgICAgIHRoaXMubm9ybWFsaXplZF9zb3VyY2UgKz0gc3RyO1xuICAgICAgICAgICAgICAgIGNoZWNrX2Z1bmNfc291cmNlICs9IGAmJnJvdy5kaXNwbGF5X3N0cmluZ19sb3dlci5pbmRleE9mKCR7ZXNjYXBlZH0pIT09LTFgO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2hlY2sgPSBuZXcgRnVuY3Rpb24oJ3JvdycsIGNoZWNrX2Z1bmNfc291cmNlKSBhcyBhbnk7XG4gICAgfVxufVxuXG5jb25zdCBzb3J0S2V5cyA9IFtcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5hcHByb3ZlZF9kYXRlX3N0cmluZyxcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5kaXNwbGF5X3N0cmluZ19sb3dlcixcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5zdGFycyxcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5wcCxcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5oaXRfbGVuZ3RoLFxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4Lm1heF9jb21ibyxcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5hcHByb2FjaF9yYXRlLFxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LmNpcmNsZV9zaXplLFxuICAgICh4OiBTdW1tYXJ5Um93KSA9PlxuICAgICAgICB4LmZjSEREVCAqIDIgKyB4LmZjRFQgKiAxZTggK1xuICAgICAgICB4LmZjSERIUiAqIDIgKyB4LmZjSFIgKiAxZTQgK1xuICAgICAgICB4LmZjSEQgKiAyICsgeC5mY05NIC1cbiAgICAgICAgeC5taW5fbWlzc2VzLFxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LnVwZGF0ZV9kYXRlLFxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiAheC5pbmZvID8gTUlOSU1VTV9EQVRFLnZhbHVlT2YoKSA6IHguaW5mby5sYXN0UGxheWVkLnZhbHVlT2YoKVxuXTtcblxuZnVuY3Rpb24gc3RyaW5naWZ5T2JqZWN0KG9iajogeyBba2V5OiBzdHJpbmddOiBzdHJpbmc7IH0pOiBzdHJpbmcge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopXG4gICAgICAgIC5tYXAoayA9PiBrICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KG9ialtrXSkpXG4gICAgICAgIC5qb2luKCcmJyk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlT2JqZWN0KHN0cjogc3RyaW5nKSB7XG4gICAgY29uc3QgcmVzID0ge307XG4gICAgc3RyLnNwbGl0KCcmJykuZm9yRWFjaChwYXJ0ID0+IHtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBwYXJ0Lm1hdGNoKC8oXFx3Kyk9KC4rKS8pO1xuICAgICAgICBpZiAobWF0Y2gpXG4gICAgICAgICAgICAocmVzIGFzIGFueSlbbWF0Y2hbMV1dID0gZGVjb2RlVVJJQ29tcG9uZW50KG1hdGNoWzJdKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCkge1xuICAgIGNvbnN0IGZpbHRlcl9hcHByb3ZlZF9zdGF0dXMgPSBwYXJzZUludCgkKCcjZmlsdGVyLWFwcHJvdmVkLXN0YXR1cycpLnZhbCgpIGFzIHN0cmluZyk7XG4gICAgY29uc3QgZmlsdGVyX21vZGUgPSBwYXJzZUludCgkKCcjZmlsdGVyLW1vZGUnKS52YWwoKSBhcyBzdHJpbmcpO1xuICAgIGNvbnN0IGZpbHRlcl9zZWFyY2hfcXVlcnkgPSBuZXcgU2VhcmNoUXVlcnkoKCQoJyNmaWx0ZXItc2VhcmNoLXF1ZXJ5JykudmFsKCkgYXMgc3RyaW5nKSk7XG4gICAgY29uc3QgZmlsdGVyX2ZjX2xldmVsID0gcGFyc2VJbnQoJCgnI2ZpbHRlci1mYy1sZXZlbCcpLnZhbCgpIGFzIHN0cmluZyk7XG4gICAgY29uc3QgZmlsdGVyX2xvY2FsX2RhdGEgPSBwYXJzZUludCgkKCcjZmlsdGVyLWxvY2FsLWRhdGEnKS52YWwoKSBhcyBzdHJpbmcpO1xuICAgIGNvbnN0IHNob3dfZnVsbF9yZXN1bHQgPSAkKCcjc2hvdy1mdWxsLXJlc3VsdCcpLnByb3AoJ2NoZWNrZWQnKTtcblxuICAgIGNvbnN0IGdldF9mY19sZXZlbCA9IChyb3c6IFN1bW1hcnlSb3cpID0+IHtcbiAgICAgICAgaWYgKHJvdy5taW5fbWlzc2VzICE9PSAwKSByZXR1cm4gMTtcbiAgICAgICAgaWYgKHJvdy5mY0RUICE9PSAwIHx8IHJvdy5mY0hERFQgIT09IDApIHJldHVybiA4O1xuICAgICAgICBpZiAocm93LmZjTk0gPT09IDAgJiYgcm93LmZjSEQgPT09IDAgJiYgcm93LmZjSFIgPT09IDAgJiYgcm93LmZjSERIUiA9PT0gMCkgcmV0dXJuIDI7XG4gICAgICAgIGlmIChyb3cuZmNOTSA9PT0gMCAmJiByb3cuZmNIRCA9PT0gMCkgcmV0dXJuIDM7XG4gICAgICAgIGlmIChyb3cuZmNIRCA9PT0gMCkgcmV0dXJuIDQ7XG4gICAgICAgIGlmIChyb3cuZmNIUiA9PT0gMCAmJiByb3cuZmNIREhSID09PSAwKSByZXR1cm4gNTtcbiAgICAgICAgaWYgKHJvdy5mY0hESFIgPT09IDApIHJldHVybiA2O1xuICAgICAgICByZXR1cm4gNztcbiAgICB9O1xuXG4gICAgY29uc3QgZ2V0X2xvY2FsX2RhdGFfZmxhZ3MgPSAocm93OiBTdW1tYXJ5Um93KTogbnVtYmVyID0+IHtcbiAgICAgICAgaWYgKGJlYXRtYXBJbmZvTWFwLnNpemUgPT09IDApIHJldHVybiAtMTtcbiAgICAgICAgbGV0IGZsYWdzID0gMDtcbiAgICAgICAgY29uc3QgaW5mbyA9IGJlYXRtYXBJbmZvTWFwLmdldChyb3cuYmVhdG1hcF9pZF9udW1iZXIpO1xuICAgICAgICBpZiAoIWluZm8pIHJldHVybiAwO1xuICAgICAgICBmbGFncyB8PSAyO1xuICAgICAgICBpZiAoaW5mby5sYXN0UGxheWVkLnZhbHVlT2YoKSAhPT0gTUlOSU1VTV9EQVRFLnZhbHVlT2YoKSlcbiAgICAgICAgICAgIGZsYWdzIHw9IDE7XG4gICAgICAgIHJldHVybiBmbGFncztcbiAgICB9O1xuXG4gICAgY3VycmVudEhhc2hMaW5rID0gJyMnO1xuICAgIGNvbnN0IG9iaiA9IHt9IGFzIHsgW2tleTogc3RyaW5nXTogc3RyaW5nOyB9O1xuICAgIGlmIChmaWx0ZXJfYXBwcm92ZWRfc3RhdHVzICE9PSAxKVxuICAgICAgICBvYmoucyA9IGZpbHRlcl9hcHByb3ZlZF9zdGF0dXMudG9TdHJpbmcoKTtcbiAgICBpZiAoZmlsdGVyX21vZGUgIT09IDMpXG4gICAgICAgIG9iai5tID0gZmlsdGVyX21vZGUudG9TdHJpbmcoKTtcbiAgICBpZiAoZmlsdGVyX3NlYXJjaF9xdWVyeS5ub3JtYWxpemVkX3NvdXJjZSAhPT0gJycpXG4gICAgICAgIG9iai5xID0gZmlsdGVyX3NlYXJjaF9xdWVyeS5ub3JtYWxpemVkX3NvdXJjZTtcbiAgICBpZiAoZmlsdGVyX2ZjX2xldmVsICE9PSAwKVxuICAgICAgICBvYmoubCA9IGZpbHRlcl9mY19sZXZlbC50b1N0cmluZygpO1xuICAgIGlmIChmaWx0ZXJfbG9jYWxfZGF0YSAhPT0gMClcbiAgICAgICAgb2JqLmQgPSBmaWx0ZXJfbG9jYWxfZGF0YS50b1N0cmluZygpO1xuICAgIGlmIChjdXJyZW50U29ydE9yZGVyLmxlbmd0aCAhPT0gMClcbiAgICAgICAgb2JqLm8gPSBjdXJyZW50U29ydE9yZGVyLmpvaW4oJy4nKTtcbiAgICBpZiAoc2hvd19mdWxsX3Jlc3VsdClcbiAgICAgICAgb2JqLmYgPSAnMSc7XG5cbiAgICBjdXJyZW50SGFzaExpbmsgKz0gc3RyaW5naWZ5T2JqZWN0KG9iaik7XG4gICAgaGlzdG9yeS5yZXBsYWNlU3RhdGUoe30sIGRvY3VtZW50LnRpdGxlLCBsb2NhdGlvbi5wYXRobmFtZSArIChjdXJyZW50SGFzaExpbmsgPT09ICcjJyA/ICcnIDogY3VycmVudEhhc2hMaW5rKSk7XG5cbiAgICBjb25zdCBpbmRpY2VzID0gc3VtbWFyeVJvd3MubWFwKChfLCBpbmRleCkgPT4gaW5kZXgpLmZpbHRlcihpbmRleCA9PiB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHN1bW1hcnlSb3dzW2luZGV4XTtcblxuICAgICAgICBpZiAoZmlsdGVyX2FwcHJvdmVkX3N0YXR1cyA9PT0gMSAmJlxuICAgICAgICAgICAgKHJvdy5hcHByb3ZlZF9zdGF0dXMgIT09IDEgJiYgcm93LmFwcHJvdmVkX3N0YXR1cyAhPT0gMikpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmIChmaWx0ZXJfYXBwcm92ZWRfc3RhdHVzID09PSAyICYmIHJvdy5hcHByb3ZlZF9zdGF0dXMgIT09IDQpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgaWYgKGZpbHRlcl9tb2RlID09PSAxICYmIHJvdy5tb2RlICE9PSAwKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoZmlsdGVyX21vZGUgPT09IDIgJiYgcm93Lm1vZGUgIT09IDIpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgaWYgKCFmaWx0ZXJfc2VhcmNoX3F1ZXJ5LmNoZWNrKHJvdykpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgaWYgKGZpbHRlcl9mY19sZXZlbCAhPT0gMCAmJiBnZXRfZmNfbGV2ZWwocm93KSAhPT0gZmlsdGVyX2ZjX2xldmVsKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIGlmIChmaWx0ZXJfbG9jYWxfZGF0YSAhPT0gMCkge1xuICAgICAgICAgICAgY29uc3QgZmxhZ3MgPSBnZXRfbG9jYWxfZGF0YV9mbGFncyhyb3cpO1xuICAgICAgICAgICAgc3dpdGNoIChmaWx0ZXJfbG9jYWxfZGF0YSkge1xuICAgICAgICAgICAgICAgIGNhc2UgMTogaWYgKChmbGFncyAmIDEpICE9PSAwKSByZXR1cm4gZmFsc2U7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMjogaWYgKChmbGFncyAmIDEpID09PSAwKSByZXR1cm4gZmFsc2U7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMzogaWYgKChmbGFncyAmIDIpICE9PSAwKSByZXR1cm4gZmFsc2U7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNDogaWYgKChmbGFncyAmIDIpID09PSAwKSByZXR1cm4gZmFsc2U7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNTogaWYgKChmbGFncyAmIDMpICE9PSAyKSByZXR1cm4gZmFsc2U7IGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICBjb25zdCBwcmV2SW5kZXggPSBBcnJheShzdW1tYXJ5Um93cy5sZW5ndGgpO1xuICAgIGZvciAoY29uc3Qgb3JkIG9mIGN1cnJlbnRTb3J0T3JkZXIpIHtcbiAgICAgICAgaWYgKG9yZCA9PT0gMCkgY29udGludWU7XG4gICAgICAgIGluZGljZXMuZm9yRWFjaCgoeCwgaSkgPT4gcHJldkluZGV4W3hdID0gaSk7XG4gICAgICAgIGNvbnN0IHNvcnRLZXkgPSBzb3J0S2V5c1tNYXRoLmFicyhvcmQpIC0gMV07XG4gICAgICAgIGNvbnN0IHNpZ24gPSBvcmQgPiAwID8gMSA6IC0xO1xuICAgICAgICBpbmRpY2VzLnNvcnQoKHgsIHkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGt4ID0gc29ydEtleShzdW1tYXJ5Um93c1t4XSk7XG4gICAgICAgICAgICBjb25zdCBreSA9IHNvcnRLZXkoc3VtbWFyeVJvd3NbeV0pO1xuICAgICAgICAgICAgcmV0dXJuIGt4IDwga3kgPyAtc2lnbiA6IGt4ID4ga3kgPyBzaWduIDogcHJldkluZGV4W3hdIC0gcHJldkluZGV4W3ldO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAkKCcjbnVtLXJlc3VsdHMnKS50ZXh0KGluZGljZXMubGVuZ3RoID09PSAxID8gJzEgbWFwJyA6IGluZGljZXMubGVuZ3RoLnRvU3RyaW5nKCkgKyAnIG1hcHMnKTtcbiAgICBjb25zdCB0cnVuY2F0ZV9udW0gPSBzaG93X2Z1bGxfcmVzdWx0ID8gSW5maW5pdHkgOiAxMDA7XG4gICAgaWYgKGluZGljZXMubGVuZ3RoID4gdHJ1bmNhdGVfbnVtKVxuICAgICAgICBpbmRpY2VzLmxlbmd0aCA9IHRydW5jYXRlX251bTtcblxuICAgICQoJyNoYXNoLWxpbmstdG8tdGhlLWN1cnJlbnQtdGFibGUnKS5hdHRyKCdocmVmJywgY3VycmVudEhhc2hMaW5rKTtcblxuICAgIGRyYXdUYWJsZShpbmRpY2VzKTtcbn1cblxuZnVuY3Rpb24gc2ltcGxpZnlTb3J0T3JkZXIob3JkZXI6IG51bWJlcltdLCBbbm9UaWVzLCBkZWZhdWx0T3JkZXJdOiBbbnVtYmVyW10sIG51bWJlcl0pOiBudW1iZXJbXSB7XG4gICAgY29uc3QgcmVzID0gW107XG4gICAgY29uc3Qgc2VlbiA9IEFycmF5KHNvcnRLZXlzLmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaSA9IG9yZGVyLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS0gaSkge1xuICAgICAgICBjb25zdCB4ID0gb3JkZXJbaV07XG4gICAgICAgIGlmICh4ID09PSAwKSBjb250aW51ZTtcbiAgICAgICAgY29uc3Qga2V5ID0gTWF0aC5hYnMoeCkgLSAxLCBzaWduID0geCA+IDAgPyAxIDogLTE7XG4gICAgICAgIGlmIChzZWVuW2tleV0pIGNvbnRpbnVlO1xuICAgICAgICBzZWVuW2tleV0gPSBzaWduO1xuICAgICAgICByZXMucHVzaCh4KTtcbiAgICAgICAgaWYgKG5vVGllcy5pbmRleE9mKGtleSkgIT09IC0xKSAvLyB0aGVyZSBpcyBhbG1vc3Qgbm8gdGllc1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChyZXMubGVuZ3RoICE9PSAwICYmIHJlc1tyZXMubGVuZ3RoIC0gMV0gPT09IGRlZmF1bHRPcmRlcilcbiAgICAgICAgcmVzLnBvcCgpO1xuICAgIHJlcy5yZXZlcnNlKCk7XG4gICAgcmV0dXJuIHJlcztcbn1cblxuY29uc3Qgc3VtbWFyeU9yZGVyQ29uZmlnOiBbbnVtYmVyW10sIG51bWJlcl0gPSBbWzAsIDEsIDIsIDMsIDQsIDUsIDldLCAtM107XG5jb25zdCByYW5raW5nT3JkZXJDb25maWc6IFtudW1iZXJbXSwgbnVtYmVyXSA9IFtbMCwgMSwgN10sIDFdO1xuZnVuY3Rpb24gc2V0UXVlcnlBY2NvcmRpbmdUb0hhc2goKSB7XG4gICAgbGV0IG9iajogeyBbazogc3RyaW5nXTogc3RyaW5nOyB9O1xuICAgIHRyeSB7XG4gICAgICAgIG9iaiA9IHBhcnNlT2JqZWN0KGxvY2F0aW9uLmhhc2guc3Vic3RyKDEpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIG9iaiA9IHt9O1xuICAgIH1cbiAgICBpZiAob2JqLnMgPT09IHVuZGVmaW5lZCkgb2JqLnMgPSAnMSc7XG4gICAgaWYgKG9iai5tID09PSB1bmRlZmluZWQpIG9iai5tID0gJzMnO1xuICAgIGlmIChvYmoucSA9PT0gdW5kZWZpbmVkKSBvYmoucSA9ICcnO1xuICAgIGlmIChvYmoubCA9PT0gdW5kZWZpbmVkKSBvYmoubCA9ICcwJztcbiAgICBpZiAob2JqLm8gPT09IHVuZGVmaW5lZCkgb2JqLm8gPSAnJztcbiAgICBpZiAob2JqLmYgPT09IHVuZGVmaW5lZCkgb2JqLmYgPSAnMCc7XG4gICAgaWYgKG9iai5kID09PSB1bmRlZmluZWQpIG9iai5kID0gJzAnO1xuICAgICQoJyNmaWx0ZXItYXBwcm92ZWQtc3RhdHVzJykudmFsKHBhcnNlSW50KG9iai5zKSk7XG4gICAgJCgnI2ZpbHRlci1tb2RlJykudmFsKHBhcnNlSW50KG9iai5tKSk7XG4gICAgJCgnI2ZpbHRlci1zZWFyY2gtcXVlcnknKS52YWwob2JqLnEpO1xuICAgICQoJyNmaWx0ZXItZmMtbGV2ZWwnKS52YWwocGFyc2VJbnQob2JqLmwpKTtcbiAgICAkKCcjZmlsdGVyLWxvY2FsLWRhdGEnKS52YWwocGFyc2VJbnQob2JqLmQpKTtcbiAgICAkKCcjc2hvdy1mdWxsLXJlc3VsdCcpLnByb3AoJ2NoZWNrZWQnLCAhIXBhcnNlSW50KG9iai5mKSk7XG4gICAgY3VycmVudFNvcnRPcmRlciA9IHNpbXBsaWZ5U29ydE9yZGVyKG9iai5vLnNwbGl0KCcuJykubWFwKHggPT4gcGFyc2VJbnQoeCkgfHwgMCksIHN1bW1hcnlPcmRlckNvbmZpZyk7XG4gICAgc2V0VGFibGVIZWFkU29ydGluZ01hcmsoKTtcbn1cblxuZnVuY3Rpb24gc2V0VGFibGVIZWFkU29ydGluZ01hcmsoKSB7XG4gICAgJCgnLnNvcnRlZCcpLnJlbW92ZUNsYXNzKCdzb3J0ZWQgYXNjZW5kaW5nIGRlc2NlbmRpbmcnKTtcbiAgICBjb25zdCB4ID0gY3VycmVudFNvcnRPcmRlci5sZW5ndGggPT09IDAgP1xuICAgICAgICAtMyA6IC8vIHN0YXJzIGRlc2NcbiAgICAgICAgY3VycmVudFNvcnRPcmRlcltjdXJyZW50U29ydE9yZGVyLmxlbmd0aCAtIDFdO1xuICAgIGNvbnN0IGluZGV4ID0gTWF0aC5hYnMoeCkgLSAxO1xuICAgICQoJCgnI3N1bW1hcnktdGFibGUgPiB0aGVhZCA+IHRyID4gdGgnKVtpbmRleF0pXG4gICAgICAgIC5hZGRDbGFzcygnc29ydGVkJykuYWRkQ2xhc3MoeCA+IDAgPyAnYXNjZW5kaW5nJyA6ICdkZXNjZW5kaW5nJyk7XG59XG5cbmZ1bmN0aW9uIHBhZCh4OiBudW1iZXIpIHtcbiAgICByZXR1cm4gKHggPCAxMCA/ICcwJyA6ICcnKSArIHg7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdERhdGUoZGF0ZTogRGF0ZSkge1xuICAgIHJldHVybiBkYXRlLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSArXG4gICAgICAgICcgJyArIHBhZChkYXRlLmdldEhvdXJzKCkpICtcbiAgICAgICAgJzonICsgcGFkKGRhdGUuZ2V0TWludXRlcygpKTtcbn1cblxuY29uc3QgcmFua0FjaGlldmVkQ2xhc3MgPSBbXG4gICAgJ1NTSCcsICdTSCcsICdTUycsICdTJywgJ0EnLFxuICAgICdCJywgJ0MnLCAnRCcsICdGJywgJy0nXG5dO1xuXG5sZXQgYmVhdG1hcEluZm9NYXBVc2VkVmVyc2lvbiA9IE1JTklNVU1fREFURTtcbmZ1bmN0aW9uIGluaXRVbnNvcnRlZFRhYmxlUm93cygpIHtcbiAgICBpZiAoc3VtbWFyeVJvd3MubGVuZ3RoID09PSAwKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAodW5zb3J0ZWRUYWJsZVJvd3MubGVuZ3RoICE9PSAwICYmIGJlYXRtYXBJbmZvTWFwVXNlZFZlcnNpb24gPT09IGJlYXRtYXBJbmZvTWFwVmVyc2lvbilcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGJlYXRtYXBJbmZvTWFwVXNlZFZlcnNpb24gPSBiZWF0bWFwSW5mb01hcFZlcnNpb247XG4gICAgaWYgKGJlYXRtYXBJbmZvTWFwLnNpemUgIT09IDApIHtcbiAgICAgICAgc3VtbWFyeVJvd3MuZm9yRWFjaChyb3cgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGJlYXRtYXBJbmZvTWFwLmdldChyb3cuYmVhdG1hcF9pZF9udW1iZXIpO1xuICAgICAgICAgICAgaWYgKGluZm8pXG4gICAgICAgICAgICAgICAgcm93LmluZm8gPSBpbmZvO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBtb2RlX2ljb25zID0gW1xuICAgICAgICAnZmEgZmEtZXhjaGFuZ2UnLFxuICAgICAgICAnJyxcbiAgICAgICAgJ2ZhIGZhLXRpbnQnLFxuICAgICAgICAnJyxcbiAgICBdO1xuICAgIGNvbnN0IGFwcHJvdmVkX3N0YXR1c19pY29ucyA9IFtcbiAgICAgICAgJ2ZhIGZhLXF1ZXN0aW9uJyxcbiAgICAgICAgJ2ZhIGZhLXF1ZXN0aW9uJyxcbiAgICAgICAgJ2ZhIGZhLXF1ZXN0aW9uJyxcbiAgICAgICAgJ2ZhIGZhLWFuZ2xlLWRvdWJsZS1yaWdodCcsXG4gICAgICAgICdmYSBmYS1maXJlJyxcbiAgICAgICAgJ2ZhIGZhLWNoZWNrJyxcbiAgICAgICAgJ2ZhIGZhLWhlYXJ0LW8nLFxuICAgIF07XG4gICAgdW5zb3J0ZWRUYWJsZVJvd3MgPSBzdW1tYXJ5Um93cy5tYXAocm93ID0+XG4gICAgICAgICQoJzx0cj4nKS5hcHBlbmQoW1xuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICQoJzxpPicpLmFkZENsYXNzKGFwcHJvdmVkX3N0YXR1c19pY29uc1tyb3cuYXBwcm92ZWRfc3RhdHVzICsgMl0pLFxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHJvdy5hcHByb3ZlZF9kYXRlX3N0cmluZy5zcGxpdCgnICcpWzBdKVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAkKCc8aT4nKS5hZGRDbGFzcyhtb2RlX2ljb25zW3Jvdy5tb2RlXSksXG4gICAgICAgICAgICAgICAgJCgnPGE+JylcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9vc3UucHB5LnNoL2IvJHtyb3cuYmVhdG1hcF9pZH0/bT0yYClcbiAgICAgICAgICAgICAgICAgICAgLnRleHQocm93LmRpc3BsYXlfc3RyaW5nKSxcbiAgICAgICAgICAgICAgICByb3cuYmVhdG1hcF9pZF9udW1iZXIgPiAwID8gJCgnPGRpdiBjbGFzcz1cImZsb2F0LXJpZ2h0XCI+JykuYXBwZW5kKFtcbiAgICAgICAgICAgICAgICAgICAgJCgnPGE+PGkgY2xhc3M9XCJmYSBmYS1waWN0dXJlLW9cIj4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9iLnBweS5zaC90aHVtYi8ke3Jvdy5iZWF0bWFwc2V0X2lkfS5qcGdgKSxcbiAgICAgICAgICAgICAgICAgICAgJCgnPGE+PGkgY2xhc3M9XCJmYSBmYS1kb3dubG9hZFwiPicpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignaHJlZicsIGBodHRwczovL29zdS5wcHkuc2gvZC8ke3Jvdy5iZWF0bWFwc2V0X2lkfW5gKSxcbiAgICAgICAgICAgICAgICAgICAgJCgnPGE+PGkgY2xhc3M9XCJmYSBmYS1jbG91ZC1kb3dubG9hZFwiPicpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignaHJlZicsIGBvc3U6Ly9kbC8ke3Jvdy5iZWF0bWFwc2V0X2lkfWApXG4gICAgICAgICAgICAgICAgXSkgOiAkKClcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByb3cuc3RhcnMudG9GaXhlZCgyKSxcbiAgICAgICAgICAgIHJvdy5wcC50b0ZpeGVkKDApLFxuICAgICAgICAgICAgYCR7TWF0aC5mbG9vcihyb3cuaGl0X2xlbmd0aCAvIDYwKX06JHtwYWQoTWF0aC5mbG9vcihyb3cuaGl0X2xlbmd0aCAlIDYwKSl9YCxcbiAgICAgICAgICAgIHJvdy5tYXhfY29tYm8udG9TdHJpbmcoKSxcbiAgICAgICAgICAgIHJvdy5hcHByb2FjaF9yYXRlLnRvRml4ZWQoMSksXG4gICAgICAgICAgICByb3cuY2lyY2xlX3NpemUudG9GaXhlZCgxKSxcbiAgICAgICAgICAgIChyb3cubWluX21pc3NlcyAhPT0gMCA/IChyb3cubWluX21pc3NlcyA9PT0gMSA/ICcxIG1pc3MnIDogcm93Lm1pbl9taXNzZXMgKyAnIG1pc3NlcycpIDpcbiAgICAgICAgICAgICAgICBbcm93LmZjTk0sIHJvdy5mY0hELCByb3cuZmNIUiwgcm93LmZjSERIUiwgcm93LmZjRFQsIHJvdy5mY0hERFRdLmpvaW4oJywgJykpLFxuICAgICAgICAgICAgcm93LnVwZGF0ZV9kYXRlLFxuICAgICAgICBiZWF0bWFwSW5mb01hcC5zaXplID09PSAwID8gW10gOlxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICQoJzxpIGNsYXNzPVwiZmFcIj4nKS5hZGRDbGFzcyhyb3cuaW5mbyA/ICdmYS1jaGVjay1zcXVhcmUtbycgOiAnZmEtc3F1YXJlLW8nKSxcbiAgICAgICAgICAgICAgICAkKCc8c3Bhbj4nKS5hZGRDbGFzcygncmFuay0nICsgcmFua0FjaGlldmVkQ2xhc3NbIXJvdy5pbmZvID8gOSA6IHJvdy5pbmZvLnJhbmtBY2hpZXZlZF0pLFxuICAgICAgICAgICAgICAgICQoJzxzcGFuPicpLnRleHQoXG4gICAgICAgICAgICAgICAgICAgICFyb3cuaW5mbyB8fCByb3cuaW5mby5sYXN0UGxheWVkLnZhbHVlT2YoKSA9PT0gTUlOSU1VTV9EQVRFLnZhbHVlT2YoKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyAnLS0tJyA6IGZvcm1hdERhdGUocm93LmluZm8ubGFzdFBsYXllZClcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgXVxuICAgICAgICBdLm1hcCh4ID0+ICQoJzx0ZD4nKS5hcHBlbmQoeCkpKVswXSBhcyBIVE1MVGFibGVSb3dFbGVtZW50KTtcblxuICAgIHVuc29ydGVkVGFibGVSb3dzQ2hhbmdlZCA9IHRydWU7XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHNob3dFcnJvck1lc3NhZ2UodGV4dDogc3RyaW5nKSB7XG4gICAgJCgnI2FsZXJ0cycpLmFwcGVuZChcbiAgICAgICAgJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LXdhcm5pbmcgYWxlcnQtZGlzbWlzc2FibGVcIj4nKVxuICAgICAgICAgICAgLnRleHQodGV4dClcbiAgICAgICAgICAgIC5hcHBlbmQoJzxhIGNsYXNzPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJhbGVydFwiPjxzcGFuPiZ0aW1lczsnKSk7XG59XG5cbmNvbnN0IExPQ0FMU1RPUkFHRV9QUkVGSVggPSAnbGlzdC1tYXBzLyc7XG5jb25zdCBFTkFCTEVfTE9DQUxTVE9SQUdFX1NBVkUgPSBmYWxzZTtcbnR5cGUgTG9jYWxGaWxlTmFtZSA9ICdvc3UhLmRiJyB8ICdzY29yZXMuZGInO1xuaW50ZXJmYWNlIExvY2FsRmlsZSB7XG4gICAgZGF0YTogVWludDhBcnJheTtcbiAgICB1cGxvYWRlZERhdGU6IERhdGU7XG59XG5jb25zdCBsb2NhbEZpbGVzOiB7XG4gICAgWydvc3UhLmRiJ10/OiBMb2NhbEZpbGUsXG4gICAgWydzY29yZXMuZGInXT86IExvY2FsRmlsZTtcbn0gPSB7fTtcblxuLypcbmZ1bmN0aW9uIGRhdGFVUkl0b1VJbnQ4QXJyYXkoZGF0YVVSSTogc3RyaW5nKSB7XG4gICAgY29uc3QgYmFzZTY0ID0gZGF0YVVSSS5zcGxpdCgnLCcpWzFdO1xuICAgIGNvbnN0IHN0ciA9IGF0b2IoYmFzZTY0KTtcbiAgICBjb25zdCBsZW4gPSBzdHIubGVuZ3RoO1xuICAgIGNvbnN0IGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkobGVuKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgKysgaSkge1xuICAgICAgICBhcnJheVtpXSA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXk7XG59XG4qL1xuXG5jb25zdCByZWdpc3RlcmVkQ2FsbGJhY2tNYXAgPSBuZXcgTWFwPG51bWJlciwgKGRhdGE6IGFueSkgPT4gYW55PigpO1xuZnVuY3Rpb24gcmVnaXN0ZXJDYWxsYmFjayhjYWxsYmFjazogKGRhdGE6IGFueSkgPT4gYW55KTogbnVtYmVyIHtcbiAgICBsZXQgaWQ7XG4gICAgZG9cbiAgICAgICAgaWQgPSBNYXRoLnJhbmRvbSgpO1xuICAgIHdoaWxlIChyZWdpc3RlcmVkQ2FsbGJhY2tNYXAuaGFzKGlkKSk7XG4gICAgcmVnaXN0ZXJlZENhbGxiYWNrTWFwLnNldChpZCwgY2FsbGJhY2spO1xuICAgIHJldHVybiBpZDtcbn1cblxuZnVuY3Rpb24gbmV3V29ya2VyKCk6IFdvcmtlciB7XG4gICAgcmV0dXJuIG5ldyBXb3JrZXIoJ2Rpc3QvbGlzdC1tYXBzLXdvcmtlci5qcycpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5Xb3JrZXIobWVzc2FnZTogb2JqZWN0LCB1c2luZz86IFdvcmtlcik6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueT4ocmVzb2x2ZSA9PiB7XG4gICAgICAgIGNvbnN0IHdvcmtlciA9IHVzaW5nIHx8IG5ld1dvcmtlcigpO1xuICAgICAgICAobWVzc2FnZSBhcyBhbnkpLmlkID0gcmVnaXN0ZXJDYWxsYmFjayhyZXNvbHZlKTtcbiAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICB3b3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gZXZlbnQuZGF0YTtcbiAgICAgICAgICAgIGlmIChkYXRhLnR5cGUgPT09ICdjYWxsYmFjaycgJiYgdHlwZW9mKGRhdGEuaWQpID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gcmVnaXN0ZXJlZENhbGxiYWNrTWFwLmdldChkYXRhLmlkKTtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgcmVnaXN0ZXJlZENhbGxiYWNrTWFwLmRlbGV0ZShkYXRhLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmYWxzZSk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21wcmVzc0J1ZmZlclRvU3RyaW5nKGJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGNvbXByZXNzZWQgPSAoYXdhaXQgcnVuV29ya2VyKHtcbiAgICAgICAgdHlwZTogJ2NvbXByZXNzJyxcbiAgICAgICAgZGF0YTogbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKVxuICAgIH0pKS5kYXRhIGFzIFVpbnQ4QXJyYXk7XG4gICAgY29uc3QgY2hhcnMgPSBuZXcgQXJyYXkoTWF0aC5mbG9vcihjb21wcmVzc2VkLmxlbmd0aCAvIDIpKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoYXJzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSAoY29tcHJlc3NlZFtpICogMiArIDBdICYgMHhmZikgPDwgOCB8IChjb21wcmVzc2VkW2kgKiAyICsgMV0gJiAweGZmKTtcbiAgICAgICAgY2hhcnNbaV0gPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpO1xuICAgIH1cbiAgICBsZXQgcmVzID0gY29tcHJlc3NlZC5sZW5ndGggJSAyID8gJzEnIDogJzAnO1xuICAgIHJlcyArPSBjaGFycy5qb2luKCcnKTtcbiAgICBpZiAoY29tcHJlc3NlZC5sZW5ndGggJSAyICE9PSAwKVxuICAgICAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoY29tcHJlc3NlZFtjb21wcmVzc2VkLmxlbmd0aCAtIDFdICYgMHhmZikgPDwgOCk7XG4gICAgcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlY29tcHJlc3NCdWZmZXJGcm9tU3RyaW5nKHN0cjogc3RyaW5nKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gICAgY29uc3QgcGFyaXR5ID0gc3RyWzBdID09PSAnMScgPyAxIDogMDtcbiAgICBjb25zdCBsZW4gPSBzdHIubGVuZ3RoIC0gMSAtIHBhcml0eTtcbiAgICBjb25zdCBhcnJheSA9IG5ldyBVaW50OEFycmF5KGxlbiAqIDIgKyBwYXJpdHkpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3QgY29kZSA9IHN0ci5jaGFyQ29kZUF0KGkgKyAxKTtcbiAgICAgICAgYXJyYXlbaSAqIDIgKyAwXSA9IGNvZGUgPj4gODtcbiAgICAgICAgYXJyYXlbaSAqIDIgKyAxXSA9IGNvZGUgJiAweGZmO1xuICAgIH1cbiAgICBpZiAocGFyaXR5ICE9PSAwKVxuICAgICAgICBhcnJheVtsZW4gKiAyXSA9IHN0ci5jaGFyQ29kZUF0KGxlbiArIDEpID4+IDg7XG4gICAgY29uc3QgZGVjb21wcmVzc2VkID0gKGF3YWl0IHJ1bldvcmtlcih7XG4gICAgICAgIHR5cGU6ICdkZWNvbXByZXNzJyxcbiAgICAgICAgZGF0YTogYXJyYXlcbiAgICB9KSkuZGF0YSBhcyBVaW50OEFycmF5O1xuICAgIHJldHVybiBkZWNvbXByZXNzZWQ7XG59XG5cbmZ1bmN0aW9uIHJlbG9hZExvY2FsRmlsZShuYW1lOiBMb2NhbEZpbGVOYW1lKSB7XG4gICAgY29uc3QgZiA9IGxvY2FsRmlsZXNbbmFtZV07XG4gICAgaWYgKG5hbWUgPT09ICdvc3UhLmRiJylcbiAgICAgICAgJCgnI2ZpbHRlci1sb2NhbC1kYXRhJykucHJvcCgnZGlzYWJsZWQnLCBmID09PSB1bmRlZmluZWQpO1xuICAgICQobmFtZSA9PT0gJ29zdSEuZGInID8gJyNjdXJyZW50LW9zdWRiLWZpbGUnIDogJyNjdXJyZW50LXNjb3Jlc2RiLWZpbGUnKVxuICAgICAgICAudGV4dCghZiA/ICdObyBkYXRhJyA6IGZvcm1hdERhdGUoZi51cGxvYWRlZERhdGUpKTtcbiAgICBpZiAoIWYpIHJldHVybjtcbiAgICBpZiAobmFtZSA9PT0gJ29zdSEuZGInKSB7XG4gICAgICAgIGxvYWRPc3VEQihmLmRhdGEuYnVmZmVyLCBmLnVwbG9hZGVkRGF0ZSk7XG4gICAgfSBlbHNlIHtcblxuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZEZyb21Mb2NhbFN0b3JhZ2UobmFtZTogTG9jYWxGaWxlTmFtZSkge1xuICAgIGNvbnN0IGRhdGVTdHIgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShMT0NBTFNUT1JBR0VfUFJFRklYICsgbmFtZSArICcvdXBsb2FkZWQtZGF0ZScpO1xuICAgIGlmICghZGF0ZVN0cikgcmV0dXJuO1xuICAgIGNvbnN0IGVuY29kZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShMT0NBTFNUT1JBR0VfUFJFRklYICsgbmFtZSArICcvZGF0YScpITtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZGVjb21wcmVzc0J1ZmZlckZyb21TdHJpbmcoZW5jb2RlZCk7XG4gICAgY29uc29sZS5sb2coJ2ZpbGUgJyArIG5hbWUgKyAnIGxvYWRlZCBmcm9tIGxvY2FsU3RvcmFnZScpO1xuICAgIGxvY2FsRmlsZXNbbmFtZV0gPSB7XG4gICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIHVwbG9hZGVkRGF0ZTogbmV3IERhdGUoZGF0ZVN0cilcbiAgICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBzZXRMb2NhbEZpbGUobmFtZTogTG9jYWxGaWxlTmFtZSwgZmlsZTogRmlsZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPihyZXNvbHZlID0+IHtcbiAgICAgICAgY29uc3QgZnIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICBmci5vbmxvYWQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmaWxlICcgKyBuYW1lICsgJyBsb2FkZWQnKTtcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IGZyLnJlc3VsdCBhcyBBcnJheUJ1ZmZlcjtcbiAgICAgICAgICAgIGNvbnN0IHVwbG9hZGVkRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBsb2NhbEZpbGVzW25hbWVdID0ge1xuICAgICAgICAgICAgICAgIGRhdGE6IG5ldyBVaW50OEFycmF5KGJ1ZmZlciksXG4gICAgICAgICAgICAgICAgdXBsb2FkZWREYXRlOiB1cGxvYWRlZERhdGUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVsb2FkTG9jYWxGaWxlKG5hbWUpO1xuICAgICAgICAgICAgY29tcHJlc3NCdWZmZXJUb1N0cmluZyhidWZmZXIpLnRoZW4oZGF0YVN0ciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpbGUgJyArIG5hbWUgKyAnIGNvbXByZXNzZWQnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50ID0gbG9jYWxGaWxlc1tuYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudCAmJiBjdXJyZW50LnVwbG9hZGVkRGF0ZS52YWx1ZU9mKCkgIT09IHVwbG9hZGVkRGF0ZS52YWx1ZU9mKCkpIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoIUVOQUJMRV9MT0NBTFNUT1JBR0VfU0FWRSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKExPQ0FMU1RPUkFHRV9QUkVGSVggKyBuYW1lICsgJy9kYXRhJywgZGF0YVN0cik7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKExPQ0FMU1RPUkFHRV9QUkVGSVggKyBuYW1lICsgJy91cGxvYWRlZC1kYXRlJywgdXBsb2FkZWREYXRlLnRvSVNPU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZmlsZSAnICsgbmFtZSArICcgc2F2ZWQgdG8gbG9jYWxTdG9yYWdlJyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdsb2NhbFN0b3JhZ2UgZXJyb3I6ICcsIGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcbiAgICAgICAgfTtcbiAgICAgICAgZnIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZSk7XG4gICAgfSk7XG59XG5cbmNsYXNzIFNlcmlhbGl6YXRpb25SZWFkZXIge1xuICAgIHByaXZhdGUgZHY6IERhdGFWaWV3O1xuICAgIHByaXZhdGUgb2Zmc2V0OiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihidWZmZXI6IEFycmF5QnVmZmVyKSB7XG4gICAgICAgIHRoaXMuZHYgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcbiAgICAgICAgdGhpcy5vZmZzZXQgPSAwO1xuICAgIH1cblxuICAgIHB1YmxpYyBza2lwKGJ5dGVzOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gYnl0ZXM7XG4gICAgfVxuXG4gICAgcHVibGljIHJlYWRJbnQ4KCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmR2LmdldEludDgodGhpcy5vZmZzZXQpO1xuICAgICAgICB0aGlzLm9mZnNldCArPSAxO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkSW50MTYoKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0SW50MTYodGhpcy5vZmZzZXQsIHRydWUpO1xuICAgICAgICB0aGlzLm9mZnNldCArPSAyO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkSW50MzIoKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0SW50MzIodGhpcy5vZmZzZXQsIHRydWUpO1xuICAgICAgICB0aGlzLm9mZnNldCArPSA0O1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkQnl0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZEludDgoKSB8IDA7XG4gICAgfVxuXG4gICAgcHVibGljIHJlYWRVSW50MTYoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRJbnQxNigpIHwgMDtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVhZFVJbnQzMigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZEludDMyKCkgfCAwO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkQm9vbGVhbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZEludDgoKSAhPT0gMDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlYWRVTEVCMTI4KCkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gMDtcbiAgICAgICAgZm9yIChsZXQgc2hpZnQgPSAwOyA7IHNoaWZ0ICs9IDcpIHtcbiAgICAgICAgICAgIGNvbnN0IGJ5dGUgPSB0aGlzLmR2LmdldFVpbnQ4KHRoaXMub2Zmc2V0KTtcbiAgICAgICAgICAgIHRoaXMub2Zmc2V0ICs9IDE7XG4gICAgICAgICAgICByZXN1bHQgfD0gKGJ5dGUgJiAweDdmKSA8PCBzaGlmdDtcbiAgICAgICAgICAgIGlmICgoYnl0ZSAmIDB4ODApID09PSAwKVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVhZFVpbnQ4QXJyYXkobGVuZ3RoOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5kdi5idWZmZXIsIHRoaXMub2Zmc2V0LCBsZW5ndGgpO1xuICAgICAgICB0aGlzLm9mZnNldCArPSBsZW5ndGg7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHVibGljIHJlYWRTdHJpbmcoKSB7XG4gICAgICAgIGNvbnN0IGhlYWRlciA9IHRoaXMucmVhZEludDgoKTtcbiAgICAgICAgaWYgKGhlYWRlciA9PT0gMClcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gdGhpcy5yZWFkVUxFQjEyOCgpO1xuICAgICAgICBjb25zdCBhcnJheSA9IHRoaXMucmVhZFVpbnQ4QXJyYXkobGVuZ3RoKTtcbiAgICAgICAgcmV0dXJuIG5ldyBUZXh0RGVjb2RlcigndXRmLTgnKS5kZWNvZGUoYXJyYXkpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkSW50NjRSb3VuZGVkKCkge1xuICAgICAgICBjb25zdCBsbyA9IHRoaXMuZHYuZ2V0VWludDMyKHRoaXMub2Zmc2V0LCB0cnVlKTtcbiAgICAgICAgY29uc3QgaGkgPSB0aGlzLmR2LmdldFVpbnQzMih0aGlzLm9mZnNldCArIDQsIHRydWUpO1xuICAgICAgICB0aGlzLm9mZnNldCArPSA4O1xuICAgICAgICByZXR1cm4gaGkgKiAweDEwMDAwMDAwMCArIGxvO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkRGF0ZVRpbWUoKSB7XG4gICAgICAgIC8vIE9GRlNFVCA9IDYyMTM1NTk2ODAwMDAwMDAwMCA9IHRpY2tzIGZyb20gMDAwMS8xLzEgdG8gMTk3MC8xLzFcbiAgICAgICAgbGV0IGxvID0gdGhpcy5yZWFkVUludDMyKCk7XG4gICAgICAgIGxldCBoaSA9IHRoaXMucmVhZFVJbnQzMigpO1xuICAgICAgICBsbyAtPSAzNDQ0MjkzNjMyOyAvLyBsbyBiaXRzIG9mIE9GRlNFVFxuICAgICAgICBpZiAobG8gPCAwKSB7XG4gICAgICAgICAgICBsbyArPSA0Mjk0OTY3Mjk2OyAgIC8vIDJeMzJcbiAgICAgICAgICAgIGhpIC09IDE7XG4gICAgICAgIH1cbiAgICAgICAgaGkgLT0gMTQ0NjcwNTA4OyAgLy8gaGkgYml0cyBvZiBPRkZTRVRcbiAgICAgICAgY29uc3QgdGlja3MgPSBoaSAqIDQyOTQ5NjcyOTYgKyBsbztcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKHRpY2tzICogMWUtNCk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlYWRTaW5nbGUoKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0RmxvYXQzMih0aGlzLm9mZnNldCwgdHJ1ZSk7XG4gICAgICAgIHRoaXMub2Zmc2V0ICs9IDQ7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHVibGljIHJlYWREb3VibGUoKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0RmxvYXQ2NCh0aGlzLm9mZnNldCwgdHJ1ZSk7XG4gICAgICAgIHRoaXMub2Zmc2V0ICs9IDg7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHVibGljIHJlYWRMaXN0KGNhbGxiYWNrOiAoaW5kZXg6IG51bWJlcikgPT4gYW55KSB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gdGhpcy5yZWFkSW50MzIoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSArPSAxKVxuICAgICAgICAgICAgY2FsbGJhY2soaSk7XG4gICAgfVxufVxuXG5jbGFzcyBCZWF0bWFwSW5mbyB7XG4gICAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmVhdG1hcElkOiBudW1iZXIsXG4gICAgICAgIHB1YmxpYyByZWFkb25seSBsYXN0UGxheWVkOiBEYXRlLFxuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgcmFua0FjaGlldmVkOiBudW1iZXIpIHt9XG59XG5cbmZ1bmN0aW9uIHJlYWRCZWF0bWFwKHNyOiBTZXJpYWxpemF0aW9uUmVhZGVyKSB7XG4gICAgY29uc3QgU2l6ZUluQnl0ZXMgPSBzci5yZWFkSW50MzIoKTtcblxuICAgIGNvbnN0IEFydGlzdCA9IHNyLnJlYWRTdHJpbmcoKTtcbiAgICBjb25zdCBBcnRpc3RVbmljb2RlID0gc3IucmVhZFN0cmluZygpO1xuICAgIGNvbnN0IFRpdGxlID0gc3IucmVhZFN0cmluZygpO1xuICAgIGNvbnN0IFRpdGxlVW5pY29kZSA9IHNyLnJlYWRTdHJpbmcoKTtcbiAgICBjb25zdCBDcmVhdG9yID0gc3IucmVhZFN0cmluZygpO1xuICAgIGNvbnN0IFZlcnNpb24gPSBzci5yZWFkU3RyaW5nKCk7XG4gICAgY29uc3QgQXVkaW9GaWxlbmFtZSA9IHNyLnJlYWRTdHJpbmcoKTtcbiAgICBjb25zdCBCZWF0bWFwQ2hlY2tzdW0gPSBzci5yZWFkU3RyaW5nKCk7XG4gICAgY29uc3QgRmlsZW5hbWUgPSBzci5yZWFkU3RyaW5nKCk7XG4gICAgY29uc3QgU3VibWlzc2lvblN0YXR1cyA9IHNyLnJlYWRCeXRlKCk7XG4gICAgY29uc3QgY291bnROb3JtYWwgPSBzci5yZWFkVUludDE2KCk7XG4gICAgY29uc3QgY291bnRTbGlkZXIgPSBzci5yZWFkVUludDE2KCk7XG4gICAgY29uc3QgY291bnRTcGlubmVyID0gc3IucmVhZFVJbnQxNigpO1xuICAgIGNvbnN0IERhdGVNb2RpZmllZCA9IHNyLnJlYWREYXRlVGltZSgpO1xuXG4gICAgY29uc3QgRGlmZmljdWx0eUFwcHJvYWNoUmF0ZSA9IHNyLnJlYWRTaW5nbGUoKTtcbiAgICBjb25zdCBEaWZmaWN1bHR5Q2lyY2xlU2l6ZSA9IHNyLnJlYWRTaW5nbGUoKTtcbiAgICBjb25zdCBEaWZmaWN1bHR5SHBEcmFpblJhdGUgPSBzci5yZWFkU2luZ2xlKCk7XG4gICAgY29uc3QgRGlmZmljdWx0eU92ZXJhbGwgPSBzci5yZWFkU2luZ2xlKCk7XG5cbiAgICBjb25zdCBEaWZmaWN1bHR5U2xpZGVyTXVsdGlwbGllciA9IHNyLnJlYWREb3VibGUoKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSArPSAxKSB7XG4gICAgICAgIHNyLnJlYWRMaXN0KCgpID0+IHtcbiAgICAgICAgICAgIHNyLnJlYWRJbnQzMigpO1xuICAgICAgICAgICAgc3IucmVhZEludDE2KCk7XG4gICAgICAgICAgICBzci5yZWFkRG91YmxlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IERyYWluTGVuZ3RoID0gc3IucmVhZEludDMyKCk7XG4gICAgY29uc3QgVG90YWxMZW5ndGggPSBzci5yZWFkSW50MzIoKTtcbiAgICBjb25zdCBQcmV2aWV3VGltZSA9IHNyLnJlYWRJbnQzMigpO1xuICAgIHNyLnJlYWRMaXN0KCgpID0+IHtcbiAgICAgICAgY29uc3QgQmVhdExlbmd0aCA9IHNyLnJlYWREb3VibGUoKTtcbiAgICAgICAgY29uc3QgT2Zmc2V0ID0gc3IucmVhZERvdWJsZSgpO1xuICAgICAgICBjb25zdCBUaW1pbmdDaGFuZ2UgPSBzci5yZWFkQm9vbGVhbigpO1xuICAgIH0pO1xuICAgIGNvbnN0IEJlYXRtYXBJZCA9IHNyLnJlYWRJbnQzMigpO1xuICAgIGNvbnN0IEJlYXRtYXBTZXRJZCA9IHNyLnJlYWRJbnQzMigpO1xuICAgIGNvbnN0IEJlYXRtYXBUb3BpY0lkID0gc3IucmVhZEludDMyKCk7XG4gICAgY29uc3QgUGxheWVyUmFua09zdSA9IHNyLnJlYWRCeXRlKCk7XG4gICAgY29uc3QgUGxheWVyUmFua0ZydWl0cyA9IHNyLnJlYWRCeXRlKCk7XG4gICAgY29uc3QgUGxheWVyUmFua1RhaWtvID0gc3IucmVhZEJ5dGUoKTtcbiAgICBjb25zdCBQbGF5ZXJSYW5rTWFuaWEgPSBzci5yZWFkQnl0ZSgpO1xuICAgIGNvbnN0IFBsYXllck9mZnNldCA9IHNyLnJlYWRJbnQxNigpO1xuICAgIGNvbnN0IFN0YWNrTGVuaWVuY3kgPSBzci5yZWFkU2luZ2xlKCk7XG4gICAgY29uc3QgUGxheU1vZGUgPSBzci5yZWFkQnl0ZSgpO1xuICAgIGNvbnN0IFNvdXJjZSA9IHNyLnJlYWRTdHJpbmcoKTtcbiAgICBjb25zdCBUYWdzID0gc3IucmVhZFN0cmluZygpO1xuICAgIGNvbnN0IE9ubGluZU9mZnNldCA9IHNyLnJlYWRJbnQxNigpO1xuICAgIGNvbnN0IE9ubGluZURpc3BsYXlUaXRsZSA9IHNyLnJlYWRTdHJpbmcoKTtcbiAgICBjb25zdCBOZXdGaWxlID0gc3IucmVhZEJvb2xlYW4oKTtcbiAgICBjb25zdCBEYXRlTGFzdFBsYXllZCA9IHNyLnJlYWREYXRlVGltZSgpO1xuICAgIGNvbnN0IEluT3N6Q29udGFpbmVyID0gc3IucmVhZEJvb2xlYW4oKTtcbiAgICBjb25zdCBDb250YWluaW5nRm9sZGVyQWJzb2x1dGUgPSBzci5yZWFkU3RyaW5nKCk7XG4gICAgY29uc3QgTGFzdEluZm9VcGRhdGUgPSBzci5yZWFkRGF0ZVRpbWUoKTtcbiAgICBjb25zdCBEaXNhYmxlU2FtcGxlcyA9IHNyLnJlYWRCb29sZWFuKCk7XG4gICAgY29uc3QgRGlzYWJsZVNraW4gPSBzci5yZWFkQm9vbGVhbigpO1xuICAgIGNvbnN0IERpc2FibGVTdG9yeWJvYXJkID0gc3IucmVhZEJvb2xlYW4oKTtcbiAgICBjb25zdCBEaXNhYmxlVmlkZW8gPSBzci5yZWFkQm9vbGVhbigpO1xuICAgIGNvbnN0IFZpc3VhbFNldHRpbmdzT3ZlcnJpZGUgPSBzci5yZWFkQm9vbGVhbigpO1xuXG4gICAgY29uc3QgTGFzdEVkaXRUaW1lID0gc3IucmVhZEludDMyKCk7XG4gICAgY29uc3QgTWFuaWFTcGVlZCA9IHNyLnJlYWRCeXRlKCk7XG5cbiAgICByZXR1cm4gbmV3IEJlYXRtYXBJbmZvKFxuICAgICAgICBCZWF0bWFwSWQsXG4gICAgICAgIG5ldyBEYXRlKE1hdGgubWF4KE1JTklNVU1fREFURS52YWx1ZU9mKCksIERhdGVMYXN0UGxheWVkLnZhbHVlT2YoKSkpLFxuICAgICAgICBQbGF5ZXJSYW5rRnJ1aXRzKTtcbn1cblxuY29uc3QgYmVhdG1hcEluZm9NYXAgPSBuZXcgTWFwPG51bWJlciwgQmVhdG1hcEluZm8+KCk7XG5sZXQgYmVhdG1hcEluZm9NYXBWZXJzaW9uID0gTUlOSU1VTV9EQVRFO1xuXG5mdW5jdGlvbiBsb2FkT3N1REIoYnVmZmVyOiBBcnJheUJ1ZmZlciwgdmVyc2lvbjogRGF0ZSkge1xuICAgIGJlYXRtYXBJbmZvTWFwLmNsZWFyKCk7XG4gICAgY29uc3Qgc3IgPSBuZXcgU2VyaWFsaXphdGlvblJlYWRlcihidWZmZXIpO1xuICAgIHNyLnNraXAoNCArIDQgKyAxICsgOCk7XG4gICAgc3IucmVhZFN0cmluZygpO1xuICAgIGNvbnN0IGJlYXRtYXBDb3VudCA9IHNyLnJlYWRJbnQzMigpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiZWF0bWFwQ291bnQ7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBiZWF0bWFwID0gcmVhZEJlYXRtYXAoc3IpO1xuICAgICAgICBpZiAoYmVhdG1hcC5iZWF0bWFwSWQgPiAwKVxuICAgICAgICAgICAgYmVhdG1hcEluZm9NYXAuc2V0KGJlYXRtYXAuYmVhdG1hcElkLCBiZWF0bWFwKTtcbiAgICB9XG5cbiAgICBiZWF0bWFwSW5mb01hcFZlcnNpb24gPSB2ZXJzaW9uO1xufVxuXG5mdW5jdGlvbiBpbml0VGFibGUoc29ydEtleXM6IHt9W10sIG9yZGVyQ29uZmlnOiBbbnVtYmVyW10sIG51bWJlcl0sIG9uU29ydE9yZGVyQ2hhbmdlZDogKCkgPT4gdm9pZCkge1xuICAgIGNvbnN0IHRoTGlzdCA9ICQoJyNzdW1tYXJ5LXRhYmxlID4gdGhlYWQgPiB0ciA+IHRoJyk7XG4gICAgc29ydEtleXMuZm9yRWFjaCgoXywgaW5kZXgpID0+IHtcbiAgICAgICAgJC5kYXRhKHRoTGlzdFtpbmRleF0sICd0aEluZGV4JywgaW5kZXgpO1xuICAgIH0pO1xuICAgIHRoTGlzdC5jbGljaygoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3QgdGggPSAkKGV2ZW50LnRhcmdldCk7XG4gICAgICAgIGxldCBzaWduO1xuICAgICAgICBpZiAodGguaGFzQ2xhc3MoJ3NvcnRlZCcpKVxuICAgICAgICAgICAgc2lnbiA9IHRoLmhhc0NsYXNzKCdkZXNjZW5kaW5nJykgPyAxIDogLTE7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNpZ24gPSB0aC5oYXNDbGFzcygnZGVzYy1maXJzdCcpID8gLTEgOiAxO1xuICAgICAgICBjb25zdCB0aEluZGV4ID0gdGguZGF0YSgndGhJbmRleCcpIGFzIG51bWJlcjtcbiAgICAgICAgY3VycmVudFNvcnRPcmRlci5wdXNoKCh0aEluZGV4ICsgMSkgKiBzaWduKTtcbiAgICAgICAgY3VycmVudFNvcnRPcmRlciA9IHNpbXBsaWZ5U29ydE9yZGVyKGN1cnJlbnRTb3J0T3JkZXIsIG9yZGVyQ29uZmlnKTtcbiAgICAgICAgc2V0VGFibGVIZWFkU29ydGluZ01hcmsoKTtcbiAgICAgICAgb25Tb3J0T3JkZXJDaGFuZ2VkKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIG1haW4oKSB7XG4gICAgUHJvbWlzZS5hbGwoXG4gICAgICAgIChbJ29zdSEuZGInLCAnc2NvcmVzLmRiJ10gYXMgTG9jYWxGaWxlTmFtZVtdKVxuICAgICAgICAgICAgLm1hcChuYW1lID0+XG4gICAgICAgICAgICAgICAgbG9hZEZyb21Mb2NhbFN0b3JhZ2UobmFtZSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gcmVsb2FkTG9jYWxGaWxlKG5hbWUpKSkpLnRoZW4oKCkgPT4ge1xuICAgICAgICBpZiAoaW5pdFVuc29ydGVkVGFibGVSb3dzKCkpXG4gICAgICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XG4gICAgfSk7XG4gICAgc2V0UXVlcnlBY2NvcmRpbmdUb0hhc2goKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsICgpID0+IHtcbiAgICAgICAgc2V0UXVlcnlBY2NvcmRpbmdUb0hhc2goKTtcbiAgICAgICAgZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpO1xuICAgIH0pO1xuICAgIGNvbnN0IG9uQ2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XG4gICAgfTtcbiAgICBmb3IgKGNvbnN0IGlkIG9mIFsnZmlsdGVyLWFwcHJvdmVkLXN0YXR1cycsICdmaWx0ZXItbW9kZScsICdmaWx0ZXItZmMtbGV2ZWwnLCAnZmlsdGVyLWxvY2FsLWRhdGEnLCAnc2hvdy1mdWxsLXJlc3VsdCddKVxuICAgICAgICAkKGAjJHtpZH1gKS5vbignY2hhbmdlJywgb25DaGFuZ2UpO1xuICAgIGZvciAoY29uc3QgaWQgb2YgWydmaWx0ZXItc2VhcmNoLXF1ZXJ5J10pXG4gICAgICAgICQoYCMke2lkfWApLm9uKCdpbnB1dCcsIG9uQ2hhbmdlKTtcbiAgICBpbml0VGFibGUoc29ydEtleXMsIHN1bW1hcnlPcmRlckNvbmZpZywgb25DaGFuZ2UpO1xuXG4gICAgY29uc3QgbG9hZERhdGEgPSAoZGF0YTogU3VtbWFyeVJvd0RhdGFbXSwgbGFzdE1vZGlmaWVkOiBEYXRlKSA9PiB7XG4gICAgICAgICQoJyNsYXN0LXVwZGF0ZS10aW1lJylcbiAgICAgICAgICAgIC5hcHBlbmQoJCgnPHRpbWU+JylcbiAgICAgICAgICAgICAgICAuYXR0cignZGF0ZXRpbWUnLCBsYXN0TW9kaWZpZWQudG9JU09TdHJpbmcoKSlcbiAgICAgICAgICAgICAgICAudGV4dChsYXN0TW9kaWZpZWQudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdKSk7XG4gICAgICAgIHN1bW1hcnlSb3dzID0gZGF0YS5tYXAoeCA9PiBuZXcgU3VtbWFyeVJvdyh4KSk7XG4gICAgICAgIGluaXRVbnNvcnRlZFRhYmxlUm93cygpO1xuICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XG4gICAgICAgICQoJyNzdW1tYXJ5LXRhYmxlLWxvYWRlcicpLmhpZGUoKTtcbiAgICB9O1xuICAgICQuZ2V0SlNPTignZGF0YS9zdW1tYXJ5Lmpzb24nKS50aGVuKChkYXRhLCBfLCB4aHIpID0+IHtcbiAgICAgICAgbG9hZERhdGEoZGF0YSwgbmV3IERhdGUoeGhyLmdldFJlc3BvbnNlSGVhZGVyKCdMYXN0LU1vZGlmaWVkJykgYXMgc3RyaW5nKSk7XG4gICAgfSk7XG4gICAgJCgnI2RiLWZpbGUtaW5wdXQnKS5jaGFuZ2UoYXN5bmMgZXZlbnQgPT4ge1xuICAgICAgICBjb25zdCBlbGVtID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICAgIGlmICghZWxlbS5maWxlcykgcmV0dXJuO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsZW0uZmlsZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBlbGVtLmZpbGVzW2ldO1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGZpbGUubmFtZTtcbiAgICAgICAgICAgIGlmIChuYW1lLmluZGV4T2YoJ29zdSEuZGInKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzZXRMb2NhbEZpbGUoJ29zdSEuZGInLCBmaWxlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmFtZS5pbmRleE9mKCdzY29yZXMuZGInKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzZXRMb2NhbEZpbGUoJ3Njb3Jlcy5kYicsIGZpbGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzaG93RXJyb3JNZXNzYWdlKGBJbnZhbGlkIGZpbGUgJHtuYW1lfTogUGxlYXNlIHNlbGVjdCBvc3UhLmRiIG9yIHNjb3Jlcy5kYmApO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGluaXRVbnNvcnRlZFRhYmxlUm93cygpKVxuICAgICAgICAgICAgICAgIGRyYXdUYWJsZUZvckN1cnJlbnRGaWx0ZXJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBlbGVtLnZhbHVlID0gJyc7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGluaXRVbnNvcnRlZFJhbmtpbmdUYWJsZVJvd3MoKSB7XG4gICAgaWYgKHJhbmtpbmdSb3dzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgdW5zb3J0ZWRUYWJsZVJvd3MgPSByYW5raW5nUm93cy5tYXAocm93ID0+XG4gICAgICAgICQoJzx0cj4nKS5hcHBlbmQoW1xuICAgICAgICAgICAgcm93LnJhbmsudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIHJvdy5wcC50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgJCgnPGE+JykuYXR0cignaHJlZicsIGBodHRwczovL29zdS5wcHkuc2gvdS8ke3Jvdy51c2VyX2lkfWApLnRleHQocm93LnVzZXJuYW1lKSxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAkKCc8YT4nKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cignaHJlZicsIGBodHRwczovL29zdS5wcHkuc2gvYi8ke3Jvdy5iZWF0bWFwX2lkfT9tPTJgKVxuICAgICAgICAgICAgICAgICAgICAudGV4dChyb3cuZGlzcGxheV9zdHJpbmcpLFxuICAgICAgICAgICAgICAgIHJvdy5iZWF0bWFwX2lkX251bWJlciA+IDAgPyAkKCc8ZGl2IGNsYXNzPVwiZmxvYXQtcmlnaHRcIj4nKS5hcHBlbmQoW1xuICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLXBpY3R1cmUtb1wiPicpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignaHJlZicsIGBodHRwczovL2IucHB5LnNoL3RodW1iLyR7cm93LmJlYXRtYXBzZXRfaWR9LmpwZ2ApLFxuICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLWRvd25sb2FkXCI+JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYGh0dHBzOi8vb3N1LnBweS5zaC9kLyR7cm93LmJlYXRtYXBzZXRfaWR9bmApLFxuICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLWNsb3VkLWRvd25sb2FkXCI+JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYG9zdTovL2RsLyR7cm93LmJlYXRtYXBzZXRfaWR9YClcbiAgICAgICAgICAgICAgICBdKSA6ICQoKVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJvdy5tb2RzLFxuICAgICAgICAgICAgcm93LmFjY3VyYWN5LnRvRml4ZWQoMikgKyAnJScsXG4gICAgICAgICAgICByb3cuY29tYm9fZGlzcGxheSxcbiAgICAgICAgICAgIHJvdy5kYXRlX3BsYXllZF9zdHJpbmcsXG4gICAgICAgIF0ubWFwKHggPT4gJCgnPHRkPicpLmFwcGVuZCh4KSkpWzBdIGFzIEhUTUxUYWJsZVJvd0VsZW1lbnQpO1xuXG4gICAgdW5zb3J0ZWRUYWJsZVJvd3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuY29uc3QgcmFua2luZ1NvcnRLZXlzID0gW1xuICAgICh4OiBSYW5raW5nUm93KSA9PiB4LnJhbmssXG4gICAgKHg6IFJhbmtpbmdSb3cpID0+IHgucHAsXG4gICAgKHg6IFJhbmtpbmdSb3cpID0+IHgudXNlcm5hbWVfbG93ZXIsXG4gICAgKHg6IFJhbmtpbmdSb3cpID0+IHguZGlzcGxheV9zdHJpbmdfbG93ZXIsXG4gICAgKHg6IFJhbmtpbmdSb3cpID0+IHgubW9kcyxcbiAgICAoeDogUmFua2luZ1JvdykgPT4geC5hY2N1cmFjeSxcbiAgICAoeDogUmFua2luZ1JvdykgPT4geC5jb21ib19kaXNwbGF5LFxuICAgICh4OiBSYW5raW5nUm93KSA9PiB4LmRhdGVfcGxheWVkX3N0cmluZyxcbl07XG5cbmZ1bmN0aW9uIGRyYXdSYW5raW5nVGFibGUoKSB7XG4gICAgY29uc3QgaW5kaWNlcyA9IHJhbmtpbmdSb3dzLm1hcCgoX3JvdywgaSkgPT4gaSk7XG4gICAgY29uc3QgcHJldkluZGV4ID0gQXJyYXkocmFua2luZ1Jvd3MubGVuZ3RoKTtcbiAgICBmb3IgKGNvbnN0IG9yZCBvZiBjdXJyZW50U29ydE9yZGVyKSB7XG4gICAgICAgIGlmIChvcmQgPT09IDApIGNvbnRpbnVlO1xuICAgICAgICBpbmRpY2VzLmZvckVhY2goKHgsIGkpID0+IHByZXZJbmRleFt4XSA9IGkpO1xuICAgICAgICBjb25zdCBzb3J0S2V5ID0gcmFua2luZ1NvcnRLZXlzW01hdGguYWJzKG9yZCkgLSAxXTtcbiAgICAgICAgY29uc3Qgc2lnbiA9IG9yZCA+IDAgPyAxIDogLTE7XG4gICAgICAgIGluZGljZXMuc29ydCgoeCwgeSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qga3ggPSBzb3J0S2V5KHJhbmtpbmdSb3dzW3hdKTtcbiAgICAgICAgICAgIGNvbnN0IGt5ID0gc29ydEtleShyYW5raW5nUm93c1t5XSk7XG4gICAgICAgICAgICByZXR1cm4ga3ggPCBreSA/IC1zaWduIDoga3ggPiBreSA/IHNpZ24gOiBwcmV2SW5kZXhbeF0gLSBwcmV2SW5kZXhbeV07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBkcmF3VGFibGUoaW5kaWNlcyk7XG59XG5cbmZ1bmN0aW9uIHJhbmtpbmdNYWluKCkge1xuICAgIGluaXRUYWJsZShyYW5raW5nU29ydEtleXMsIHJhbmtpbmdPcmRlckNvbmZpZywgZHJhd1JhbmtpbmdUYWJsZSk7XG4gICAgY29uc3QgbG9hZERhdGEgPSAoZGF0YTogUmFua2luZ1Jvd0RhdGFbXSwgbGFzdE1vZGlmaWVkOiBEYXRlKSA9PiB7XG4gICAgICAgICQoJyNsYXN0LXVwZGF0ZS10aW1lJylcbiAgICAgICAgICAgIC5hcHBlbmQoJCgnPHRpbWU+JylcbiAgICAgICAgICAgICAgICAuYXR0cignZGF0ZXRpbWUnLCBsYXN0TW9kaWZpZWQudG9JU09TdHJpbmcoKSlcbiAgICAgICAgICAgICAgICAudGV4dChsYXN0TW9kaWZpZWQudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdKSk7XG4gICAgICAgIHJhbmtpbmdSb3dzID0gZGF0YS5tYXAoKHgsIGkpID0+IG5ldyBSYW5raW5nUm93KGkgKyAxLCB4KSk7XG4gICAgICAgIGluaXRVbnNvcnRlZFJhbmtpbmdUYWJsZVJvd3MoKTtcbiAgICAgICAgZHJhd1JhbmtpbmdUYWJsZSgpO1xuICAgICAgICAkKCcjc3VtbWFyeS10YWJsZS1sb2FkZXInKS5oaWRlKCk7XG4gICAgfTtcbiAgICAkLmdldEpTT04oJ2RhdGEvcmFua2luZy5qc29uJykudGhlbigoZGF0YSwgXywgeGhyKSA9PiB7XG4gICAgICAgIGxvYWREYXRhKGRhdGEsIG5ldyBEYXRlKHhoci5nZXRSZXNwb25zZUhlYWRlcignTGFzdC1Nb2RpZmllZCcpIGFzIHN0cmluZykpO1xuICAgIH0pO1xufVxuXG5pZiAoL3JhbmtpbmdcXC5odG1sJC9pLnRlc3QobG9jYXRpb24ucGF0aG5hbWUpKSB7XG4gICAgJChyYW5raW5nTWFpbik7XG59IGVsc2Uge1xuICAgICQobWFpbik7XG59XG5cbn1cbiJdfQ==