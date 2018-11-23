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
            row.min_misses !== 0 ? (row.min_misses === 1 ? '1 miss' : row.min_misses + ' misses') :
                [row.fcNM, row.fcHD, row.fcHR, row.fcHDHR, row.fcDT, row.fcHDDT].join(', '),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1tYXBzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpc3QtbWFwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQSxJQUFVLFFBQVEsQ0E0OUJqQjtBQTU5QkQsV0FBVSxRQUFRO0lBZWxCLE1BQU0sWUFBWSxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pDLE1BQU0sVUFBVTtRQXdCWixZQUE2QixJQUFvQjtZQUFwQixTQUFJLEdBQUosSUFBSSxDQUFnQjtZQUM3QztnQkFDSSxJQUFJLENBQUMsZUFBZTtnQkFDcEIsSUFBSSxDQUFDLG9CQUFvQjtnQkFDekIsSUFBSSxDQUFDLElBQUk7Z0JBQ1QsSUFBSSxDQUFDLFVBQVU7Z0JBQ2YsSUFBSSxDQUFDLGFBQWE7Z0JBQ2xCLElBQUksQ0FBQyxjQUFjO2dCQUNuQixJQUFJLENBQUMsS0FBSztnQkFDVixJQUFJLENBQUMsRUFBRTtnQkFDUCxJQUFJLENBQUMsVUFBVTtnQkFDZixJQUFJLENBQUMsU0FBUztnQkFDZCxJQUFJLENBQUMsYUFBYTtnQkFDbEIsSUFBSSxDQUFDLFdBQVc7Z0JBQ2hCLElBQUksQ0FBQyxVQUFVO2dCQUNmLElBQUksQ0FBQyxJQUFJO2dCQUNULElBQUksQ0FBQyxJQUFJO2dCQUNULElBQUksQ0FBQyxJQUFJO2dCQUNULElBQUksQ0FBQyxNQUFNO2dCQUNYLElBQUksQ0FBQyxJQUFJO2dCQUNULElBQUksQ0FBQyxNQUFNO2FBQ2QsR0FBRyxJQUFJLENBQUM7WUFDVCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO1lBQ3RGLElBQUksQ0FBQyxvQkFBb0Is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SUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pELFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNELDRCQUE0QixFQUFFLENBQUM7WUFDL0IsZ0JBQWdCLEVBQUUsQ0FBQztZQUNuQixDQUFDLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN0QyxDQUFDLENBQUM7UUFDRixDQUFDLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUNqRCxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLENBQVcsQ0FBQyxDQUFDLENBQUM7UUFDL0UsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzNDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUNsQjtTQUFNO1FBQ0gsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ1g7QUFFRCxDQUFDLEVBNTlCUyxRQUFRLEtBQVIsUUFBUSxRQTQ5QmpCIiwic291cmNlc0NvbnRlbnQiOlsiXG5uYW1lc3BhY2UgTGlzdE1hcHMge1xuXG5pbnRlcmZhY2UgSlF1ZXJ5IHtcbiAgICB0YWJsZXNvcnQoKTogdm9pZDtcbiAgICBkYXRhKGtleTogJ3NvcnRCeScsIGtleUZ1bmM6IChcbiAgICAgICAgdGg6IEhUTUxUYWJsZUhlYWRlckNlbGxFbGVtZW50LFxuICAgICAgICB0ZDogSFRNTFRhYmxlRGF0YUNlbGxFbGVtZW50LFxuICAgICAgICB0YWJsZXNvcnQ6IGFueSkgPT4gdm9pZCk6IHRoaXM7XG59XG5cbnR5cGUgU3VtbWFyeVJvd0RhdGEgPVxuW1xuICAgIG51bWJlciwgc3RyaW5nLCBudW1iZXIsIHN0cmluZywgc3RyaW5nLCBzdHJpbmcsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsXG4gICAgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXJcbl07XG5jb25zdCBNSU5JTVVNX0RBVEUgPSBuZXcgRGF0ZSgwKTtcbmNsYXNzIFN1bW1hcnlSb3cge1xuICAgIGFwcHJvdmVkX3N0YXR1czogbnVtYmVyO1xuICAgIGFwcHJvdmVkX2RhdGVfc3RyaW5nOiBzdHJpbmc7XG4gICAgYXBwcm92ZWRfZGF0ZTogRGF0ZTtcbiAgICBtb2RlOiBudW1iZXI7XG4gICAgYmVhdG1hcF9pZDogc3RyaW5nO1xuICAgIGJlYXRtYXBfaWRfbnVtYmVyOiBudW1iZXI7XG4gICAgYmVhdG1hcHNldF9pZDogc3RyaW5nO1xuICAgIGRpc3BsYXlfc3RyaW5nOiBzdHJpbmc7XG4gICAgZGlzcGxheV9zdHJpbmdfbG93ZXI6IHN0cmluZztcbiAgICBzdGFyczogbnVtYmVyO1xuICAgIHBwOiBudW1iZXI7XG4gICAgaGl0X2xlbmd0aDogbnVtYmVyO1xuICAgIG1heF9jb21ibzogbnVtYmVyO1xuICAgIGFwcHJvYWNoX3JhdGU6IG51bWJlcjtcbiAgICBjaXJjbGVfc2l6ZTogbnVtYmVyO1xuICAgIG1pbl9taXNzZXM6IG51bWJlcjtcbiAgICBmY05NOiBudW1iZXI7XG4gICAgZmNIRDogbnVtYmVyO1xuICAgIGZjSFI6IG51bWJlcjtcbiAgICBmY0hESFI6IG51bWJlcjtcbiAgICBmY0RUOiBudW1iZXI7XG4gICAgZmNIRERUOiBudW1iZXI7XG4gICAgaW5mbzogQmVhdG1hcEluZm8gfCBudWxsO1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgZGF0YTogU3VtbWFyeVJvd0RhdGEpIHtcbiAgICAgICAgW1xuICAgICAgICAgICAgdGhpcy5hcHByb3ZlZF9zdGF0dXMsXG4gICAgICAgICAgICB0aGlzLmFwcHJvdmVkX2RhdGVfc3RyaW5nLFxuICAgICAgICAgICAgdGhpcy5tb2RlLFxuICAgICAgICAgICAgdGhpcy5iZWF0bWFwX2lkLFxuICAgICAgICAgICAgdGhpcy5iZWF0bWFwc2V0X2lkLFxuICAgICAgICAgICAgdGhpcy5kaXNwbGF5X3N0cmluZyxcbiAgICAgICAgICAgIHRoaXMuc3RhcnMsXG4gICAgICAgICAgICB0aGlzLnBwLFxuICAgICAgICAgICAgdGhpcy5oaXRfbGVuZ3RoLFxuICAgICAgICAgICAgdGhpcy5tYXhfY29tYm8sXG4gICAgICAgICAgICB0aGlzLmFwcHJvYWNoX3JhdGUsXG4gICAgICAgICAgICB0aGlzLmNpcmNsZV9zaXplLFxuICAgICAgICAgICAgdGhpcy5taW5fbWlzc2VzLFxuICAgICAgICAgICAgdGhpcy5mY05NLFxuICAgICAgICAgICAgdGhpcy5mY0hELFxuICAgICAgICAgICAgdGhpcy5mY0hSLFxuICAgICAgICAgICAgdGhpcy5mY0hESFIsXG4gICAgICAgICAgICB0aGlzLmZjRFQsXG4gICAgICAgICAgICB0aGlzLmZjSEREVCxcbiAgICAgICAgXSA9IGRhdGE7XG4gICAgICAgIHRoaXMuYmVhdG1hcF9pZF9udW1iZXIgPSBwYXJzZUludCh0aGlzLmJlYXRtYXBfaWQpO1xuICAgICAgICB0aGlzLmFwcHJvdmVkX2RhdGUgPSBuZXcgRGF0ZSh0aGlzLmFwcHJvdmVkX2RhdGVfc3RyaW5nLnJlcGxhY2UoJyAnLCAnVCcpICsgJyswODowMCcpO1xuICAgICAgICB0aGlzLmRpc3BsYXlfc3RyaW5nX2xvd2VyID0gdGhpcy5kaXNwbGF5X3N0cmluZy50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB0aGlzLmluZm8gPSBudWxsO1xuICAgIH1cbn1cblxudHlwZSBSYW5raW5nUm93RGF0YSA9XG5bXG4gICAgbnVtYmVyLCBudW1iZXIsIHN0cmluZywgc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgc3RyaW5nLCBzdHJpbmcsIG51bWJlciwgc3RyaW5nLCBzdHJpbmdcbl07XG5jbGFzcyBSYW5raW5nUm93IHtcbiAgICBzdGFyczogbnVtYmVyO1xuICAgIHBwOiBudW1iZXI7XG4gICAgdXNlcl9pZDogc3RyaW5nO1xuICAgIHVzZXJuYW1lOiBzdHJpbmc7XG4gICAgdXNlcm5hbWVfbG93ZXI6IHN0cmluZztcbiAgICBiZWF0bWFwX2lkOiBzdHJpbmc7XG4gICAgYmVhdG1hcF9pZF9udW1iZXI6IG51bWJlcjtcbiAgICBiZWF0bWFwc2V0X2lkOiBzdHJpbmc7XG4gICAgZGlzcGxheV9zdHJpbmc6IHN0cmluZztcbiAgICBkaXNwbGF5X3N0cmluZ19sb3dlcjogc3RyaW5nO1xuICAgIG1vZHM6IHN0cmluZztcbiAgICBhY2N1cmFjeTogbnVtYmVyO1xuICAgIGNvbWJvX2Rpc3BsYXk6IHN0cmluZztcbiAgICBkYXRlX3BsYXllZF9zdHJpbmc6IHN0cmluZztcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgcmFuazogbnVtYmVyLCBwcml2YXRlIHJlYWRvbmx5IGRhdGE6IFJhbmtpbmdSb3dEYXRhKSB7XG4gICAgICAgIFtcbiAgICAgICAgICAgIHRoaXMuc3RhcnMsXG4gICAgICAgICAgICB0aGlzLnBwLFxuICAgICAgICAgICAgdGhpcy51c2VyX2lkLFxuICAgICAgICAgICAgdGhpcy51c2VybmFtZSxcbiAgICAgICAgICAgIHRoaXMuYmVhdG1hcF9pZCxcbiAgICAgICAgICAgIHRoaXMuYmVhdG1hcHNldF9pZCxcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheV9zdHJpbmcsXG4gICAgICAgICAgICB0aGlzLm1vZHMsXG4gICAgICAgICAgICB0aGlzLmFjY3VyYWN5LFxuICAgICAgICAgICAgdGhpcy5jb21ib19kaXNwbGF5LFxuICAgICAgICAgICAgdGhpcy5kYXRlX3BsYXllZF9zdHJpbmdcbiAgICAgICAgXSA9IGRhdGE7XG4gICAgICAgIHRoaXMuYmVhdG1hcF9pZF9udW1iZXIgPSBwYXJzZUludCh0aGlzLmJlYXRtYXBfaWQpO1xuICAgICAgICB0aGlzLnVzZXJuYW1lX2xvd2VyID0gdGhpcy51c2VybmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB0aGlzLmRpc3BsYXlfc3RyaW5nX2xvd2VyID0gdGhpcy5kaXNwbGF5X3N0cmluZy50b0xvd2VyQ2FzZSgpO1xuICAgIH1cbn1cblxuXG5sZXQgc3VtbWFyeVJvd3M6IFN1bW1hcnlSb3dbXSA9IFtdO1xubGV0IHJhbmtpbmdSb3dzOiBSYW5raW5nUm93W10gPSBbXTtcbmxldCB1bnNvcnRlZFRhYmxlUm93czogSFRNTFRhYmxlUm93RWxlbWVudFtdID0gW107XG5sZXQgY3VycmVudFNvcnRPcmRlcjogbnVtYmVyW10gPSBbXTtcbmxldCBjdXJyZW50SGFzaExpbmsgPSAnIyc7XG5cbmxldCBwcmV2aW91c0luZGljZXMgPSAnJztcbmxldCB1bnNvcnRlZFRhYmxlUm93c0NoYW5nZWQgPSBmYWxzZTtcbmZ1bmN0aW9uIGRyYXdUYWJsZShpbmRpY2VzOiBudW1iZXJbXSkge1xuICAgIGNvbnN0IHN0ciA9IGluZGljZXMuam9pbignLCcpO1xuICAgIGlmICghdW5zb3J0ZWRUYWJsZVJvd3NDaGFuZ2VkICYmIHByZXZpb3VzSW5kaWNlcyA9PT0gc3RyKSByZXR1cm47XG4gICAgdW5zb3J0ZWRUYWJsZVJvd3NDaGFuZ2VkID0gZmFsc2U7XG4gICAgcHJldmlvdXNJbmRpY2VzID0gc3RyO1xuICAgICQoJyNzdW1tYXJ5LXRhYmxlID4gdGJvZHknKVxuICAgICAgICAuZW1wdHkoKVxuICAgICAgICAuYXBwZW5kKGluZGljZXMubWFwKGluZGV4ID0+IHVuc29ydGVkVGFibGVSb3dzW2luZGV4XSkpO1xufVxuXG5jbGFzcyBTZWFyY2hRdWVyeSB7XG4gICAgcHVibGljIHJlYWRvbmx5IGNoZWNrOiAocm93OiBTdW1tYXJ5Um93KSA9PiBib29sZWFuO1xuICAgIHB1YmxpYyByZWFkb25seSBub3JtYWxpemVkX3NvdXJjZTogc3RyaW5nO1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBzb3VyY2U6IHN0cmluZykge1xuICAgICAgICBjb25zdCBrZXlfdG9fcHJvcGVydHlfbmFtZSA9IHtcbiAgICAgICAgICAgICdzdGF0dXMnOiAnXCJwcHByYXFsXCJbcm93LmFwcHJvdmVkX3N0YXR1cysyXScsXG4gICAgICAgICAgICAnbW9kZSc6ICdcIm90Y21cIltyb3cubW9kZV0nLFxuICAgICAgICAgICAgJ3N0YXJzJzogJ3Jvdy5zdGFycycsXG4gICAgICAgICAgICAncHAnOiAncm93LnBwJyxcbiAgICAgICAgICAgICdsZW5ndGgnOiAncm93LmhpdF9sZW5ndGgnLFxuICAgICAgICAgICAgJ2NvbWJvJzogJ3Jvdy5tYXhfY29tYm8nLFxuICAgICAgICAgICAgJ2FyJzogJ3Jvdy5hcHByb2FjaF9yYXRlJyxcbiAgICAgICAgICAgICdjcyc6ICdyb3cuY2lyY2xlX3NpemUnLFxuICAgICAgICAgICAgJ3BsYXllZCc6IGAoIXJvdy5pbmZvP0luZmluaXR5Oigke25ldyBEYXRlKCkudmFsdWVPZigpfS1yb3cuaW5mby5sYXN0UGxheWVkLnZhbHVlT2YoKSkvJHsxZTMgKiA2MCAqIDYwICogMjR9KWAsXG4gICAgICAgICAgICAndW5wbGF5ZWQnOiBgKHJvdy5pbmZvJiZyb3cuaW5mby5sYXN0UGxheWVkLnZhbHVlT2YoKSE9PSR7TUlOSU1VTV9EQVRFLnZhbHVlT2YoKX0/J3knOicnKWAsXG4gICAgICAgICAgICAnZGF0ZSc6IGAoJHtuZXcgRGF0ZSgpLnZhbHVlT2YoKX0tcm93LmFwcHJvdmVkX2RhdGUudmFsdWVPZigpKS8kezFlMyAqIDYwICogNjAgKiAyNH1gLFxuICAgICAgICAgICAgJ3JhbmsnOiBgKCR7SlNPTi5zdHJpbmdpZnkocmFua0FjaGlldmVkQ2xhc3MpfVshcm93LmluZm8/OTpyb3cuaW5mby5yYW5rQWNoaWV2ZWRdKS50b0xvd2VyQ2FzZSgpYFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCByZWdleHAgPSBuZXcgUmVnRXhwKGAoJHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGtleV90b19wcm9wZXJ0eV9uYW1lKS5qb2luKCd8JylcbiAgICAgICAgfSkoPD0/fD49P3w9fCE9KShbLVxcXFx3XFxcXC5dKilgKTtcbiAgICAgICAgbGV0IGNoZWNrX2Z1bmNfc291cmNlID0gJ3JldHVybiB0cnVlJztcbiAgICAgICAgdGhpcy5ub3JtYWxpemVkX3NvdXJjZSA9ICcnO1xuICAgICAgICBmb3IgKGNvbnN0IHRva2VuIG9mIHNvdXJjZS5zcGxpdCgnICcpKSB7XG4gICAgICAgICAgICBjb25zdCB0cmltbWVkID0gdG9rZW4udHJpbSgpO1xuICAgICAgICAgICAgaWYgKHRyaW1tZWQgPT09ICcnKSBjb250aW51ZTtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gcmVnZXhwLmV4ZWModHJpbW1lZCk7XG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSBtYXRjaFsxXTtcbiAgICAgICAgICAgICAgICBjb25zdCByZWwgPSBtYXRjaFsyXSA9PT0gJz0nID8gJz09JyA6IG1hdGNoWzJdO1xuICAgICAgICAgICAgICAgIGxldCB2YWw6IG51bWJlciB8IHN0cmluZyA9IHBhcnNlRmxvYXQobWF0Y2hbM10pO1xuICAgICAgICAgICAgICAgIGlmIChpc05hTih2YWwpKVxuICAgICAgICAgICAgICAgICAgICB2YWwgPSBtYXRjaFszXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3AgPSAoa2V5X3RvX3Byb3BlcnR5X25hbWUgYXMgYW55KVtrZXldO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5vcm1hbGl6ZWRfc291cmNlICE9PSAnJykgdGhpcy5ub3JtYWxpemVkX3NvdXJjZSArPSAnICc7XG4gICAgICAgICAgICAgICAgdGhpcy5ub3JtYWxpemVkX3NvdXJjZSArPSBtYXRjaFsxXSArIG1hdGNoWzJdICsgbWF0Y2hbM107XG4gICAgICAgICAgICAgICAgY2hlY2tfZnVuY19zb3VyY2UgKz0gYCYmJHtwcm9wfSR7cmVsfSR7SlNPTi5zdHJpbmdpZnkodmFsKX1gO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdHIgPSB0cmltbWVkLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXNjYXBlZCA9IEpTT04uc3RyaW5naWZ5KHN0cik7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubm9ybWFsaXplZF9zb3VyY2UgIT09ICcnKSB0aGlzLm5vcm1hbGl6ZWRfc291cmNlICs9ICcgJztcbiAgICAgICAgICAgICAgICB0aGlzLm5vcm1hbGl6ZWRfc291cmNlICs9IHN0cjtcbiAgICAgICAgICAgICAgICBjaGVja19mdW5jX3NvdXJjZSArPSBgJiZyb3cuZGlzcGxheV9zdHJpbmdfbG93ZXIuaW5kZXhPZigke2VzY2FwZWR9KSE9PS0xYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNoZWNrID0gbmV3IEZ1bmN0aW9uKCdyb3cnLCBjaGVja19mdW5jX3NvdXJjZSkgYXMgYW55O1xuICAgIH1cbn1cblxuY29uc3Qgc29ydEtleXMgPSBbXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHguYXBwcm92ZWRfZGF0ZV9zdHJpbmcsXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHguZGlzcGxheV9zdHJpbmdfbG93ZXIsXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHguc3RhcnMsXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHgucHAsXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHguaGl0X2xlbmd0aCxcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5tYXhfY29tYm8sXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHguYXBwcm9hY2hfcmF0ZSxcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5jaXJjbGVfc2l6ZSxcbiAgICAoeDogU3VtbWFyeVJvdykgPT5cbiAgICAgICAgeC5mY0hERFQgKiAyICsgeC5mY0RUICogMWU4ICtcbiAgICAgICAgeC5mY0hESFIgKiAyICsgeC5mY0hSICogMWU0ICtcbiAgICAgICAgeC5mY0hEICogMiArIHguZmNOTSAtXG4gICAgICAgIHgubWluX21pc3NlcyxcbiAgICAoeDogU3VtbWFyeVJvdykgPT4gIXguaW5mbyA/IE1JTklNVU1fREFURS52YWx1ZU9mKCkgOiB4LmluZm8ubGFzdFBsYXllZC52YWx1ZU9mKClcbl07XG5cbmZ1bmN0aW9uIHN0cmluZ2lmeU9iamVjdChvYmo6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nOyB9KTogc3RyaW5nIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKVxuICAgICAgICAubWFwKGsgPT4gayArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChvYmpba10pKVxuICAgICAgICAuam9pbignJicpO1xufVxuXG5mdW5jdGlvbiBwYXJzZU9iamVjdChzdHI6IHN0cmluZykge1xuICAgIGNvbnN0IHJlcyA9IHt9O1xuICAgIHN0ci5zcGxpdCgnJicpLmZvckVhY2gocGFydCA9PiB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gcGFydC5tYXRjaCgvKFxcdyspPSguKykvKTtcbiAgICAgICAgaWYgKG1hdGNoKVxuICAgICAgICAgICAgKHJlcyBhcyBhbnkpW21hdGNoWzFdXSA9IGRlY29kZVVSSUNvbXBvbmVudChtYXRjaFsyXSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpIHtcbiAgICBjb25zdCBmaWx0ZXJfYXBwcm92ZWRfc3RhdHVzID0gcGFyc2VJbnQoJCgnI2ZpbHRlci1hcHByb3ZlZC1zdGF0dXMnKS52YWwoKSBhcyBzdHJpbmcpO1xuICAgIGNvbnN0IGZpbHRlcl9tb2RlID0gcGFyc2VJbnQoJCgnI2ZpbHRlci1tb2RlJykudmFsKCkgYXMgc3RyaW5nKTtcbiAgICBjb25zdCBmaWx0ZXJfc2VhcmNoX3F1ZXJ5ID0gbmV3IFNlYXJjaFF1ZXJ5KCgkKCcjZmlsdGVyLXNlYXJjaC1xdWVyeScpLnZhbCgpIGFzIHN0cmluZykpO1xuICAgIGNvbnN0IGZpbHRlcl9mY19sZXZlbCA9IHBhcnNlSW50KCQoJyNmaWx0ZXItZmMtbGV2ZWwnKS52YWwoKSBhcyBzdHJpbmcpO1xuICAgIGNvbnN0IGZpbHRlcl9sb2NhbF9kYXRhID0gcGFyc2VJbnQoJCgnI2ZpbHRlci1sb2NhbC1kYXRhJykudmFsKCkgYXMgc3RyaW5nKTtcbiAgICBjb25zdCBzaG93X2Z1bGxfcmVzdWx0ID0gJCgnI3Nob3ctZnVsbC1yZXN1bHQnKS5wcm9wKCdjaGVja2VkJyk7XG5cbiAgICBjb25zdCBnZXRfZmNfbGV2ZWwgPSAocm93OiBTdW1tYXJ5Um93KSA9PiB7XG4gICAgICAgIGlmIChyb3cubWluX21pc3NlcyAhPT0gMCkgcmV0dXJuIDE7XG4gICAgICAgIGlmIChyb3cuZmNEVCAhPT0gMCB8fCByb3cuZmNIRERUICE9PSAwKSByZXR1cm4gODtcbiAgICAgICAgaWYgKHJvdy5mY05NID09PSAwICYmIHJvdy5mY0hEID09PSAwICYmIHJvdy5mY0hSID09PSAwICYmIHJvdy5mY0hESFIgPT09IDApIHJldHVybiAyO1xuICAgICAgICBpZiAocm93LmZjTk0gPT09IDAgJiYgcm93LmZjSEQgPT09IDApIHJldHVybiAzO1xuICAgICAgICBpZiAocm93LmZjSEQgPT09IDApIHJldHVybiA0O1xuICAgICAgICBpZiAocm93LmZjSFIgPT09IDAgJiYgcm93LmZjSERIUiA9PT0gMCkgcmV0dXJuIDU7XG4gICAgICAgIGlmIChyb3cuZmNIREhSID09PSAwKSByZXR1cm4gNjtcbiAgICAgICAgcmV0dXJuIDc7XG4gICAgfTtcblxuICAgIGNvbnN0IGdldF9sb2NhbF9kYXRhX2ZsYWdzID0gKHJvdzogU3VtbWFyeVJvdyk6IG51bWJlciA9PiB7XG4gICAgICAgIGlmIChiZWF0bWFwSW5mb01hcC5zaXplID09PSAwKSByZXR1cm4gLTE7XG4gICAgICAgIGxldCBmbGFncyA9IDA7XG4gICAgICAgIGNvbnN0IGluZm8gPSBiZWF0bWFwSW5mb01hcC5nZXQocm93LmJlYXRtYXBfaWRfbnVtYmVyKTtcbiAgICAgICAgaWYgKCFpbmZvKSByZXR1cm4gMDtcbiAgICAgICAgZmxhZ3MgfD0gMjtcbiAgICAgICAgaWYgKGluZm8ubGFzdFBsYXllZC52YWx1ZU9mKCkgIT09IE1JTklNVU1fREFURS52YWx1ZU9mKCkpXG4gICAgICAgICAgICBmbGFncyB8PSAxO1xuICAgICAgICByZXR1cm4gZmxhZ3M7XG4gICAgfTtcblxuICAgIGN1cnJlbnRIYXNoTGluayA9ICcjJztcbiAgICBjb25zdCBvYmogPSB7fSBhcyB7IFtrZXk6IHN0cmluZ106IHN0cmluZzsgfTtcbiAgICBpZiAoZmlsdGVyX2FwcHJvdmVkX3N0YXR1cyAhPT0gMSlcbiAgICAgICAgb2JqLnMgPSBmaWx0ZXJfYXBwcm92ZWRfc3RhdHVzLnRvU3RyaW5nKCk7XG4gICAgaWYgKGZpbHRlcl9tb2RlICE9PSAzKVxuICAgICAgICBvYmoubSA9IGZpbHRlcl9tb2RlLnRvU3RyaW5nKCk7XG4gICAgaWYgKGZpbHRlcl9zZWFyY2hfcXVlcnkubm9ybWFsaXplZF9zb3VyY2UgIT09ICcnKVxuICAgICAgICBvYmoucSA9IGZpbHRlcl9zZWFyY2hfcXVlcnkubm9ybWFsaXplZF9zb3VyY2U7XG4gICAgaWYgKGZpbHRlcl9mY19sZXZlbCAhPT0gMClcbiAgICAgICAgb2JqLmwgPSBmaWx0ZXJfZmNfbGV2ZWwudG9TdHJpbmcoKTtcbiAgICBpZiAoZmlsdGVyX2xvY2FsX2RhdGEgIT09IDApXG4gICAgICAgIG9iai5kID0gZmlsdGVyX2xvY2FsX2RhdGEudG9TdHJpbmcoKTtcbiAgICBpZiAoY3VycmVudFNvcnRPcmRlci5sZW5ndGggIT09IDApXG4gICAgICAgIG9iai5vID0gY3VycmVudFNvcnRPcmRlci5qb2luKCcuJyk7XG4gICAgaWYgKHNob3dfZnVsbF9yZXN1bHQpXG4gICAgICAgIG9iai5mID0gJzEnO1xuXG4gICAgY3VycmVudEhhc2hMaW5rICs9IHN0cmluZ2lmeU9iamVjdChvYmopO1xuICAgIGhpc3RvcnkucmVwbGFjZVN0YXRlKHt9LCBkb2N1bWVudC50aXRsZSwgbG9jYXRpb24ucGF0aG5hbWUgKyAoY3VycmVudEhhc2hMaW5rID09PSAnIycgPyAnJyA6IGN1cnJlbnRIYXNoTGluaykpO1xuXG4gICAgY29uc3QgaW5kaWNlcyA9IHN1bW1hcnlSb3dzLm1hcCgoXywgaW5kZXgpID0+IGluZGV4KS5maWx0ZXIoaW5kZXggPT4ge1xuICAgICAgICBjb25zdCByb3cgPSBzdW1tYXJ5Um93c1tpbmRleF07XG5cbiAgICAgICAgaWYgKGZpbHRlcl9hcHByb3ZlZF9zdGF0dXMgPT09IDEgJiZcbiAgICAgICAgICAgIChyb3cuYXBwcm92ZWRfc3RhdHVzICE9PSAxICYmIHJvdy5hcHByb3ZlZF9zdGF0dXMgIT09IDIpKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoZmlsdGVyX2FwcHJvdmVkX3N0YXR1cyA9PT0gMiAmJiByb3cuYXBwcm92ZWRfc3RhdHVzICE9PSA0KVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIGlmIChmaWx0ZXJfbW9kZSA9PT0gMSAmJiByb3cubW9kZSAhPT0gMClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKGZpbHRlcl9tb2RlID09PSAyICYmIHJvdy5tb2RlICE9PSAyKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIGlmICghZmlsdGVyX3NlYXJjaF9xdWVyeS5jaGVjayhyb3cpKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIGlmIChmaWx0ZXJfZmNfbGV2ZWwgIT09IDAgJiYgZ2V0X2ZjX2xldmVsKHJvdykgIT09IGZpbHRlcl9mY19sZXZlbClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICBpZiAoZmlsdGVyX2xvY2FsX2RhdGEgIT09IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGZsYWdzID0gZ2V0X2xvY2FsX2RhdGFfZmxhZ3Mocm93KTtcbiAgICAgICAgICAgIHN3aXRjaCAoZmlsdGVyX2xvY2FsX2RhdGEpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDE6IGlmICgoZmxhZ3MgJiAxKSAhPT0gMCkgcmV0dXJuIGZhbHNlOyBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDI6IGlmICgoZmxhZ3MgJiAxKSA9PT0gMCkgcmV0dXJuIGZhbHNlOyBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDM6IGlmICgoZmxhZ3MgJiAyKSAhPT0gMCkgcmV0dXJuIGZhbHNlOyBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDQ6IGlmICgoZmxhZ3MgJiAyKSA9PT0gMCkgcmV0dXJuIGZhbHNlOyBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDU6IGlmICgoZmxhZ3MgJiAzKSAhPT0gMikgcmV0dXJuIGZhbHNlOyBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuXG4gICAgY29uc3QgcHJldkluZGV4ID0gQXJyYXkoc3VtbWFyeVJvd3MubGVuZ3RoKTtcbiAgICBmb3IgKGNvbnN0IG9yZCBvZiBjdXJyZW50U29ydE9yZGVyKSB7XG4gICAgICAgIGlmIChvcmQgPT09IDApIGNvbnRpbnVlO1xuICAgICAgICBpbmRpY2VzLmZvckVhY2goKHgsIGkpID0+IHByZXZJbmRleFt4XSA9IGkpO1xuICAgICAgICBjb25zdCBzb3J0S2V5ID0gc29ydEtleXNbTWF0aC5hYnMob3JkKSAtIDFdO1xuICAgICAgICBjb25zdCBzaWduID0gb3JkID4gMCA/IDEgOiAtMTtcbiAgICAgICAgaW5kaWNlcy5zb3J0KCh4LCB5KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBreCA9IHNvcnRLZXkoc3VtbWFyeVJvd3NbeF0pO1xuICAgICAgICAgICAgY29uc3Qga3kgPSBzb3J0S2V5KHN1bW1hcnlSb3dzW3ldKTtcbiAgICAgICAgICAgIHJldHVybiBreCA8IGt5ID8gLXNpZ24gOiBreCA+IGt5ID8gc2lnbiA6IHByZXZJbmRleFt4XSAtIHByZXZJbmRleFt5XTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgJCgnI251bS1yZXN1bHRzJykudGV4dChpbmRpY2VzLmxlbmd0aCA9PT0gMSA/ICcxIG1hcCcgOiBpbmRpY2VzLmxlbmd0aC50b1N0cmluZygpICsgJyBtYXBzJyk7XG4gICAgY29uc3QgdHJ1bmNhdGVfbnVtID0gc2hvd19mdWxsX3Jlc3VsdCA/IEluZmluaXR5IDogMTAwO1xuICAgIGlmIChpbmRpY2VzLmxlbmd0aCA+IHRydW5jYXRlX251bSlcbiAgICAgICAgaW5kaWNlcy5sZW5ndGggPSB0cnVuY2F0ZV9udW07XG5cbiAgICAkKCcjaGFzaC1saW5rLXRvLXRoZS1jdXJyZW50LXRhYmxlJykuYXR0cignaHJlZicsIGN1cnJlbnRIYXNoTGluayk7XG5cbiAgICBkcmF3VGFibGUoaW5kaWNlcyk7XG59XG5cbmZ1bmN0aW9uIHNpbXBsaWZ5U29ydE9yZGVyKG9yZGVyOiBudW1iZXJbXSwgW25vVGllcywgZGVmYXVsdE9yZGVyXTogW251bWJlcltdLCBudW1iZXJdKTogbnVtYmVyW10ge1xuICAgIGNvbnN0IHJlcyA9IFtdO1xuICAgIGNvbnN0IHNlZW4gPSBBcnJheShzb3J0S2V5cy5sZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSBvcmRlci5sZW5ndGggLSAxOyBpID49IDA7IC0tIGkpIHtcbiAgICAgICAgY29uc3QgeCA9IG9yZGVyW2ldO1xuICAgICAgICBpZiAoeCA9PT0gMCkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGtleSA9IE1hdGguYWJzKHgpIC0gMSwgc2lnbiA9IHggPiAwID8gMSA6IC0xO1xuICAgICAgICBpZiAoc2VlbltrZXldKSBjb250aW51ZTtcbiAgICAgICAgc2VlbltrZXldID0gc2lnbjtcbiAgICAgICAgcmVzLnB1c2goeCk7XG4gICAgICAgIGlmIChub1RpZXMuaW5kZXhPZihrZXkpICE9PSAtMSkgLy8gdGhlcmUgaXMgYWxtb3N0IG5vIHRpZXNcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAocmVzLmxlbmd0aCAhPT0gMCAmJiByZXNbcmVzLmxlbmd0aCAtIDFdID09PSBkZWZhdWx0T3JkZXIpXG4gICAgICAgIHJlcy5wb3AoKTtcbiAgICByZXMucmV2ZXJzZSgpO1xuICAgIHJldHVybiByZXM7XG59XG5cbmNvbnN0IHN1bW1hcnlPcmRlckNvbmZpZzogW251bWJlcltdLCBudW1iZXJdID0gW1swLCAxLCAyLCAzLCA0LCA1LCA5XSwgLTNdO1xuY29uc3QgcmFua2luZ09yZGVyQ29uZmlnOiBbbnVtYmVyW10sIG51bWJlcl0gPSBbWzAsIDEsIDddLCAxXTtcbmZ1bmN0aW9uIHNldFF1ZXJ5QWNjb3JkaW5nVG9IYXNoKCkge1xuICAgIGxldCBvYmo6IHsgW2s6IHN0cmluZ106IHN0cmluZzsgfTtcbiAgICB0cnkge1xuICAgICAgICBvYmogPSBwYXJzZU9iamVjdChsb2NhdGlvbi5oYXNoLnN1YnN0cigxKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBvYmogPSB7fTtcbiAgICB9XG4gICAgaWYgKG9iai5zID09PSB1bmRlZmluZWQpIG9iai5zID0gJzEnO1xuICAgIGlmIChvYmoubSA9PT0gdW5kZWZpbmVkKSBvYmoubSA9ICczJztcbiAgICBpZiAob2JqLnEgPT09IHVuZGVmaW5lZCkgb2JqLnEgPSAnJztcbiAgICBpZiAob2JqLmwgPT09IHVuZGVmaW5lZCkgb2JqLmwgPSAnMCc7XG4gICAgaWYgKG9iai5vID09PSB1bmRlZmluZWQpIG9iai5vID0gJyc7XG4gICAgaWYgKG9iai5mID09PSB1bmRlZmluZWQpIG9iai5mID0gJzAnO1xuICAgIGlmIChvYmouZCA9PT0gdW5kZWZpbmVkKSBvYmouZCA9ICcwJztcbiAgICAkKCcjZmlsdGVyLWFwcHJvdmVkLXN0YXR1cycpLnZhbChwYXJzZUludChvYmoucykpO1xuICAgICQoJyNmaWx0ZXItbW9kZScpLnZhbChwYXJzZUludChvYmoubSkpO1xuICAgICQoJyNmaWx0ZXItc2VhcmNoLXF1ZXJ5JykudmFsKG9iai5xKTtcbiAgICAkKCcjZmlsdGVyLWZjLWxldmVsJykudmFsKHBhcnNlSW50KG9iai5sKSk7XG4gICAgJCgnI2ZpbHRlci1sb2NhbC1kYXRhJykudmFsKHBhcnNlSW50KG9iai5kKSk7XG4gICAgJCgnI3Nob3ctZnVsbC1yZXN1bHQnKS5wcm9wKCdjaGVja2VkJywgISFwYXJzZUludChvYmouZikpO1xuICAgIGN1cnJlbnRTb3J0T3JkZXIgPSBzaW1wbGlmeVNvcnRPcmRlcihvYmouby5zcGxpdCgnLicpLm1hcCh4ID0+IHBhcnNlSW50KHgpIHx8IDApLCBzdW1tYXJ5T3JkZXJDb25maWcpO1xuICAgIHNldFRhYmxlSGVhZFNvcnRpbmdNYXJrKCk7XG59XG5cbmZ1bmN0aW9uIHNldFRhYmxlSGVhZFNvcnRpbmdNYXJrKCkge1xuICAgICQoJy5zb3J0ZWQnKS5yZW1vdmVDbGFzcygnc29ydGVkIGFzY2VuZGluZyBkZXNjZW5kaW5nJyk7XG4gICAgY29uc3QgeCA9IGN1cnJlbnRTb3J0T3JkZXIubGVuZ3RoID09PSAwID9cbiAgICAgICAgLTMgOiAvLyBzdGFycyBkZXNjXG4gICAgICAgIGN1cnJlbnRTb3J0T3JkZXJbY3VycmVudFNvcnRPcmRlci5sZW5ndGggLSAxXTtcbiAgICBjb25zdCBpbmRleCA9IE1hdGguYWJzKHgpIC0gMTtcbiAgICAkKCQoJyNzdW1tYXJ5LXRhYmxlID4gdGhlYWQgPiB0ciA+IHRoJylbaW5kZXhdKVxuICAgICAgICAuYWRkQ2xhc3MoJ3NvcnRlZCcpLmFkZENsYXNzKHggPiAwID8gJ2FzY2VuZGluZycgOiAnZGVzY2VuZGluZycpO1xufVxuXG5mdW5jdGlvbiBwYWQoeDogbnVtYmVyKSB7XG4gICAgcmV0dXJuICh4IDwgMTAgPyAnMCcgOiAnJykgKyB4O1xufVxuXG5mdW5jdGlvbiBmb3JtYXREYXRlKGRhdGU6IERhdGUpIHtcbiAgICByZXR1cm4gZGF0ZS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF0gK1xuICAgICAgICAnICcgKyBwYWQoZGF0ZS5nZXRIb3VycygpKSArXG4gICAgICAgICc6JyArIHBhZChkYXRlLmdldE1pbnV0ZXMoKSk7XG59XG5cbmNvbnN0IHJhbmtBY2hpZXZlZENsYXNzID0gW1xuICAgICdTU0gnLCAnU0gnLCAnU1MnLCAnUycsICdBJyxcbiAgICAnQicsICdDJywgJ0QnLCAnRicsICctJ1xuXTtcblxubGV0IGJlYXRtYXBJbmZvTWFwVXNlZFZlcnNpb24gPSBNSU5JTVVNX0RBVEU7XG5mdW5jdGlvbiBpbml0VW5zb3J0ZWRUYWJsZVJvd3MoKSB7XG4gICAgaWYgKHN1bW1hcnlSb3dzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKHVuc29ydGVkVGFibGVSb3dzLmxlbmd0aCAhPT0gMCAmJiBiZWF0bWFwSW5mb01hcFVzZWRWZXJzaW9uID09PSBiZWF0bWFwSW5mb01hcFZlcnNpb24pXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBiZWF0bWFwSW5mb01hcFVzZWRWZXJzaW9uID0gYmVhdG1hcEluZm9NYXBWZXJzaW9uO1xuICAgIGlmIChiZWF0bWFwSW5mb01hcC5zaXplICE9PSAwKSB7XG4gICAgICAgIHN1bW1hcnlSb3dzLmZvckVhY2gocm93ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBiZWF0bWFwSW5mb01hcC5nZXQocm93LmJlYXRtYXBfaWRfbnVtYmVyKTtcbiAgICAgICAgICAgIGlmIChpbmZvKVxuICAgICAgICAgICAgICAgIHJvdy5pbmZvID0gaW5mbztcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgbW9kZV9pY29ucyA9IFtcbiAgICAgICAgJ2ZhIGZhLWV4Y2hhbmdlJyxcbiAgICAgICAgJycsXG4gICAgICAgICdmYSBmYS10aW50JyxcbiAgICAgICAgJycsXG4gICAgXTtcbiAgICBjb25zdCBhcHByb3ZlZF9zdGF0dXNfaWNvbnMgPSBbXG4gICAgICAgICdmYSBmYS1xdWVzdGlvbicsXG4gICAgICAgICdmYSBmYS1xdWVzdGlvbicsXG4gICAgICAgICdmYSBmYS1xdWVzdGlvbicsXG4gICAgICAgICdmYSBmYS1hbmdsZS1kb3VibGUtcmlnaHQnLFxuICAgICAgICAnZmEgZmEtZmlyZScsXG4gICAgICAgICdmYSBmYS1jaGVjaycsXG4gICAgICAgICdmYSBmYS1oZWFydC1vJyxcbiAgICBdO1xuICAgIHVuc29ydGVkVGFibGVSb3dzID0gc3VtbWFyeVJvd3MubWFwKHJvdyA9PlxuICAgICAgICAkKCc8dHI+JykuYXBwZW5kKFtcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAkKCc8aT4nKS5hZGRDbGFzcyhhcHByb3ZlZF9zdGF0dXNfaWNvbnNbcm93LmFwcHJvdmVkX3N0YXR1cyArIDJdKSxcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShyb3cuYXBwcm92ZWRfZGF0ZV9zdHJpbmcuc3BsaXQoJyAnKVswXSlcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgJCgnPGk+JykuYWRkQ2xhc3MobW9kZV9pY29uc1tyb3cubW9kZV0pLFxuICAgICAgICAgICAgICAgICQoJzxhPicpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYGh0dHBzOi8vb3N1LnBweS5zaC9iLyR7cm93LmJlYXRtYXBfaWR9P209MmApXG4gICAgICAgICAgICAgICAgICAgIC50ZXh0KHJvdy5kaXNwbGF5X3N0cmluZyksXG4gICAgICAgICAgICAgICAgcm93LmJlYXRtYXBfaWRfbnVtYmVyID4gMCA/ICQoJzxkaXYgY2xhc3M9XCJmbG9hdC1yaWdodFwiPicpLmFwcGVuZChbXG4gICAgICAgICAgICAgICAgICAgICQoJzxhPjxpIGNsYXNzPVwiZmEgZmEtcGljdHVyZS1vXCI+JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYGh0dHBzOi8vYi5wcHkuc2gvdGh1bWIvJHtyb3cuYmVhdG1hcHNldF9pZH0uanBnYCksXG4gICAgICAgICAgICAgICAgICAgICQoJzxhPjxpIGNsYXNzPVwiZmEgZmEtZG93bmxvYWRcIj4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9vc3UucHB5LnNoL2QvJHtyb3cuYmVhdG1hcHNldF9pZH1uYCksXG4gICAgICAgICAgICAgICAgICAgICQoJzxhPjxpIGNsYXNzPVwiZmEgZmEtY2xvdWQtZG93bmxvYWRcIj4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgb3N1Oi8vZGwvJHtyb3cuYmVhdG1hcHNldF9pZH1gKVxuICAgICAgICAgICAgICAgIF0pIDogJCgpXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcm93LnN0YXJzLnRvRml4ZWQoMiksXG4gICAgICAgICAgICByb3cucHAudG9GaXhlZCgwKSxcbiAgICAgICAgICAgIGAke01hdGguZmxvb3Iocm93LmhpdF9sZW5ndGggLyA2MCl9OiR7cGFkKE1hdGguZmxvb3Iocm93LmhpdF9sZW5ndGggJSA2MCkpfWAsXG4gICAgICAgICAgICByb3cubWF4X2NvbWJvLnRvU3RyaW5nKCksXG4gICAgICAgICAgICByb3cuYXBwcm9hY2hfcmF0ZS50b0ZpeGVkKDEpLFxuICAgICAgICAgICAgcm93LmNpcmNsZV9zaXplLnRvRml4ZWQoMSksXG4gICAgICAgICAgICByb3cubWluX21pc3NlcyAhPT0gMCA/IChyb3cubWluX21pc3NlcyA9PT0gMSA/ICcxIG1pc3MnIDogcm93Lm1pbl9taXNzZXMgKyAnIG1pc3NlcycpIDpcbiAgICAgICAgICAgIFtyb3cuZmNOTSwgcm93LmZjSEQsIHJvdy5mY0hSLCByb3cuZmNIREhSLCByb3cuZmNEVCwgcm93LmZjSEREVF0uam9pbignLCAnKSxcbiAgICAgICAgYmVhdG1hcEluZm9NYXAuc2l6ZSA9PT0gMCA/IFtdIDpcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAkKCc8aSBjbGFzcz1cImZhXCI+JykuYWRkQ2xhc3Mocm93LmluZm8gPyAnZmEtY2hlY2stc3F1YXJlLW8nIDogJ2ZhLXNxdWFyZS1vJyksXG4gICAgICAgICAgICAgICAgJCgnPHNwYW4+JykuYWRkQ2xhc3MoJ3JhbmstJyArIHJhbmtBY2hpZXZlZENsYXNzWyFyb3cuaW5mbyA/IDkgOiByb3cuaW5mby5yYW5rQWNoaWV2ZWRdKSxcbiAgICAgICAgICAgICAgICAkKCc8c3Bhbj4nKS50ZXh0KFxuICAgICAgICAgICAgICAgICAgICAhcm93LmluZm8gfHwgcm93LmluZm8ubGFzdFBsYXllZC52YWx1ZU9mKCkgPT09IE1JTklNVU1fREFURS52YWx1ZU9mKClcbiAgICAgICAgICAgICAgICAgICAgICAgID8gJy0tLScgOiBmb3JtYXREYXRlKHJvdy5pbmZvLmxhc3RQbGF5ZWQpXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIF1cbiAgICAgICAgXS5tYXAoeCA9PiAkKCc8dGQ+JykuYXBwZW5kKHgpKSlbMF0gYXMgSFRNTFRhYmxlUm93RWxlbWVudCk7XG5cbiAgICB1bnNvcnRlZFRhYmxlUm93c0NoYW5nZWQgPSB0cnVlO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBzaG93RXJyb3JNZXNzYWdlKHRleHQ6IHN0cmluZykge1xuICAgICQoJyNhbGVydHMnKS5hcHBlbmQoXG4gICAgICAgICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC13YXJuaW5nIGFsZXJ0LWRpc21pc3NhYmxlXCI+JylcbiAgICAgICAgICAgIC50ZXh0KHRleHQpXG4gICAgICAgICAgICAuYXBwZW5kKCc8YSBjbGFzcz1cImNsb3NlXCIgZGF0YS1kaXNtaXNzPVwiYWxlcnRcIj48c3Bhbj4mdGltZXM7JykpO1xufVxuXG5jb25zdCBMT0NBTFNUT1JBR0VfUFJFRklYID0gJ2xpc3QtbWFwcy8nO1xudHlwZSBMb2NhbEZpbGVOYW1lID0gJ29zdSEuZGInIHwgJ3Njb3Jlcy5kYic7XG5pbnRlcmZhY2UgTG9jYWxGaWxlIHtcbiAgICBkYXRhOiBVaW50OEFycmF5O1xuICAgIHVwbG9hZGVkRGF0ZTogRGF0ZTtcbn1cbmNvbnN0IGxvY2FsRmlsZXM6IHtcbiAgICBbJ29zdSEuZGInXT86IExvY2FsRmlsZSxcbiAgICBbJ3Njb3Jlcy5kYiddPzogTG9jYWxGaWxlO1xufSA9IHt9O1xuXG4vKlxuZnVuY3Rpb24gZGF0YVVSSXRvVUludDhBcnJheShkYXRhVVJJOiBzdHJpbmcpIHtcbiAgICBjb25zdCBiYXNlNjQgPSBkYXRhVVJJLnNwbGl0KCcsJylbMV07XG4gICAgY29uc3Qgc3RyID0gYXRvYihiYXNlNjQpO1xuICAgIGNvbnN0IGxlbiA9IHN0ci5sZW5ndGg7XG4gICAgY29uc3QgYXJyYXkgPSBuZXcgVWludDhBcnJheShsZW4pO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyArKyBpKSB7XG4gICAgICAgIGFycmF5W2ldID0gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbn1cbiovXG5cbmNvbnN0IHJlZ2lzdGVyZWRDYWxsYmFja01hcCA9IG5ldyBNYXA8bnVtYmVyLCAoZGF0YTogYW55KSA9PiBhbnk+KCk7XG5mdW5jdGlvbiByZWdpc3RlckNhbGxiYWNrKGNhbGxiYWNrOiAoZGF0YTogYW55KSA9PiBhbnkpOiBudW1iZXIge1xuICAgIGxldCBpZDtcbiAgICBkb1xuICAgICAgICBpZCA9IE1hdGgucmFuZG9tKCk7XG4gICAgd2hpbGUgKHJlZ2lzdGVyZWRDYWxsYmFja01hcC5oYXMoaWQpKTtcbiAgICByZWdpc3RlcmVkQ2FsbGJhY2tNYXAuc2V0KGlkLCBjYWxsYmFjayk7XG4gICAgcmV0dXJuIGlkO1xufVxuXG5mdW5jdGlvbiBuZXdXb3JrZXIoKTogV29ya2VyIHtcbiAgICByZXR1cm4gbmV3IFdvcmtlcignZGlzdC9saXN0LW1hcHMtd29ya2VyLmpzJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1bldvcmtlcihtZXNzYWdlOiBvYmplY3QsIHVzaW5nPzogV29ya2VyKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8YW55PihyZXNvbHZlID0+IHtcbiAgICAgICAgY29uc3Qgd29ya2VyID0gdXNpbmcgfHwgbmV3V29ya2VyKCk7XG4gICAgICAgIChtZXNzYWdlIGFzIGFueSkuaWQgPSByZWdpc3RlckNhbGxiYWNrKHJlc29sdmUpO1xuICAgICAgICB3b3JrZXIucG9zdE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgIHdvcmtlci5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBldmVudC5kYXRhO1xuICAgICAgICAgICAgaWYgKGRhdGEudHlwZSA9PT0gJ2NhbGxiYWNrJyAmJiB0eXBlb2YoZGF0YS5pZCkgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSByZWdpc3RlcmVkQ2FsbGJhY2tNYXAuZ2V0KGRhdGEuaWQpO1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICByZWdpc3RlcmVkQ2FsbGJhY2tNYXAuZGVsZXRlKGRhdGEuaWQpO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbXByZXNzQnVmZmVyVG9TdHJpbmcoYnVmZmVyOiBBcnJheUJ1ZmZlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgY29tcHJlc3NlZCA9IChhd2FpdCBydW5Xb3JrZXIoe1xuICAgICAgICB0eXBlOiAnY29tcHJlc3MnLFxuICAgICAgICBkYXRhOiBuZXcgVWludDhBcnJheShidWZmZXIpXG4gICAgfSkpLmRhdGEgYXMgVWludDhBcnJheTtcbiAgICBjb25zdCBjaGFycyA9IG5ldyBBcnJheShNYXRoLmZsb29yKGNvbXByZXNzZWQubGVuZ3RoIC8gMikpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hhcnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3QgY29kZSA9IChjb21wcmVzc2VkW2kgKiAyICsgMF0gJiAweGZmKSA8PCA4IHwgKGNvbXByZXNzZWRbaSAqIDIgKyAxXSAmIDB4ZmYpO1xuICAgICAgICBjaGFyc1tpXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgfVxuICAgIGxldCByZXMgPSBjb21wcmVzc2VkLmxlbmd0aCAlIDIgPyAnMScgOiAnMCc7XG4gICAgcmVzICs9IGNoYXJzLmpvaW4oJycpO1xuICAgIGlmIChjb21wcmVzc2VkLmxlbmd0aCAlIDIgIT09IDApXG4gICAgICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjb21wcmVzc2VkW2NvbXByZXNzZWQubGVuZ3RoIC0gMV0gJiAweGZmKSA8PCA4KTtcbiAgICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVjb21wcmVzc0J1ZmZlckZyb21TdHJpbmcoc3RyOiBzdHJpbmcpOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgICBjb25zdCBwYXJpdHkgPSBzdHJbMF0gPT09ICcxJyA/IDEgOiAwO1xuICAgIGNvbnN0IGxlbiA9IHN0ci5sZW5ndGggLSAxIC0gcGFyaXR5O1xuICAgIGNvbnN0IGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkobGVuICogMiArIHBhcml0eSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBjb2RlID0gc3RyLmNoYXJDb2RlQXQoaSArIDEpO1xuICAgICAgICBhcnJheVtpICogMiArIDBdID0gY29kZSA+PiA4O1xuICAgICAgICBhcnJheVtpICogMiArIDFdID0gY29kZSAmIDB4ZmY7XG4gICAgfVxuICAgIGlmIChwYXJpdHkgIT09IDApXG4gICAgICAgIGFycmF5W2xlbiAqIDJdID0gc3RyLmNoYXJDb2RlQXQobGVuICsgMSkgPj4gODtcbiAgICBjb25zdCBkZWNvbXByZXNzZWQgPSAoYXdhaXQgcnVuV29ya2VyKHtcbiAgICAgICAgdHlwZTogJ2RlY29tcHJlc3MnLFxuICAgICAgICBkYXRhOiBhcnJheVxuICAgIH0pKS5kYXRhIGFzIFVpbnQ4QXJyYXk7XG4gICAgcmV0dXJuIGRlY29tcHJlc3NlZDtcbn1cblxuZnVuY3Rpb24gcmVsb2FkTG9jYWxGaWxlKG5hbWU6IExvY2FsRmlsZU5hbWUpIHtcbiAgICBjb25zdCBmID0gbG9jYWxGaWxlc1tuYW1lXTtcbiAgICBpZiAobmFtZSA9PT0gJ29zdSEuZGInKVxuICAgICAgICAkKCcjZmlsdGVyLWxvY2FsLWRhdGEnKS5wcm9wKCdkaXNhYmxlZCcsIGYgPT09IHVuZGVmaW5lZCk7XG4gICAgJChuYW1lID09PSAnb3N1IS5kYicgPyAnI2N1cnJlbnQtb3N1ZGItZmlsZScgOiAnI2N1cnJlbnQtc2NvcmVzZGItZmlsZScpXG4gICAgICAgIC50ZXh0KCFmID8gJ05vIGRhdGEnIDogZm9ybWF0RGF0ZShmLnVwbG9hZGVkRGF0ZSkpO1xuICAgIGlmICghZikgcmV0dXJuO1xuICAgIGlmIChuYW1lID09PSAnb3N1IS5kYicpIHtcbiAgICAgICAgbG9hZE9zdURCKGYuZGF0YS5idWZmZXIsIGYudXBsb2FkZWREYXRlKTtcbiAgICB9IGVsc2Uge1xuXG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkRnJvbUxvY2FsU3RvcmFnZShuYW1lOiBMb2NhbEZpbGVOYW1lKSB7XG4gICAgY29uc3QgZGF0ZVN0ciA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKExPQ0FMU1RPUkFHRV9QUkVGSVggKyBuYW1lICsgJy91cGxvYWRlZC1kYXRlJyk7XG4gICAgaWYgKCFkYXRlU3RyKSByZXR1cm47XG4gICAgY29uc3QgZW5jb2RlZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKExPQ0FMU1RPUkFHRV9QUkVGSVggKyBuYW1lICsgJy9kYXRhJykhO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBkZWNvbXByZXNzQnVmZmVyRnJvbVN0cmluZyhlbmNvZGVkKTtcbiAgICBjb25zb2xlLmxvZygnZmlsZSAnICsgbmFtZSArICcgbG9hZGVkIGZyb20gbG9jYWxTdG9yYWdlJyk7XG4gICAgbG9jYWxGaWxlc1tuYW1lXSA9IHtcbiAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgdXBsb2FkZWREYXRlOiBuZXcgRGF0ZShkYXRlU3RyKVxuICAgIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNldExvY2FsRmlsZShuYW1lOiBMb2NhbEZpbGVOYW1lLCBmaWxlOiBGaWxlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4ge1xuICAgICAgICBjb25zdCBmciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIGZyLm9ubG9hZCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpbGUgJyArIG5hbWUgKyAnIGxvYWRlZCcpO1xuICAgICAgICAgICAgY29uc3QgYnVmZmVyID0gZnIucmVzdWx0IGFzIEFycmF5QnVmZmVyO1xuICAgICAgICAgICAgY29uc3QgdXBsb2FkZWREYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIGxvY2FsRmlsZXNbbmFtZV0gPSB7XG4gICAgICAgICAgICAgICAgZGF0YTogbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKSxcbiAgICAgICAgICAgICAgICB1cGxvYWRlZERhdGU6IHVwbG9hZGVkRGF0ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZWxvYWRMb2NhbEZpbGUobmFtZSk7XG4gICAgICAgICAgICBjb21wcmVzc0J1ZmZlclRvU3RyaW5nKGJ1ZmZlcikudGhlbihkYXRhU3RyID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZmlsZSAnICsgbmFtZSArICcgY29tcHJlc3NlZCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSBsb2NhbEZpbGVzW25hbWVdO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50ICYmIGN1cnJlbnQudXBsb2FkZWREYXRlLnZhbHVlT2YoKSAhPT0gdXBsb2FkZWREYXRlLnZhbHVlT2YoKSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKExPQ0FMU1RPUkFHRV9QUkVGSVggKyBuYW1lICsgJy9kYXRhJywgZGF0YVN0cik7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKExPQ0FMU1RPUkFHRV9QUkVGSVggKyBuYW1lICsgJy91cGxvYWRlZC1kYXRlJywgdXBsb2FkZWREYXRlLnRvSVNPU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZmlsZSAnICsgbmFtZSArICcgc2F2ZWQgdG8gbG9jYWxTdG9yYWdlJyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdsb2NhbFN0b3JhZ2UgZXJyb3I6ICcsIGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcbiAgICAgICAgfTtcbiAgICAgICAgZnIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZSk7XG4gICAgfSk7XG59XG5cbmNsYXNzIFNlcmlhbGl6YXRpb25SZWFkZXIge1xuICAgIHByaXZhdGUgZHY6IERhdGFWaWV3O1xuICAgIHByaXZhdGUgb2Zmc2V0OiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihidWZmZXI6IEFycmF5QnVmZmVyKSB7XG4gICAgICAgIHRoaXMuZHYgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcbiAgICAgICAgdGhpcy5vZmZzZXQgPSAwO1xuICAgIH1cblxuICAgIHB1YmxpYyBza2lwKGJ5dGVzOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gYnl0ZXM7XG4gICAgfVxuXG4gICAgcHVibGljIHJlYWRJbnQ4KCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmR2LmdldEludDgodGhpcy5vZmZzZXQpO1xuICAgICAgICB0aGlzLm9mZnNldCArPSAxO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkSW50MTYoKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0SW50MTYodGhpcy5vZmZzZXQsIHRydWUpO1xuICAgICAgICB0aGlzLm9mZnNldCArPSAyO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkSW50MzIoKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0SW50MzIodGhpcy5vZmZzZXQsIHRydWUpO1xuICAgICAgICB0aGlzLm9mZnNldCArPSA0O1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkQnl0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZEludDgoKSB8IDA7XG4gICAgfVxuXG4gICAgcHVibGljIHJlYWRVSW50MTYoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRJbnQxNigpIHwgMDtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVhZFVJbnQzMigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZEludDMyKCkgfCAwO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkQm9vbGVhbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZEludDgoKSAhPT0gMDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlYWRVTEVCMTI4KCkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gMDtcbiAgICAgICAgZm9yIChsZXQgc2hpZnQgPSAwOyA7IHNoaWZ0ICs9IDcpIHtcbiAgICAgICAgICAgIGNvbnN0IGJ5dGUgPSB0aGlzLmR2LmdldFVpbnQ4KHRoaXMub2Zmc2V0KTtcbiAgICAgICAgICAgIHRoaXMub2Zmc2V0ICs9IDE7XG4gICAgICAgICAgICByZXN1bHQgfD0gKGJ5dGUgJiAweDdmKSA8PCBzaGlmdDtcbiAgICAgICAgICAgIGlmICgoYnl0ZSAmIDB4ODApID09PSAwKVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVhZFVpbnQ4QXJyYXkobGVuZ3RoOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5kdi5idWZmZXIsIHRoaXMub2Zmc2V0LCBsZW5ndGgpO1xuICAgICAgICB0aGlzLm9mZnNldCArPSBsZW5ndGg7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHVibGljIHJlYWRTdHJpbmcoKSB7XG4gICAgICAgIGNvbnN0IGhlYWRlciA9IHRoaXMucmVhZEludDgoKTtcbiAgICAgICAgaWYgKGhlYWRlciA9PT0gMClcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gdGhpcy5yZWFkVUxFQjEyOCgpO1xuICAgICAgICBjb25zdCBhcnJheSA9IHRoaXMucmVhZFVpbnQ4QXJyYXkobGVuZ3RoKTtcbiAgICAgICAgcmV0dXJuIG5ldyBUZXh0RGVjb2RlcigndXRmLTgnKS5kZWNvZGUoYXJyYXkpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkSW50NjRSb3VuZGVkKCkge1xuICAgICAgICBjb25zdCBsbyA9IHRoaXMuZHYuZ2V0VWludDMyKHRoaXMub2Zmc2V0LCB0cnVlKTtcbiAgICAgICAgY29uc3QgaGkgPSB0aGlzLmR2LmdldFVpbnQzMih0aGlzLm9mZnNldCArIDQsIHRydWUpO1xuICAgICAgICB0aGlzLm9mZnNldCArPSA4O1xuICAgICAgICByZXR1cm4gaGkgKiAweDEwMDAwMDAwMCArIGxvO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkRGF0ZVRpbWUoKSB7XG4gICAgICAgIC8vIE9GRlNFVCA9IDYyMTM1NTk2ODAwMDAwMDAwMCA9IHRpY2tzIGZyb20gMDAwMS8xLzEgdG8gMTk3MC8xLzFcbiAgICAgICAgbGV0IGxvID0gdGhpcy5yZWFkVUludDMyKCk7XG4gICAgICAgIGxldCBoaSA9IHRoaXMucmVhZFVJbnQzMigpO1xuICAgICAgICBsbyAtPSAzNDQ0MjkzNjMyOyAvLyBsbyBiaXRzIG9mIE9GRlNFVFxuICAgICAgICBpZiAobG8gPCAwKSB7XG4gICAgICAgICAgICBsbyArPSA0Mjk0OTY3Mjk2OyAgIC8vIDJeMzJcbiAgICAgICAgICAgIGhpIC09IDE7XG4gICAgICAgIH1cbiAgICAgICAgaGkgLT0gMTQ0NjcwNTA4OyAgLy8gaGkgYml0cyBvZiBPRkZTRVRcbiAgICAgICAgY29uc3QgdGlja3MgPSBoaSAqIDQyOTQ5NjcyOTYgKyBsbztcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKHRpY2tzICogMWUtNCk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlYWRTaW5nbGUoKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0RmxvYXQzMih0aGlzLm9mZnNldCwgdHJ1ZSk7XG4gICAgICAgIHRoaXMub2Zmc2V0ICs9IDQ7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHVibGljIHJlYWREb3VibGUoKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0RmxvYXQ2NCh0aGlzLm9mZnNldCwgdHJ1ZSk7XG4gICAgICAgIHRoaXMub2Zmc2V0ICs9IDg7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHVibGljIHJlYWRMaXN0KGNhbGxiYWNrOiAoaW5kZXg6IG51bWJlcikgPT4gYW55KSB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gdGhpcy5yZWFkSW50MzIoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSArPSAxKVxuICAgICAgICAgICAgY2FsbGJhY2soaSk7XG4gICAgfVxufVxuXG5jbGFzcyBCZWF0bWFwSW5mbyB7XG4gICAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmVhdG1hcElkOiBudW1iZXIsXG4gICAgICAgIHB1YmxpYyByZWFkb25seSBsYXN0UGxheWVkOiBEYXRlLFxuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgcmFua0FjaGlldmVkOiBudW1iZXIpIHt9XG59XG5cbmZ1bmN0aW9uIHJlYWRCZWF0bWFwKHNyOiBTZXJpYWxpemF0aW9uUmVhZGVyKSB7XG4gICAgY29uc3QgU2l6ZUluQnl0ZXMgPSBzci5yZWFkSW50MzIoKTtcblxuICAgIGNvbnN0IEFydGlzdCA9IHNyLnJlYWRTdHJpbmcoKTtcbiAgICBjb25zdCBBcnRpc3RVbmljb2RlID0gc3IucmVhZFN0cmluZygpO1xuICAgIGNvbnN0IFRpdGxlID0gc3IucmVhZFN0cmluZygpO1xuICAgIGNvbnN0IFRpdGxlVW5pY29kZSA9IHNyLnJlYWRTdHJpbmcoKTtcbiAgICBjb25zdCBDcmVhdG9yID0gc3IucmVhZFN0cmluZygpO1xuICAgIGNvbnN0IFZlcnNpb24gPSBzci5yZWFkU3RyaW5nKCk7XG4gICAgY29uc3QgQXVkaW9GaWxlbmFtZSA9IHNyLnJlYWRTdHJpbmcoKTtcbiAgICBjb25zdCBCZWF0bWFwQ2hlY2tzdW0gPSBzci5yZWFkU3RyaW5nKCk7XG4gICAgY29uc3QgRmlsZW5hbWUgPSBzci5yZWFkU3RyaW5nKCk7XG4gICAgY29uc3QgU3VibWlzc2lvblN0YXR1cyA9IHNyLnJlYWRCeXRlKCk7XG4gICAgY29uc3QgY291bnROb3JtYWwgPSBzci5yZWFkVUludDE2KCk7XG4gICAgY29uc3QgY291bnRTbGlkZXIgPSBzci5yZWFkVUludDE2KCk7XG4gICAgY29uc3QgY291bnRTcGlubmVyID0gc3IucmVhZFVJbnQxNigpO1xuICAgIGNvbnN0IERhdGVNb2RpZmllZCA9IHNyLnJlYWREYXRlVGltZSgpO1xuXG4gICAgY29uc3QgRGlmZmljdWx0eUFwcHJvYWNoUmF0ZSA9IHNyLnJlYWRTaW5nbGUoKTtcbiAgICBjb25zdCBEaWZmaWN1bHR5Q2lyY2xlU2l6ZSA9IHNyLnJlYWRTaW5nbGUoKTtcbiAgICBjb25zdCBEaWZmaWN1bHR5SHBEcmFpblJhdGUgPSBzci5yZWFkU2luZ2xlKCk7XG4gICAgY29uc3QgRGlmZmljdWx0eU92ZXJhbGwgPSBzci5yZWFkU2luZ2xlKCk7XG5cbiAgICBjb25zdCBEaWZmaWN1bHR5U2xpZGVyTXVsdGlwbGllciA9IHNyLnJlYWREb3VibGUoKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSArPSAxKSB7XG4gICAgICAgIHNyLnJlYWRMaXN0KCgpID0+IHtcbiAgICAgICAgICAgIHNyLnJlYWRJbnQzMigpO1xuICAgICAgICAgICAgc3IucmVhZEludDE2KCk7XG4gICAgICAgICAgICBzci5yZWFkRG91YmxlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IERyYWluTGVuZ3RoID0gc3IucmVhZEludDMyKCk7XG4gICAgY29uc3QgVG90YWxMZW5ndGggPSBzci5yZWFkSW50MzIoKTtcbiAgICBjb25zdCBQcmV2aWV3VGltZSA9IHNyLnJlYWRJbnQzMigpO1xuICAgIHNyLnJlYWRMaXN0KCgpID0+IHtcbiAgICAgICAgY29uc3QgQmVhdExlbmd0aCA9IHNyLnJlYWREb3VibGUoKTtcbiAgICAgICAgY29uc3QgT2Zmc2V0ID0gc3IucmVhZERvdWJsZSgpO1xuICAgICAgICBjb25zdCBUaW1pbmdDaGFuZ2UgPSBzci5yZWFkQm9vbGVhbigpO1xuICAgIH0pO1xuICAgIGNvbnN0IEJlYXRtYXBJZCA9IHNyLnJlYWRJbnQzMigpO1xuICAgIGNvbnN0IEJlYXRtYXBTZXRJZCA9IHNyLnJlYWRJbnQzMigpO1xuICAgIGNvbnN0IEJlYXRtYXBUb3BpY0lkID0gc3IucmVhZEludDMyKCk7XG4gICAgY29uc3QgUGxheWVyUmFua09zdSA9IHNyLnJlYWRCeXRlKCk7XG4gICAgY29uc3QgUGxheWVyUmFua0ZydWl0cyA9IHNyLnJlYWRCeXRlKCk7XG4gICAgY29uc3QgUGxheWVyUmFua1RhaWtvID0gc3IucmVhZEJ5dGUoKTtcbiAgICBjb25zdCBQbGF5ZXJSYW5rTWFuaWEgPSBzci5yZWFkQnl0ZSgpO1xuICAgIGNvbnN0IFBsYXllck9mZnNldCA9IHNyLnJlYWRJbnQxNigpO1xuICAgIGNvbnN0IFN0YWNrTGVuaWVuY3kgPSBzci5yZWFkU2luZ2xlKCk7XG4gICAgY29uc3QgUGxheU1vZGUgPSBzci5yZWFkQnl0ZSgpO1xuICAgIGNvbnN0IFNvdXJjZSA9IHNyLnJlYWRTdHJpbmcoKTtcbiAgICBjb25zdCBUYWdzID0gc3IucmVhZFN0cmluZygpO1xuICAgIGNvbnN0IE9ubGluZU9mZnNldCA9IHNyLnJlYWRJbnQxNigpO1xuICAgIGNvbnN0IE9ubGluZURpc3BsYXlUaXRsZSA9IHNyLnJlYWRTdHJpbmcoKTtcbiAgICBjb25zdCBOZXdGaWxlID0gc3IucmVhZEJvb2xlYW4oKTtcbiAgICBjb25zdCBEYXRlTGFzdFBsYXllZCA9IHNyLnJlYWREYXRlVGltZSgpO1xuICAgIGNvbnN0IEluT3N6Q29udGFpbmVyID0gc3IucmVhZEJvb2xlYW4oKTtcbiAgICBjb25zdCBDb250YWluaW5nRm9sZGVyQWJzb2x1dGUgPSBzci5yZWFkU3RyaW5nKCk7XG4gICAgY29uc3QgTGFzdEluZm9VcGRhdGUgPSBzci5yZWFkRGF0ZVRpbWUoKTtcbiAgICBjb25zdCBEaXNhYmxlU2FtcGxlcyA9IHNyLnJlYWRCb29sZWFuKCk7XG4gICAgY29uc3QgRGlzYWJsZVNraW4gPSBzci5yZWFkQm9vbGVhbigpO1xuICAgIGNvbnN0IERpc2FibGVTdG9yeWJvYXJkID0gc3IucmVhZEJvb2xlYW4oKTtcbiAgICBjb25zdCBEaXNhYmxlVmlkZW8gPSBzci5yZWFkQm9vbGVhbigpO1xuICAgIGNvbnN0IFZpc3VhbFNldHRpbmdzT3ZlcnJpZGUgPSBzci5yZWFkQm9vbGVhbigpO1xuXG4gICAgY29uc3QgTGFzdEVkaXRUaW1lID0gc3IucmVhZEludDMyKCk7XG4gICAgY29uc3QgTWFuaWFTcGVlZCA9IHNyLnJlYWRCeXRlKCk7XG5cbiAgICByZXR1cm4gbmV3IEJlYXRtYXBJbmZvKFxuICAgICAgICBCZWF0bWFwSWQsXG4gICAgICAgIG5ldyBEYXRlKE1hdGgubWF4KE1JTklNVU1fREFURS52YWx1ZU9mKCksIERhdGVMYXN0UGxheWVkLnZhbHVlT2YoKSkpLFxuICAgICAgICBQbGF5ZXJSYW5rRnJ1aXRzKTtcbn1cblxuY29uc3QgYmVhdG1hcEluZm9NYXAgPSBuZXcgTWFwPG51bWJlciwgQmVhdG1hcEluZm8+KCk7XG5sZXQgYmVhdG1hcEluZm9NYXBWZXJzaW9uID0gTUlOSU1VTV9EQVRFO1xuXG5mdW5jdGlvbiBsb2FkT3N1REIoYnVmZmVyOiBBcnJheUJ1ZmZlciwgdmVyc2lvbjogRGF0ZSkge1xuICAgIGJlYXRtYXBJbmZvTWFwLmNsZWFyKCk7XG4gICAgY29uc3Qgc3IgPSBuZXcgU2VyaWFsaXphdGlvblJlYWRlcihidWZmZXIpO1xuICAgIHNyLnNraXAoNCArIDQgKyAxICsgOCk7XG4gICAgc3IucmVhZFN0cmluZygpO1xuICAgIGNvbnN0IGJlYXRtYXBDb3VudCA9IHNyLnJlYWRJbnQzMigpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiZWF0bWFwQ291bnQ7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBiZWF0bWFwID0gcmVhZEJlYXRtYXAoc3IpO1xuICAgICAgICBpZiAoYmVhdG1hcC5iZWF0bWFwSWQgPiAwKVxuICAgICAgICAgICAgYmVhdG1hcEluZm9NYXAuc2V0KGJlYXRtYXAuYmVhdG1hcElkLCBiZWF0bWFwKTtcbiAgICB9XG5cbiAgICBiZWF0bWFwSW5mb01hcFZlcnNpb24gPSB2ZXJzaW9uO1xufVxuXG5mdW5jdGlvbiBpbml0VGFibGUoc29ydEtleXM6IHt9W10sIG9yZGVyQ29uZmlnOiBbbnVtYmVyW10sIG51bWJlcl0sIG9uU29ydE9yZGVyQ2hhbmdlZDogKCkgPT4gdm9pZCkge1xuICAgIGNvbnN0IHRoTGlzdCA9ICQoJyNzdW1tYXJ5LXRhYmxlID4gdGhlYWQgPiB0ciA+IHRoJyk7XG4gICAgc29ydEtleXMuZm9yRWFjaCgoXywgaW5kZXgpID0+IHtcbiAgICAgICAgJC5kYXRhKHRoTGlzdFtpbmRleF0sICd0aEluZGV4JywgaW5kZXgpO1xuICAgIH0pO1xuICAgIHRoTGlzdC5jbGljaygoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3QgdGggPSAkKGV2ZW50LnRhcmdldCk7XG4gICAgICAgIGxldCBzaWduO1xuICAgICAgICBpZiAodGguaGFzQ2xhc3MoJ3NvcnRlZCcpKVxuICAgICAgICAgICAgc2lnbiA9IHRoLmhhc0NsYXNzKCdkZXNjZW5kaW5nJykgPyAxIDogLTE7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNpZ24gPSB0aC5oYXNDbGFzcygnZGVzYy1maXJzdCcpID8gLTEgOiAxO1xuICAgICAgICBjb25zdCB0aEluZGV4ID0gdGguZGF0YSgndGhJbmRleCcpIGFzIG51bWJlcjtcbiAgICAgICAgY3VycmVudFNvcnRPcmRlci5wdXNoKCh0aEluZGV4ICsgMSkgKiBzaWduKTtcbiAgICAgICAgY3VycmVudFNvcnRPcmRlciA9IHNpbXBsaWZ5U29ydE9yZGVyKGN1cnJlbnRTb3J0T3JkZXIsIG9yZGVyQ29uZmlnKTtcbiAgICAgICAgc2V0VGFibGVIZWFkU29ydGluZ01hcmsoKTtcbiAgICAgICAgb25Tb3J0T3JkZXJDaGFuZ2VkKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIG1haW4oKSB7XG4gICAgUHJvbWlzZS5hbGwoXG4gICAgICAgIChbJ29zdSEuZGInLCAnc2NvcmVzLmRiJ10gYXMgTG9jYWxGaWxlTmFtZVtdKVxuICAgICAgICAgICAgLm1hcChuYW1lID0+XG4gICAgICAgICAgICAgICAgbG9hZEZyb21Mb2NhbFN0b3JhZ2UobmFtZSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gcmVsb2FkTG9jYWxGaWxlKG5hbWUpKSkpLnRoZW4oKCkgPT4ge1xuICAgICAgICBpZiAoaW5pdFVuc29ydGVkVGFibGVSb3dzKCkpXG4gICAgICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XG4gICAgfSk7XG4gICAgc2V0UXVlcnlBY2NvcmRpbmdUb0hhc2goKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsICgpID0+IHtcbiAgICAgICAgc2V0UXVlcnlBY2NvcmRpbmdUb0hhc2goKTtcbiAgICAgICAgZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpO1xuICAgIH0pO1xuICAgIGNvbnN0IG9uQ2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XG4gICAgfTtcbiAgICBmb3IgKGNvbnN0IGlkIG9mIFsnZmlsdGVyLWFwcHJvdmVkLXN0YXR1cycsICdmaWx0ZXItbW9kZScsICdmaWx0ZXItZmMtbGV2ZWwnLCAnZmlsdGVyLWxvY2FsLWRhdGEnLCAnc2hvdy1mdWxsLXJlc3VsdCddKVxuICAgICAgICAkKGAjJHtpZH1gKS5vbignY2hhbmdlJywgb25DaGFuZ2UpO1xuICAgIGZvciAoY29uc3QgaWQgb2YgWydmaWx0ZXItc2VhcmNoLXF1ZXJ5J10pXG4gICAgICAgICQoYCMke2lkfWApLm9uKCdpbnB1dCcsIG9uQ2hhbmdlKTtcbiAgICBpbml0VGFibGUoc29ydEtleXMsIHN1bW1hcnlPcmRlckNvbmZpZywgb25DaGFuZ2UpO1xuXG4gICAgY29uc3QgbG9hZERhdGEgPSAoZGF0YTogU3VtbWFyeVJvd0RhdGFbXSwgbGFzdE1vZGlmaWVkOiBEYXRlKSA9PiB7XG4gICAgICAgICQoJyNsYXN0LXVwZGF0ZS10aW1lJylcbiAgICAgICAgICAgIC5hcHBlbmQoJCgnPHRpbWU+JylcbiAgICAgICAgICAgICAgICAuYXR0cignZGF0ZXRpbWUnLCBsYXN0TW9kaWZpZWQudG9JU09TdHJpbmcoKSlcbiAgICAgICAgICAgICAgICAudGV4dChsYXN0TW9kaWZpZWQudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdKSk7XG4gICAgICAgIHN1bW1hcnlSb3dzID0gZGF0YS5tYXAoeCA9PiBuZXcgU3VtbWFyeVJvdyh4KSk7XG4gICAgICAgIGluaXRVbnNvcnRlZFRhYmxlUm93cygpO1xuICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XG4gICAgICAgICQoJyNzdW1tYXJ5LXRhYmxlLWxvYWRlcicpLmhpZGUoKTtcbiAgICB9O1xuICAgICQuZ2V0SlNPTignZGF0YS9zdW1tYXJ5Lmpzb24nKS50aGVuKChkYXRhLCBfLCB4aHIpID0+IHtcbiAgICAgICAgbG9hZERhdGEoZGF0YSwgbmV3IERhdGUoeGhyLmdldFJlc3BvbnNlSGVhZGVyKCdMYXN0LU1vZGlmaWVkJykgYXMgc3RyaW5nKSk7XG4gICAgfSk7XG4gICAgJCgnI2RiLWZpbGUtaW5wdXQnKS5jaGFuZ2UoYXN5bmMgZXZlbnQgPT4ge1xuICAgICAgICBjb25zdCBlbGVtID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICAgIGlmICghZWxlbS5maWxlcykgcmV0dXJuO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsZW0uZmlsZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBlbGVtLmZpbGVzW2ldO1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGZpbGUubmFtZTtcbiAgICAgICAgICAgIGlmIChuYW1lLmluZGV4T2YoJ29zdSEuZGInKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzZXRMb2NhbEZpbGUoJ29zdSEuZGInLCBmaWxlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmFtZS5pbmRleE9mKCdzY29yZXMuZGInKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzZXRMb2NhbEZpbGUoJ3Njb3Jlcy5kYicsIGZpbGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzaG93RXJyb3JNZXNzYWdlKGBJbnZhbGlkIGZpbGUgJHtuYW1lfTogUGxlYXNlIHNlbGVjdCBvc3UhLmRiIG9yIHNjb3Jlcy5kYmApO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGluaXRVbnNvcnRlZFRhYmxlUm93cygpKVxuICAgICAgICAgICAgICAgIGRyYXdUYWJsZUZvckN1cnJlbnRGaWx0ZXJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBlbGVtLnZhbHVlID0gJyc7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGluaXRVbnNvcnRlZFJhbmtpbmdUYWJsZVJvd3MoKSB7XG4gICAgaWYgKHJhbmtpbmdSb3dzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgdW5zb3J0ZWRUYWJsZVJvd3MgPSByYW5raW5nUm93cy5tYXAocm93ID0+XG4gICAgICAgICQoJzx0cj4nKS5hcHBlbmQoW1xuICAgICAgICAgICAgcm93LnJhbmsudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIHJvdy5wcC50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgJCgnPGE+JykuYXR0cignaHJlZicsIGBodHRwczovL29zdS5wcHkuc2gvdS8ke3Jvdy51c2VyX2lkfWApLnRleHQocm93LnVzZXJuYW1lKSxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAkKCc8YT4nKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cignaHJlZicsIGBodHRwczovL29zdS5wcHkuc2gvYi8ke3Jvdy5iZWF0bWFwX2lkfT9tPTJgKVxuICAgICAgICAgICAgICAgICAgICAudGV4dChyb3cuZGlzcGxheV9zdHJpbmcpLFxuICAgICAgICAgICAgICAgIHJvdy5iZWF0bWFwX2lkX251bWJlciA+IDAgPyAkKCc8ZGl2IGNsYXNzPVwiZmxvYXQtcmlnaHRcIj4nKS5hcHBlbmQoW1xuICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLXBpY3R1cmUtb1wiPicpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignaHJlZicsIGBodHRwczovL2IucHB5LnNoL3RodW1iLyR7cm93LmJlYXRtYXBzZXRfaWR9LmpwZ2ApLFxuICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLWRvd25sb2FkXCI+JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYGh0dHBzOi8vb3N1LnBweS5zaC9kLyR7cm93LmJlYXRtYXBzZXRfaWR9bmApLFxuICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLWNsb3VkLWRvd25sb2FkXCI+JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYG9zdTovL2RsLyR7cm93LmJlYXRtYXBzZXRfaWR9YClcbiAgICAgICAgICAgICAgICBdKSA6ICQoKVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJvdy5tb2RzLFxuICAgICAgICAgICAgcm93LmFjY3VyYWN5LnRvRml4ZWQoMikgKyAnJScsXG4gICAgICAgICAgICByb3cuY29tYm9fZGlzcGxheSxcbiAgICAgICAgICAgIHJvdy5kYXRlX3BsYXllZF9zdHJpbmcsXG4gICAgICAgIF0ubWFwKHggPT4gJCgnPHRkPicpLmFwcGVuZCh4KSkpWzBdIGFzIEhUTUxUYWJsZVJvd0VsZW1lbnQpO1xuXG4gICAgdW5zb3J0ZWRUYWJsZVJvd3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuY29uc3QgcmFua2luZ1NvcnRLZXlzID0gW1xuICAgICh4OiBSYW5raW5nUm93KSA9PiB4LnJhbmssXG4gICAgKHg6IFJhbmtpbmdSb3cpID0+IHgucHAsXG4gICAgKHg6IFJhbmtpbmdSb3cpID0+IHgudXNlcm5hbWVfbG93ZXIsXG4gICAgKHg6IFJhbmtpbmdSb3cpID0+IHguZGlzcGxheV9zdHJpbmdfbG93ZXIsXG4gICAgKHg6IFJhbmtpbmdSb3cpID0+IHgubW9kcyxcbiAgICAoeDogUmFua2luZ1JvdykgPT4geC5hY2N1cmFjeSxcbiAgICAoeDogUmFua2luZ1JvdykgPT4geC5jb21ib19kaXNwbGF5LFxuICAgICh4OiBSYW5raW5nUm93KSA9PiB4LmRhdGVfcGxheWVkX3N0cmluZyxcbl07XG5cbmZ1bmN0aW9uIGRyYXdSYW5raW5nVGFibGUoKSB7XG4gICAgY29uc3QgaW5kaWNlcyA9IHJhbmtpbmdSb3dzLm1hcCgoX3JvdywgaSkgPT4gaSk7XG4gICAgY29uc3QgcHJldkluZGV4ID0gQXJyYXkocmFua2luZ1Jvd3MubGVuZ3RoKTtcbiAgICBmb3IgKGNvbnN0IG9yZCBvZiBjdXJyZW50U29ydE9yZGVyKSB7XG4gICAgICAgIGlmIChvcmQgPT09IDApIGNvbnRpbnVlO1xuICAgICAgICBpbmRpY2VzLmZvckVhY2goKHgsIGkpID0+IHByZXZJbmRleFt4XSA9IGkpO1xuICAgICAgICBjb25zdCBzb3J0S2V5ID0gcmFua2luZ1NvcnRLZXlzW01hdGguYWJzKG9yZCkgLSAxXTtcbiAgICAgICAgY29uc3Qgc2lnbiA9IG9yZCA+IDAgPyAxIDogLTE7XG4gICAgICAgIGluZGljZXMuc29ydCgoeCwgeSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qga3ggPSBzb3J0S2V5KHJhbmtpbmdSb3dzW3hdKTtcbiAgICAgICAgICAgIGNvbnN0IGt5ID0gc29ydEtleShyYW5raW5nUm93c1t5XSk7XG4gICAgICAgICAgICByZXR1cm4ga3ggPCBreSA/IC1zaWduIDoga3ggPiBreSA/IHNpZ24gOiBwcmV2SW5kZXhbeF0gLSBwcmV2SW5kZXhbeV07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBkcmF3VGFibGUoaW5kaWNlcyk7XG59XG5cbmZ1bmN0aW9uIHJhbmtpbmdNYWluKCkge1xuICAgIGluaXRUYWJsZShyYW5raW5nU29ydEtleXMsIHJhbmtpbmdPcmRlckNvbmZpZywgZHJhd1JhbmtpbmdUYWJsZSk7XG4gICAgY29uc3QgbG9hZERhdGEgPSAoZGF0YTogUmFua2luZ1Jvd0RhdGFbXSwgbGFzdE1vZGlmaWVkOiBEYXRlKSA9PiB7XG4gICAgICAgICQoJyNsYXN0LXVwZGF0ZS10aW1lJylcbiAgICAgICAgICAgIC5hcHBlbmQoJCgnPHRpbWU+JylcbiAgICAgICAgICAgICAgICAuYXR0cignZGF0ZXRpbWUnLCBsYXN0TW9kaWZpZWQudG9JU09TdHJpbmcoKSlcbiAgICAgICAgICAgICAgICAudGV4dChsYXN0TW9kaWZpZWQudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdKSk7XG4gICAgICAgIHJhbmtpbmdSb3dzID0gZGF0YS5tYXAoKHgsIGkpID0+IG5ldyBSYW5raW5nUm93KGkgKyAxLCB4KSk7XG4gICAgICAgIGluaXRVbnNvcnRlZFJhbmtpbmdUYWJsZVJvd3MoKTtcbiAgICAgICAgZHJhd1JhbmtpbmdUYWJsZSgpO1xuICAgICAgICAkKCcjc3VtbWFyeS10YWJsZS1sb2FkZXInKS5oaWRlKCk7XG4gICAgfTtcbiAgICAkLmdldEpTT04oJ2RhdGEvcmFua2luZy5qc29uJykudGhlbigoZGF0YSwgXywgeGhyKSA9PiB7XG4gICAgICAgIGxvYWREYXRhKGRhdGEsIG5ldyBEYXRlKHhoci5nZXRSZXNwb25zZUhlYWRlcignTGFzdC1Nb2RpZmllZCcpIGFzIHN0cmluZykpO1xuICAgIH0pO1xufVxuXG5pZiAoL3JhbmtpbmdcXC5odG1sJC9pLnRlc3QobG9jYXRpb24ucGF0aG5hbWUpKSB7XG4gICAgJChyYW5raW5nTWFpbik7XG59IGVsc2Uge1xuICAgICQobWFpbik7XG59XG5cbn1cbiJdfQ==