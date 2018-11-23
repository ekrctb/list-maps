"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var ListMaps;
(function (ListMaps) {
    var MINIMUM_DATE = new Date(0);
    var SummaryRow = /** @class */ (function () {
        function SummaryRow(data) {
            this.data = data;
            this.approved_status = data[0], this.approved_date_string = data[1], this.mode = data[2], this.beatmap_id = data[3], this.beatmapset_id = data[4], this.display_string = data[5], this.stars = data[6], this.pp = data[7], this.hit_length = data[8], this.max_combo = data[9], this.approach_rate = data[10], this.circle_size = data[11], this.min_misses = data[12], this.fcNM = data[13], this.fcHD = data[14], this.fcHR = data[15], this.fcHDHR = data[16], this.fcDT = data[17], this.fcHDDT = data[18];
            this.beatmap_id_number = parseInt(this.beatmap_id);
            this.approved_date = new Date(this.approved_date_string.replace(' ', 'T') + '+08:00');
            this.display_string_lower = this.display_string.toLowerCase();
            this.info = null;
        }
        return SummaryRow;
    }());
    var RankingRow = /** @class */ (function () {
        function RankingRow(rank, data) {
            this.rank = rank;
            this.data = data;
            this.stars = data[0], this.pp = data[1], this.user_id = data[2], this.username = data[3], this.beatmap_id = data[4], this.beatmapset_id = data[5], this.display_string = data[6], this.mods = data[7], this.accuracy = data[8], this.combo_display = data[9], this.date_played_string = data[10];
            this.beatmap_id_number = parseInt(this.beatmap_id);
            this.username_lower = this.username.toLowerCase();
            this.display_string_lower = this.display_string.toLowerCase();
        }
        return RankingRow;
    }());
    var summaryRows = [];
    var rankingRows = [];
    var unsortedTableRows = [];
    var currentSortOrder = [];
    var currentHashLink = '#';
    var previousIndices = '';
    var unsortedTableRowsChanged = false;
    function drawTable(indices) {
        var str = indices.join(',');
        if (!unsortedTableRowsChanged && previousIndices === str)
            return;
        unsortedTableRowsChanged = false;
        previousIndices = str;
        $('#summary-table > tbody')
            .empty()
            .append(indices.map(function (index) { return unsortedTableRows[index]; }));
    }
    var SearchQuery = /** @class */ (function () {
        function SearchQuery(source) {
            this.source = source;
            var key_to_property_name = {
                'status': '"pppraql"[row.approved_status+2]',
                'mode': '"otcm"[row.mode]',
                'stars': 'row.stars',
                'pp': 'row.pp',
                'length': 'row.hit_length',
                'combo': 'row.max_combo',
                'ar': 'row.approach_rate',
                'cs': 'row.circle_size',
                'played': "(!row.info?Infinity:(" + new Date().valueOf() + "-row.info.lastPlayed.valueOf())/" + 1e3 * 60 * 60 * 24 + ")",
                'unplayed': "(row.info&&row.info.lastPlayed.valueOf()!==" + MINIMUM_DATE.valueOf() + "?'y':'')",
                'date': "(" + new Date().valueOf() + "-row.approved_date.valueOf())/" + 1e3 * 60 * 60 * 24,
                'rank': "(" + JSON.stringify(rankAchievedClass) + "[!row.info?9:row.info.rankAchieved]).toLowerCase()"
            };
            var regexp = new RegExp("(" + Object.keys(key_to_property_name).join('|') + ")(<=?|>=?|=|!=)([-\\w\\.]*)");
            var check_func_source = 'return true';
            this.normalized_source = '';
            for (var _i = 0, _a = source.split(' '); _i < _a.length; _i++) {
                var token = _a[_i];
                var trimmed = token.trim();
                if (trimmed === '')
                    continue;
                var match = regexp.exec(trimmed);
                if (match) {
                    var key = match[1];
                    var rel = match[2] === '=' ? '==' : match[2];
                    var val = parseFloat(match[3]);
                    if (isNaN(val))
                        val = match[3].toLowerCase();
                    var prop = key_to_property_name[key];
                    if (this.normalized_source !== '')
                        this.normalized_source += ' ';
                    this.normalized_source += match[1] + match[2] + match[3];
                    check_func_source += "&&" + prop + rel + JSON.stringify(val);
                }
                else {
                    var str = trimmed.toLowerCase();
                    var escaped = JSON.stringify(str);
                    if (this.normalized_source !== '')
                        this.normalized_source += ' ';
                    this.normalized_source += str;
                    check_func_source += "&&row.display_string_lower.indexOf(" + escaped + ")!==-1";
                }
            }
            this.check = new Function('row', check_func_source);
        }
        return SearchQuery;
    }());
    var sortKeys = [
        function (x) { return x.approved_date_string; },
        function (x) { return x.display_string_lower; },
        function (x) { return x.stars; },
        function (x) { return x.pp; },
        function (x) { return x.hit_length; },
        function (x) { return x.max_combo; },
        function (x) { return x.approach_rate; },
        function (x) { return x.circle_size; },
        function (x) {
            return x.fcHDDT * 2 + x.fcDT * 1e8 +
                x.fcHDHR * 2 + x.fcHR * 1e4 +
                x.fcHD * 2 + x.fcNM -
                x.min_misses;
        },
        function (x) { return !x.info ? MINIMUM_DATE.valueOf() : x.info.lastPlayed.valueOf(); }
    ];
    function stringifyObject(obj) {
        return Object.keys(obj)
            .map(function (k) { return k + '=' + encodeURIComponent(obj[k]); })
            .join('&');
    }
    function parseObject(str) {
        var res = {};
        str.split('&').forEach(function (part) {
            var match = part.match(/(\w+)=(.+)/);
            if (match)
                res[match[1]] = decodeURIComponent(match[2]);
        });
        return res;
    }
    function drawTableForCurrentFiltering() {
        var filter_approved_status = parseInt($('#filter-approved-status').val());
        var filter_mode = parseInt($('#filter-mode').val());
        var filter_search_query = new SearchQuery($('#filter-search-query').val());
        var filter_fc_level = parseInt($('#filter-fc-level').val());
        var filter_local_data = parseInt($('#filter-local-data').val());
        var show_full_result = $('#show-full-result').prop('checked');
        var get_fc_level = function (row) {
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
        var get_local_data_flags = function (row) {
            if (beatmapInfoMap.size === 0)
                return -1;
            var flags = 0;
            var info = beatmapInfoMap.get(row.beatmap_id_number);
            if (!info)
                return 0;
            flags |= 2;
            if (info.lastPlayed.valueOf() !== MINIMUM_DATE.valueOf())
                flags |= 1;
            return flags;
        };
        currentHashLink = '#';
        var obj = {};
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
        var indices = summaryRows.map(function (_, index) { return index; }).filter(function (index) {
            var row = summaryRows[index];
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
                var flags = get_local_data_flags(row);
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
        var prevIndex = Array(summaryRows.length);
        var _loop_1 = function (ord) {
            if (ord === 0)
                return "continue";
            indices.forEach(function (x, i) { return prevIndex[x] = i; });
            var sortKey = sortKeys[Math.abs(ord) - 1];
            var sign = ord > 0 ? 1 : -1;
            indices.sort(function (x, y) {
                var kx = sortKey(summaryRows[x]);
                var ky = sortKey(summaryRows[y]);
                return kx < ky ? -sign : kx > ky ? sign : prevIndex[x] - prevIndex[y];
            });
        };
        for (var _i = 0, currentSortOrder_1 = currentSortOrder; _i < currentSortOrder_1.length; _i++) {
            var ord = currentSortOrder_1[_i];
            _loop_1(ord);
        }
        $('#num-results').text(indices.length === 1 ? '1 map' : indices.length.toString() + ' maps');
        var truncate_num = show_full_result ? Infinity : 100;
        if (indices.length > truncate_num)
            indices.length = truncate_num;
        $('#hash-link-to-the-current-table').attr('href', currentHashLink);
        drawTable(indices);
    }
    function simplifySortOrder(order, _a) {
        var noTies = _a[0], defaultOrder = _a[1];
        var res = [];
        var seen = Array(sortKeys.length);
        for (var i = order.length - 1; i >= 0; --i) {
            var x = order[i];
            if (x === 0)
                continue;
            var key = Math.abs(x) - 1, sign = x > 0 ? 1 : -1;
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
    var summaryOrderConfig = [[0, 1, 2, 3, 4, 5, 9], -3];
    var rankingOrderConfig = [[0, 1, 7], 1];
    function setQueryAccordingToHash() {
        var obj;
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
        currentSortOrder = simplifySortOrder(obj.o.split('.').map(function (x) { return parseInt(x) || 0; }), summaryOrderConfig);
        setTableHeadSortingMark();
    }
    function setTableHeadSortingMark() {
        $('.sorted').removeClass('sorted ascending descending');
        var x = currentSortOrder.length === 0 ?
            -3 : // stars desc
            currentSortOrder[currentSortOrder.length - 1];
        var index = Math.abs(x) - 1;
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
    var rankAchievedClass = [
        'SSH', 'SH', 'SS', 'S', 'A',
        'B', 'C', 'D', 'F', '-'
    ];
    var beatmapInfoMapUsedVersion = MINIMUM_DATE;
    function initUnsortedTableRows() {
        if (summaryRows.length === 0)
            return false;
        if (unsortedTableRows.length !== 0 && beatmapInfoMapUsedVersion === beatmapInfoMapVersion)
            return false;
        beatmapInfoMapUsedVersion = beatmapInfoMapVersion;
        if (beatmapInfoMap.size !== 0) {
            summaryRows.forEach(function (row) {
                var info = beatmapInfoMap.get(row.beatmap_id_number);
                if (info)
                    row.info = info;
            });
        }
        var mode_icons = [
            'fa fa-exchange',
            '',
            'fa fa-tint',
            '',
        ];
        var approved_status_icons = [
            'fa fa-question',
            'fa fa-question',
            'fa fa-question',
            'fa fa-angle-double-right',
            'fa fa-fire',
            'fa fa-check',
            'fa fa-heart-o',
        ];
        unsortedTableRows = summaryRows.map(function (row) {
            return $('<tr>').append([
                [
                    $('<i>').addClass(approved_status_icons[row.approved_status + 2]),
                    document.createTextNode(row.approved_date_string.split(' ')[0])
                ],
                [
                    $('<i>').addClass(mode_icons[row.mode]),
                    $('<a>')
                        .attr('href', "https://osu.ppy.sh/b/" + row.beatmap_id + "?m=2")
                        .text(row.display_string),
                    row.beatmap_id_number > 0 ? $('<div class="float-right">').append([
                        $('<a><i class="fa fa-picture-o">')
                            .attr('href', "https://b.ppy.sh/thumb/" + row.beatmapset_id + ".jpg"),
                        $('<a><i class="fa fa-download">')
                            .attr('href', "https://osu.ppy.sh/d/" + row.beatmapset_id + "n"),
                        $('<a><i class="fa fa-cloud-download">')
                            .attr('href', "osu://dl/" + row.beatmapset_id)
                    ]) : $()
                ],
                row.stars.toFixed(2),
                row.pp.toFixed(0),
                Math.floor(row.hit_length / 60) + ":" + pad(Math.floor(row.hit_length % 60)),
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
            ].map(function (x) { return $('<td>').append(x); }))[0];
        });
        unsortedTableRowsChanged = true;
        return true;
    }
    function showErrorMessage(text) {
        $('#alerts').append($('<div class="alert alert-warning alert-dismissable">')
            .text(text)
            .append('<a class="close" data-dismiss="alert"><span>&times;'));
    }
    var LOCALSTORAGE_PREFIX = 'list-maps/';
    var localFiles = {};
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
    var registeredCallbackMap = new Map();
    function registerCallback(callback) {
        var id;
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        var worker = using || newWorker();
                        message.id = registerCallback(resolve);
                        worker.postMessage(message);
                        worker.addEventListener('message', function (event) {
                            var data = event.data;
                            if (data.type === 'callback' && typeof (data.id) === 'number') {
                                var callback = registeredCallbackMap.get(data.id);
                                if (callback) {
                                    registeredCallbackMap.delete(data.id);
                                    callback(data);
                                }
                            }
                        }, false);
                    })];
            });
        });
    }
    function compressBufferToString(buffer) {
        return __awaiter(this, void 0, void 0, function () {
            var compressed, chars, i, code, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, runWorker({
                            type: 'compress',
                            data: new Uint8Array(buffer)
                        })];
                    case 1:
                        compressed = (_a.sent()).data;
                        chars = new Array(Math.floor(compressed.length / 2));
                        for (i = 0; i < chars.length; i += 1) {
                            code = (compressed[i * 2 + 0] & 0xff) << 8 | (compressed[i * 2 + 1] & 0xff);
                            chars[i] = String.fromCharCode(code);
                        }
                        res = compressed.length % 2 ? '1' : '0';
                        res += chars.join('');
                        if (compressed.length % 2 !== 0)
                            res += String.fromCharCode((compressed[compressed.length - 1] & 0xff) << 8);
                        return [2 /*return*/, res];
                }
            });
        });
    }
    ListMaps.compressBufferToString = compressBufferToString;
    function decompressBufferFromString(str) {
        return __awaiter(this, void 0, void 0, function () {
            var parity, len, array, i, code, decompressed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        parity = str[0] === '1' ? 1 : 0;
                        len = str.length - 1 - parity;
                        array = new Uint8Array(len * 2 + parity);
                        for (i = 0; i < len; i += 1) {
                            code = str.charCodeAt(i + 1);
                            array[i * 2 + 0] = code >> 8;
                            array[i * 2 + 1] = code & 0xff;
                        }
                        if (parity !== 0)
                            array[len * 2] = str.charCodeAt(len + 1) >> 8;
                        return [4 /*yield*/, runWorker({
                                type: 'decompress',
                                data: array
                            })];
                    case 1:
                        decompressed = (_a.sent()).data;
                        return [2 /*return*/, decompressed];
                }
            });
        });
    }
    ListMaps.decompressBufferFromString = decompressBufferFromString;
    function reloadLocalFile(name) {
        var f = localFiles[name];
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
        return __awaiter(this, void 0, void 0, function () {
            var dateStr, encoded, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dateStr = localStorage.getItem(LOCALSTORAGE_PREFIX + name + '/uploaded-date');
                        if (!dateStr)
                            return [2 /*return*/];
                        encoded = localStorage.getItem(LOCALSTORAGE_PREFIX + name + '/data');
                        return [4 /*yield*/, decompressBufferFromString(encoded)];
                    case 1:
                        data = _a.sent();
                        console.log('file ' + name + ' loaded from localStorage');
                        localFiles[name] = {
                            data: data,
                            uploadedDate: new Date(dateStr)
                        };
                        return [2 /*return*/];
                }
            });
        });
    }
    function setLocalFile(name, file) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        var fr = new FileReader();
                        fr.onload = function (event) {
                            console.log('file ' + name + ' loaded');
                            var buffer = fr.result;
                            var uploadedDate = new Date();
                            localFiles[name] = {
                                data: new Uint8Array(buffer),
                                uploadedDate: uploadedDate,
                            };
                            reloadLocalFile(name);
                            compressBufferToString(buffer).then(function (dataStr) {
                                console.log('file ' + name + ' compressed');
                                var current = localFiles[name];
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
                    })];
            });
        });
    }
    var SerializationReader = /** @class */ (function () {
        function SerializationReader(buffer) {
            this.dv = new DataView(buffer);
            this.offset = 0;
        }
        SerializationReader.prototype.skip = function (bytes) {
            this.offset += bytes;
        };
        SerializationReader.prototype.readInt8 = function () {
            var result = this.dv.getInt8(this.offset);
            this.offset += 1;
            return result;
        };
        SerializationReader.prototype.readInt16 = function () {
            var result = this.dv.getInt16(this.offset, true);
            this.offset += 2;
            return result;
        };
        SerializationReader.prototype.readInt32 = function () {
            var result = this.dv.getInt32(this.offset, true);
            this.offset += 4;
            return result;
        };
        SerializationReader.prototype.readByte = function () {
            return this.readInt8() | 0;
        };
        SerializationReader.prototype.readUInt16 = function () {
            return this.readInt16() | 0;
        };
        SerializationReader.prototype.readUInt32 = function () {
            return this.readInt32() | 0;
        };
        SerializationReader.prototype.readBoolean = function () {
            return this.readInt8() !== 0;
        };
        SerializationReader.prototype.readULEB128 = function () {
            var result = 0;
            for (var shift = 0;; shift += 7) {
                var byte = this.dv.getUint8(this.offset);
                this.offset += 1;
                result |= (byte & 0x7f) << shift;
                if ((byte & 0x80) === 0)
                    return result;
            }
        };
        SerializationReader.prototype.readUint8Array = function (length) {
            var result = new Uint8Array(this.dv.buffer, this.offset, length);
            this.offset += length;
            return result;
        };
        SerializationReader.prototype.readString = function () {
            var header = this.readInt8();
            if (header === 0)
                return '';
            var length = this.readULEB128();
            var array = this.readUint8Array(length);
            return new TextDecoder('utf-8').decode(array);
        };
        SerializationReader.prototype.readInt64Rounded = function () {
            var lo = this.dv.getUint32(this.offset, true);
            var hi = this.dv.getUint32(this.offset + 4, true);
            this.offset += 8;
            return hi * 0x100000000 + lo;
        };
        SerializationReader.prototype.readDateTime = function () {
            // OFFSET = 621355968000000000 = ticks from 0001/1/1 to 1970/1/1
            var lo = this.readUInt32();
            var hi = this.readUInt32();
            lo -= 3444293632; // lo bits of OFFSET
            if (lo < 0) {
                lo += 4294967296; // 2^32
                hi -= 1;
            }
            hi -= 144670508; // hi bits of OFFSET
            var ticks = hi * 4294967296 + lo;
            return new Date(ticks * 1e-4);
        };
        SerializationReader.prototype.readSingle = function () {
            var result = this.dv.getFloat32(this.offset, true);
            this.offset += 4;
            return result;
        };
        SerializationReader.prototype.readDouble = function () {
            var result = this.dv.getFloat64(this.offset, true);
            this.offset += 8;
            return result;
        };
        SerializationReader.prototype.readList = function (callback) {
            var count = this.readInt32();
            for (var i = 0; i < count; i += 1)
                callback(i);
        };
        return SerializationReader;
    }());
    var BeatmapInfo = /** @class */ (function () {
        function BeatmapInfo(beatmapId, lastPlayed, rankAchieved) {
            this.beatmapId = beatmapId;
            this.lastPlayed = lastPlayed;
            this.rankAchieved = rankAchieved;
        }
        return BeatmapInfo;
    }());
    function readBeatmap(sr) {
        var SizeInBytes = sr.readInt32();
        var Artist = sr.readString();
        var ArtistUnicode = sr.readString();
        var Title = sr.readString();
        var TitleUnicode = sr.readString();
        var Creator = sr.readString();
        var Version = sr.readString();
        var AudioFilename = sr.readString();
        var BeatmapChecksum = sr.readString();
        var Filename = sr.readString();
        var SubmissionStatus = sr.readByte();
        var countNormal = sr.readUInt16();
        var countSlider = sr.readUInt16();
        var countSpinner = sr.readUInt16();
        var DateModified = sr.readDateTime();
        var DifficultyApproachRate = sr.readSingle();
        var DifficultyCircleSize = sr.readSingle();
        var DifficultyHpDrainRate = sr.readSingle();
        var DifficultyOverall = sr.readSingle();
        var DifficultySliderMultiplier = sr.readDouble();
        for (var i = 0; i < 4; i += 1) {
            sr.readList(function () {
                sr.readInt32();
                sr.readInt16();
                sr.readDouble();
            });
        }
        var DrainLength = sr.readInt32();
        var TotalLength = sr.readInt32();
        var PreviewTime = sr.readInt32();
        sr.readList(function () {
            var BeatLength = sr.readDouble();
            var Offset = sr.readDouble();
            var TimingChange = sr.readBoolean();
        });
        var BeatmapId = sr.readInt32();
        var BeatmapSetId = sr.readInt32();
        var BeatmapTopicId = sr.readInt32();
        var PlayerRankOsu = sr.readByte();
        var PlayerRankFruits = sr.readByte();
        var PlayerRankTaiko = sr.readByte();
        var PlayerRankMania = sr.readByte();
        var PlayerOffset = sr.readInt16();
        var StackLeniency = sr.readSingle();
        var PlayMode = sr.readByte();
        var Source = sr.readString();
        var Tags = sr.readString();
        var OnlineOffset = sr.readInt16();
        var OnlineDisplayTitle = sr.readString();
        var NewFile = sr.readBoolean();
        var DateLastPlayed = sr.readDateTime();
        var InOszContainer = sr.readBoolean();
        var ContainingFolderAbsolute = sr.readString();
        var LastInfoUpdate = sr.readDateTime();
        var DisableSamples = sr.readBoolean();
        var DisableSkin = sr.readBoolean();
        var DisableStoryboard = sr.readBoolean();
        var DisableVideo = sr.readBoolean();
        var VisualSettingsOverride = sr.readBoolean();
        var LastEditTime = sr.readInt32();
        var ManiaSpeed = sr.readByte();
        return new BeatmapInfo(BeatmapId, new Date(Math.max(MINIMUM_DATE.valueOf(), DateLastPlayed.valueOf())), PlayerRankFruits);
    }
    var beatmapInfoMap = new Map();
    var beatmapInfoMapVersion = MINIMUM_DATE;
    function loadOsuDB(buffer, version) {
        beatmapInfoMap.clear();
        var sr = new SerializationReader(buffer);
        sr.skip(4 + 4 + 1 + 8);
        sr.readString();
        var beatmapCount = sr.readInt32();
        for (var i = 0; i < beatmapCount; i += 1) {
            var beatmap = readBeatmap(sr);
            if (beatmap.beatmapId > 0)
                beatmapInfoMap.set(beatmap.beatmapId, beatmap);
        }
        beatmapInfoMapVersion = version;
    }
    function initTable(sortKeys, orderConfig, onSortOrderChanged) {
        var thList = $('#summary-table > thead > tr > th');
        sortKeys.forEach(function (_, index) {
            $.data(thList[index], 'thIndex', index);
        });
        thList.click(function (event) {
            var th = $(event.target);
            var sign;
            if (th.hasClass('sorted'))
                sign = th.hasClass('descending') ? 1 : -1;
            else
                sign = th.hasClass('desc-first') ? -1 : 1;
            var thIndex = th.data('thIndex');
            currentSortOrder.push((thIndex + 1) * sign);
            currentSortOrder = simplifySortOrder(currentSortOrder, orderConfig);
            setTableHeadSortingMark();
            onSortOrderChanged();
        });
    }
    function main() {
        var _this = this;
        Promise.all(['osu!.db', 'scores.db']
            .map(function (name) {
            return loadFromLocalStorage(name)
                .then(function () { return reloadLocalFile(name); });
        })).then(function () {
            if (initUnsortedTableRows())
                drawTableForCurrentFiltering();
        });
        setQueryAccordingToHash();
        window.addEventListener('hashchange', function () {
            setQueryAccordingToHash();
            drawTableForCurrentFiltering();
        });
        var onChange = function () {
            drawTableForCurrentFiltering();
        };
        for (var _i = 0, _a = ['filter-approved-status', 'filter-mode', 'filter-fc-level', 'filter-local-data', 'show-full-result']; _i < _a.length; _i++) {
            var id = _a[_i];
            $("#" + id).on('change', onChange);
        }
        for (var _b = 0, _c = ['filter-search-query']; _b < _c.length; _b++) {
            var id = _c[_b];
            $("#" + id).on('input', onChange);
        }
        initTable(sortKeys, summaryOrderConfig, onChange);
        var loadData = function (data, lastModified) {
            $('#last-update-time')
                .append($('<time>')
                .attr('datetime', lastModified.toISOString())
                .text(lastModified.toISOString().split('T')[0]));
            summaryRows = data.map(function (x) { return new SummaryRow(x); });
            initUnsortedTableRows();
            drawTableForCurrentFiltering();
            $('#summary-table-loader').hide();
        };
        $.getJSON('data/summary.json').then(function (data, _, xhr) {
            loadData(data, new Date(xhr.getResponseHeader('Last-Modified')));
        });
        $('#db-file-input').change(function (event) { return __awaiter(_this, void 0, void 0, function () {
            var elem, i, file, name_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        elem = event.target;
                        if (!elem.files)
                            return [2 /*return*/];
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < elem.files.length)) return [3 /*break*/, 8];
                        file = elem.files[i];
                        name_1 = file.name;
                        if (!(name_1.indexOf('osu!.db') !== -1)) return [3 /*break*/, 3];
                        return [4 /*yield*/, setLocalFile('osu!.db', file)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 3:
                        if (!(name_1.indexOf('scores.db') !== -1)) return [3 /*break*/, 5];
                        return [4 /*yield*/, setLocalFile('scores.db', file)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        showErrorMessage("Invalid file " + name_1 + ": Please select osu!.db or scores.db");
                        return [3 /*break*/, 7];
                    case 6:
                        if (initUnsortedTableRows())
                            drawTableForCurrentFiltering();
                        _a.label = 7;
                    case 7:
                        i += 1;
                        return [3 /*break*/, 1];
                    case 8:
                        elem.value = '';
                        return [2 /*return*/];
                }
            });
        }); });
    }
    function initUnsortedRankingTableRows() {
        if (rankingRows.length === 0)
            return false;
        unsortedTableRows = rankingRows.map(function (row) {
            return $('<tr>').append([
                row.rank.toString(),
                row.pp.toFixed(2),
                $('<a>').attr('href', "https://osu.ppy.sh/u/" + row.user_id).text(row.username),
                [
                    $('<a>')
                        .attr('href', "https://osu.ppy.sh/b/" + row.beatmap_id + "?m=2")
                        .text(row.display_string),
                    row.beatmap_id_number > 0 ? $('<div class="float-right">').append([
                        $('<a><i class="fa fa-picture-o">')
                            .attr('href', "https://b.ppy.sh/thumb/" + row.beatmapset_id + ".jpg"),
                        $('<a><i class="fa fa-download">')
                            .attr('href', "https://osu.ppy.sh/d/" + row.beatmapset_id + "n"),
                        $('<a><i class="fa fa-cloud-download">')
                            .attr('href', "osu://dl/" + row.beatmapset_id)
                    ]) : $()
                ],
                row.mods,
                row.accuracy.toFixed(2) + '%',
                row.combo_display,
                row.date_played_string,
            ].map(function (x) { return $('<td>').append(x); }))[0];
        });
        unsortedTableRowsChanged = true;
        return true;
    }
    var rankingSortKeys = [
        function (x) { return x.rank; },
        function (x) { return x.pp; },
        function (x) { return x.username_lower; },
        function (x) { return x.display_string_lower; },
        function (x) { return x.mods; },
        function (x) { return x.accuracy; },
        function (x) { return x.combo_display; },
        function (x) { return x.date_played_string; },
    ];
    function drawRankingTable() {
        var indices = rankingRows.map(function (_row, i) { return i; });
        var prevIndex = Array(rankingRows.length);
        var _loop_2 = function (ord) {
            if (ord === 0)
                return "continue";
            indices.forEach(function (x, i) { return prevIndex[x] = i; });
            var sortKey = rankingSortKeys[Math.abs(ord) - 1];
            var sign = ord > 0 ? 1 : -1;
            indices.sort(function (x, y) {
                var kx = sortKey(rankingRows[x]);
                var ky = sortKey(rankingRows[y]);
                return kx < ky ? -sign : kx > ky ? sign : prevIndex[x] - prevIndex[y];
            });
        };
        for (var _i = 0, currentSortOrder_2 = currentSortOrder; _i < currentSortOrder_2.length; _i++) {
            var ord = currentSortOrder_2[_i];
            _loop_2(ord);
        }
        drawTable(indices);
    }
    function rankingMain() {
        initTable(rankingSortKeys, rankingOrderConfig, drawRankingTable);
        var loadData = function (data, lastModified) {
            $('#last-update-time')
                .append($('<time>')
                .attr('datetime', lastModified.toISOString())
                .text(lastModified.toISOString().split('T')[0]));
            rankingRows = data.map(function (x, i) { return new RankingRow(i + 1, x); });
            initUnsortedRankingTableRows();
            drawRankingTable();
            $('#summary-table-loader').hide();
        };
        $.getJSON('data/ranking.json').then(function (data, _, xhr) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1tYXBzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpc3QtbWFwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFVLFFBQVEsQ0E0OUJqQjtBQTU5QkQsV0FBVSxRQUFRO0lBZWxCLElBQU0sWUFBWSxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pDO1FBd0JJLG9CQUE2QixJQUFvQjtZQUFwQixTQUFJLEdBQUosSUFBSSxDQUFnQjtZQUV6Qyw4QkFBb0IsRUFDcEIsbUNBQXlCLEVBQ3pCLG1CQUFTLEVBQ1QseUJBQWUsRUFDZiw0QkFBa0IsRUFDbEIsNkJBQW1CLEVBQ25CLG9CQUFVLEVBQ1YsaUJBQU8sRUFDUCx5QkFBZSxFQUNmLHdCQUFjLEVBQ2QsNkJBQWtCLEVBQ2xCLDJCQUFnQixFQUNoQiwwQkFBZSxFQUNmLG9CQUFTLEVBQ1Qsb0JBQVMsRUFDVCxvQkFBUyxFQUNULHNCQUFXLEVBQ1gsb0JBQVMsRUFDVCxzQkFBVyxDQUNOO1lBQ1QsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQztZQUN0RixJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM5RCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNyQixDQUFDO1FBQ0wsaUJBQUM7SUFBRCxDQUFDLEFBbkRELElBbURDO0lBTUQ7UUFlSSxvQkFBNEIsSUFBWSxFQUFtQixJQUFvQjtZQUFuRCxTQUFJLEdBQUosSUFBSSxDQUFRO1lBQW1CLFNB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QVIsUUFBUSxRQTQ5QmpCIiwic291cmNlc0NvbnRlbnQiOlsibmFtZXNwYWNlIExpc3RNYXBzIHtcblxuaW50ZXJmYWNlIEpRdWVyeSB7XG4gICAgdGFibGVzb3J0KCk6IHZvaWQ7XG4gICAgZGF0YShrZXk6ICdzb3J0QnknLCBrZXlGdW5jOiAoXG4gICAgICAgIHRoOiBIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudCxcbiAgICAgICAgdGQ6IEhUTUxUYWJsZURhdGFDZWxsRWxlbWVudCxcbiAgICAgICAgdGFibGVzb3J0OiBhbnkpID0+IHZvaWQpOiB0aGlzO1xufVxuXG50eXBlIFN1bW1hcnlSb3dEYXRhID1cbltcbiAgICBudW1iZXIsIHN0cmluZywgbnVtYmVyLCBzdHJpbmcsIHN0cmluZywgc3RyaW5nLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLFxuICAgIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyXG5dO1xuY29uc3QgTUlOSU1VTV9EQVRFID0gbmV3IERhdGUoMCk7XG5jbGFzcyBTdW1tYXJ5Um93IHtcbiAgICBhcHByb3ZlZF9zdGF0dXM6IG51bWJlcjtcbiAgICBhcHByb3ZlZF9kYXRlX3N0cmluZzogc3RyaW5nO1xuICAgIGFwcHJvdmVkX2RhdGU6IERhdGU7XG4gICAgbW9kZTogbnVtYmVyO1xuICAgIGJlYXRtYXBfaWQ6IHN0cmluZztcbiAgICBiZWF0bWFwX2lkX251bWJlcjogbnVtYmVyO1xuICAgIGJlYXRtYXBzZXRfaWQ6IHN0cmluZztcbiAgICBkaXNwbGF5X3N0cmluZzogc3RyaW5nO1xuICAgIGRpc3BsYXlfc3RyaW5nX2xvd2VyOiBzdHJpbmc7XG4gICAgc3RhcnM6IG51bWJlcjtcbiAgICBwcDogbnVtYmVyO1xuICAgIGhpdF9sZW5ndGg6IG51bWJlcjtcbiAgICBtYXhfY29tYm86IG51bWJlcjtcbiAgICBhcHByb2FjaF9yYXRlOiBudW1iZXI7XG4gICAgY2lyY2xlX3NpemU6IG51bWJlcjtcbiAgICBtaW5fbWlzc2VzOiBudW1iZXI7XG4gICAgZmNOTTogbnVtYmVyO1xuICAgIGZjSEQ6IG51bWJlcjtcbiAgICBmY0hSOiBudW1iZXI7XG4gICAgZmNIREhSOiBudW1iZXI7XG4gICAgZmNEVDogbnVtYmVyO1xuICAgIGZjSEREVDogbnVtYmVyO1xuICAgIGluZm86IEJlYXRtYXBJbmZvIHwgbnVsbDtcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGRhdGE6IFN1bW1hcnlSb3dEYXRhKSB7XG4gICAgICAgIFtcbiAgICAgICAgICAgIHRoaXMuYXBwcm92ZWRfc3RhdHVzLFxuICAgICAgICAgICAgdGhpcy5hcHByb3ZlZF9kYXRlX3N0cmluZyxcbiAgICAgICAgICAgIHRoaXMubW9kZSxcbiAgICAgICAgICAgIHRoaXMuYmVhdG1hcF9pZCxcbiAgICAgICAgICAgIHRoaXMuYmVhdG1hcHNldF9pZCxcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheV9zdHJpbmcsXG4gICAgICAgICAgICB0aGlzLnN0YXJzLFxuICAgICAgICAgICAgdGhpcy5wcCxcbiAgICAgICAgICAgIHRoaXMuaGl0X2xlbmd0aCxcbiAgICAgICAgICAgIHRoaXMubWF4X2NvbWJvLFxuICAgICAgICAgICAgdGhpcy5hcHByb2FjaF9yYXRlLFxuICAgICAgICAgICAgdGhpcy5jaXJjbGVfc2l6ZSxcbiAgICAgICAgICAgIHRoaXMubWluX21pc3NlcyxcbiAgICAgICAgICAgIHRoaXMuZmNOTSxcbiAgICAgICAgICAgIHRoaXMuZmNIRCxcbiAgICAgICAgICAgIHRoaXMuZmNIUixcbiAgICAgICAgICAgIHRoaXMuZmNIREhSLFxuICAgICAgICAgICAgdGhpcy5mY0RULFxuICAgICAgICAgICAgdGhpcy5mY0hERFQsXG4gICAgICAgIF0gPSBkYXRhO1xuICAgICAgICB0aGlzLmJlYXRtYXBfaWRfbnVtYmVyID0gcGFyc2VJbnQodGhpcy5iZWF0bWFwX2lkKTtcbiAgICAgICAgdGhpcy5hcHByb3ZlZF9kYXRlID0gbmV3IERhdGUodGhpcy5hcHByb3ZlZF9kYXRlX3N0cmluZy5yZXBsYWNlKCcgJywgJ1QnKSArICcrMDg6MDAnKTtcbiAgICAgICAgdGhpcy5kaXNwbGF5X3N0cmluZ19sb3dlciA9IHRoaXMuZGlzcGxheV9zdHJpbmcudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgdGhpcy5pbmZvID0gbnVsbDtcbiAgICB9XG59XG5cbnR5cGUgUmFua2luZ1Jvd0RhdGEgPVxuW1xuICAgIG51bWJlciwgbnVtYmVyLCBzdHJpbmcsIHN0cmluZywgc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgc3RyaW5nLCBudW1iZXIsIHN0cmluZywgc3RyaW5nXG5dO1xuY2xhc3MgUmFua2luZ1JvdyB7XG4gICAgc3RhcnM6IG51bWJlcjtcbiAgICBwcDogbnVtYmVyO1xuICAgIHVzZXJfaWQ6IHN0cmluZztcbiAgICB1c2VybmFtZTogc3RyaW5nO1xuICAgIHVzZXJuYW1lX2xvd2VyOiBzdHJpbmc7XG4gICAgYmVhdG1hcF9pZDogc3RyaW5nO1xuICAgIGJlYXRtYXBfaWRfbnVtYmVyOiBudW1iZXI7XG4gICAgYmVhdG1hcHNldF9pZDogc3RyaW5nO1xuICAgIGRpc3BsYXlfc3RyaW5nOiBzdHJpbmc7XG4gICAgZGlzcGxheV9zdHJpbmdfbG93ZXI6IHN0cmluZztcbiAgICBtb2RzOiBzdHJpbmc7XG4gICAgYWNjdXJhY3k6IG51bWJlcjtcbiAgICBjb21ib19kaXNwbGF5OiBzdHJpbmc7XG4gICAgZGF0ZV9wbGF5ZWRfc3RyaW5nOiBzdHJpbmc7XG4gICAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IHJhbms6IG51bWJlciwgcHJpdmF0ZSByZWFkb25seSBkYXRhOiBSYW5raW5nUm93RGF0YSkge1xuICAgICAgICBbXG4gICAgICAgICAgICB0aGlzLnN0YXJzLFxuICAgICAgICAgICAgdGhpcy5wcCxcbiAgICAgICAgICAgIHRoaXMudXNlcl9pZCxcbiAgICAgICAgICAgIHRoaXMudXNlcm5hbWUsXG4gICAgICAgICAgICB0aGlzLmJlYXRtYXBfaWQsXG4gICAgICAgICAgICB0aGlzLmJlYXRtYXBzZXRfaWQsXG4gICAgICAgICAgICB0aGlzLmRpc3BsYXlfc3RyaW5nLFxuICAgICAgICAgICAgdGhpcy5tb2RzLFxuICAgICAgICAgICAgdGhpcy5hY2N1cmFjeSxcbiAgICAgICAgICAgIHRoaXMuY29tYm9fZGlzcGxheSxcbiAgICAgICAgICAgIHRoaXMuZGF0ZV9wbGF5ZWRfc3RyaW5nXG4gICAgICAgIF0gPSBkYXRhO1xuICAgICAgICB0aGlzLmJlYXRtYXBfaWRfbnVtYmVyID0gcGFyc2VJbnQodGhpcy5iZWF0bWFwX2lkKTtcbiAgICAgICAgdGhpcy51c2VybmFtZV9sb3dlciA9IHRoaXMudXNlcm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgdGhpcy5kaXNwbGF5X3N0cmluZ19sb3dlciA9IHRoaXMuZGlzcGxheV9zdHJpbmcudG9Mb3dlckNhc2UoKTtcbiAgICB9XG59XG5cblxubGV0IHN1bW1hcnlSb3dzOiBTdW1tYXJ5Um93W10gPSBbXTtcbmxldCByYW5raW5nUm93czogUmFua2luZ1Jvd1tdID0gW107XG5sZXQgdW5zb3J0ZWRUYWJsZVJvd3M6IEhUTUxUYWJsZVJvd0VsZW1lbnRbXSA9IFtdO1xubGV0IGN1cnJlbnRTb3J0T3JkZXI6IG51bWJlcltdID0gW107XG5sZXQgY3VycmVudEhhc2hMaW5rID0gJyMnO1xuXG5sZXQgcHJldmlvdXNJbmRpY2VzID0gJyc7XG5sZXQgdW5zb3J0ZWRUYWJsZVJvd3NDaGFuZ2VkID0gZmFsc2U7XG5mdW5jdGlvbiBkcmF3VGFibGUoaW5kaWNlczogbnVtYmVyW10pIHtcbiAgICBjb25zdCBzdHIgPSBpbmRpY2VzLmpvaW4oJywnKTtcbiAgICBpZiAoIXVuc29ydGVkVGFibGVSb3dzQ2hhbmdlZCAmJiBwcmV2aW91c0luZGljZXMgPT09IHN0cikgcmV0dXJuO1xuICAgIHVuc29ydGVkVGFibGVSb3dzQ2hhbmdlZCA9IGZhbHNlO1xuICAgIHByZXZpb3VzSW5kaWNlcyA9IHN0cjtcbiAgICAkKCcjc3VtbWFyeS10YWJsZSA+IHRib2R5JylcbiAgICAgICAgLmVtcHR5KClcbiAgICAgICAgLmFwcGVuZChpbmRpY2VzLm1hcChpbmRleCA9PiB1bnNvcnRlZFRhYmxlUm93c1tpbmRleF0pKTtcbn1cblxuY2xhc3MgU2VhcmNoUXVlcnkge1xuICAgIHB1YmxpYyByZWFkb25seSBjaGVjazogKHJvdzogU3VtbWFyeVJvdykgPT4gYm9vbGVhbjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgbm9ybWFsaXplZF9zb3VyY2U6IHN0cmluZztcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgc291cmNlOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3Qga2V5X3RvX3Byb3BlcnR5X25hbWUgPSB7XG4gICAgICAgICAgICAnc3RhdHVzJzogJ1wicHBwcmFxbFwiW3Jvdy5hcHByb3ZlZF9zdGF0dXMrMl0nLFxuICAgICAgICAgICAgJ21vZGUnOiAnXCJvdGNtXCJbcm93Lm1vZGVdJyxcbiAgICAgICAgICAgICdzdGFycyc6ICdyb3cuc3RhcnMnLFxuICAgICAgICAgICAgJ3BwJzogJ3Jvdy5wcCcsXG4gICAgICAgICAgICAnbGVuZ3RoJzogJ3Jvdy5oaXRfbGVuZ3RoJyxcbiAgICAgICAgICAgICdjb21ibyc6ICdyb3cubWF4X2NvbWJvJyxcbiAgICAgICAgICAgICdhcic6ICdyb3cuYXBwcm9hY2hfcmF0ZScsXG4gICAgICAgICAgICAnY3MnOiAncm93LmNpcmNsZV9zaXplJyxcbiAgICAgICAgICAgICdwbGF5ZWQnOiBgKCFyb3cuaW5mbz9JbmZpbml0eTooJHtuZXcgRGF0ZSgpLnZhbHVlT2YoKX0tcm93LmluZm8ubGFzdFBsYXllZC52YWx1ZU9mKCkpLyR7MWUzICogNjAgKiA2MCAqIDI0fSlgLFxuICAgICAgICAgICAgJ3VucGxheWVkJzogYChyb3cuaW5mbyYmcm93LmluZm8ubGFzdFBsYXllZC52YWx1ZU9mKCkhPT0ke01JTklNVU1fREFURS52YWx1ZU9mKCl9Pyd5JzonJylgLFxuICAgICAgICAgICAgJ2RhdGUnOiBgKCR7bmV3IERhdGUoKS52YWx1ZU9mKCl9LXJvdy5hcHByb3ZlZF9kYXRlLnZhbHVlT2YoKSkvJHsxZTMgKiA2MCAqIDYwICogMjR9YCxcbiAgICAgICAgICAgICdyYW5rJzogYCgke0pTT04uc3RyaW5naWZ5KHJhbmtBY2hpZXZlZENsYXNzKX1bIXJvdy5pbmZvPzk6cm93LmluZm8ucmFua0FjaGlldmVkXSkudG9Mb3dlckNhc2UoKWBcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcmVnZXhwID0gbmV3IFJlZ0V4cChgKCR7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhrZXlfdG9fcHJvcGVydHlfbmFtZSkuam9pbignfCcpXG4gICAgICAgIH0pKDw9P3w+PT98PXwhPSkoWy1cXFxcd1xcXFwuXSopYCk7XG4gICAgICAgIGxldCBjaGVja19mdW5jX3NvdXJjZSA9ICdyZXR1cm4gdHJ1ZSc7XG4gICAgICAgIHRoaXMubm9ybWFsaXplZF9zb3VyY2UgPSAnJztcbiAgICAgICAgZm9yIChjb25zdCB0b2tlbiBvZiBzb3VyY2Uuc3BsaXQoJyAnKSkge1xuICAgICAgICAgICAgY29uc3QgdHJpbW1lZCA9IHRva2VuLnRyaW0oKTtcbiAgICAgICAgICAgIGlmICh0cmltbWVkID09PSAnJykgY29udGludWU7XG4gICAgICAgICAgICBjb25zdCBtYXRjaCA9IHJlZ2V4cC5leGVjKHRyaW1tZWQpO1xuICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qga2V5ID0gbWF0Y2hbMV07XG4gICAgICAgICAgICAgICAgY29uc3QgcmVsID0gbWF0Y2hbMl0gPT09ICc9JyA/ICc9PScgOiBtYXRjaFsyXTtcbiAgICAgICAgICAgICAgICBsZXQgdmFsOiBudW1iZXIgfCBzdHJpbmcgPSBwYXJzZUZsb2F0KG1hdGNoWzNdKTtcbiAgICAgICAgICAgICAgICBpZiAoaXNOYU4odmFsKSlcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gbWF0Y2hbM10udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wID0gKGtleV90b19wcm9wZXJ0eV9uYW1lIGFzIGFueSlba2V5XTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ub3JtYWxpemVkX3NvdXJjZSAhPT0gJycpIHRoaXMubm9ybWFsaXplZF9zb3VyY2UgKz0gJyAnO1xuICAgICAgICAgICAgICAgIHRoaXMubm9ybWFsaXplZF9zb3VyY2UgKz0gbWF0Y2hbMV0gKyBtYXRjaFsyXSArIG1hdGNoWzNdO1xuICAgICAgICAgICAgICAgIGNoZWNrX2Z1bmNfc291cmNlICs9IGAmJiR7cHJvcH0ke3JlbH0ke0pTT04uc3RyaW5naWZ5KHZhbCl9YDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RyID0gdHJpbW1lZC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVzY2FwZWQgPSBKU09OLnN0cmluZ2lmeShzdHIpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5vcm1hbGl6ZWRfc291cmNlICE9PSAnJykgdGhpcy5ub3JtYWxpemVkX3NvdXJjZSArPSAnICc7XG4gICAgICAgICAgICAgICAgdGhpcy5ub3JtYWxpemVkX3NvdXJjZSArPSBzdHI7XG4gICAgICAgICAgICAgICAgY2hlY2tfZnVuY19zb3VyY2UgKz0gYCYmcm93LmRpc3BsYXlfc3RyaW5nX2xvd2VyLmluZGV4T2YoJHtlc2NhcGVkfSkhPT0tMWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jaGVjayA9IG5ldyBGdW5jdGlvbigncm93JywgY2hlY2tfZnVuY19zb3VyY2UpIGFzIGFueTtcbiAgICB9XG59XG5cbmNvbnN0IHNvcnRLZXlzID0gW1xuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LmFwcHJvdmVkX2RhdGVfc3RyaW5nLFxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LmRpc3BsYXlfc3RyaW5nX2xvd2VyLFxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LnN0YXJzLFxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LnBwLFxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LmhpdF9sZW5ndGgsXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHgubWF4X2NvbWJvLFxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LmFwcHJvYWNoX3JhdGUsXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHguY2lyY2xlX3NpemUsXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+XG4gICAgICAgIHguZmNIRERUICogMiArIHguZmNEVCAqIDFlOCArXG4gICAgICAgIHguZmNIREhSICogMiArIHguZmNIUiAqIDFlNCArXG4gICAgICAgIHguZmNIRCAqIDIgKyB4LmZjTk0gLVxuICAgICAgICB4Lm1pbl9taXNzZXMsXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+ICF4LmluZm8gPyBNSU5JTVVNX0RBVEUudmFsdWVPZigpIDogeC5pbmZvLmxhc3RQbGF5ZWQudmFsdWVPZigpXG5dO1xuXG5mdW5jdGlvbiBzdHJpbmdpZnlPYmplY3Qob2JqOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZzsgfSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iailcbiAgICAgICAgLm1hcChrID0+IGsgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQob2JqW2tdKSlcbiAgICAgICAgLmpvaW4oJyYnKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VPYmplY3Qoc3RyOiBzdHJpbmcpIHtcbiAgICBjb25zdCByZXMgPSB7fTtcbiAgICBzdHIuc3BsaXQoJyYnKS5mb3JFYWNoKHBhcnQgPT4ge1xuICAgICAgICBjb25zdCBtYXRjaCA9IHBhcnQubWF0Y2goLyhcXHcrKT0oLispLyk7XG4gICAgICAgIGlmIChtYXRjaClcbiAgICAgICAgICAgIChyZXMgYXMgYW55KVttYXRjaFsxXV0gPSBkZWNvZGVVUklDb21wb25lbnQobWF0Y2hbMl0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIGRyYXdUYWJsZUZvckN1cnJlbnRGaWx0ZXJpbmcoKSB7XG4gICAgY29uc3QgZmlsdGVyX2FwcHJvdmVkX3N0YXR1cyA9IHBhcnNlSW50KCQoJyNmaWx0ZXItYXBwcm92ZWQtc3RhdHVzJykudmFsKCkgYXMgc3RyaW5nKTtcbiAgICBjb25zdCBmaWx0ZXJfbW9kZSA9IHBhcnNlSW50KCQoJyNmaWx0ZXItbW9kZScpLnZhbCgpIGFzIHN0cmluZyk7XG4gICAgY29uc3QgZmlsdGVyX3NlYXJjaF9xdWVyeSA9IG5ldyBTZWFyY2hRdWVyeSgoJCgnI2ZpbHRlci1zZWFyY2gtcXVlcnknKS52YWwoKSBhcyBzdHJpbmcpKTtcbiAgICBjb25zdCBmaWx0ZXJfZmNfbGV2ZWwgPSBwYXJzZUludCgkKCcjZmlsdGVyLWZjLWxldmVsJykudmFsKCkgYXMgc3RyaW5nKTtcbiAgICBjb25zdCBmaWx0ZXJfbG9jYWxfZGF0YSA9IHBhcnNlSW50KCQoJyNmaWx0ZXItbG9jYWwtZGF0YScpLnZhbCgpIGFzIHN0cmluZyk7XG4gICAgY29uc3Qgc2hvd19mdWxsX3Jlc3VsdCA9ICQoJyNzaG93LWZ1bGwtcmVzdWx0JykucHJvcCgnY2hlY2tlZCcpO1xuXG4gICAgY29uc3QgZ2V0X2ZjX2xldmVsID0gKHJvdzogU3VtbWFyeVJvdykgPT4ge1xuICAgICAgICBpZiAocm93Lm1pbl9taXNzZXMgIT09IDApIHJldHVybiAxO1xuICAgICAgICBpZiAocm93LmZjRFQgIT09IDAgfHwgcm93LmZjSEREVCAhPT0gMCkgcmV0dXJuIDg7XG4gICAgICAgIGlmIChyb3cuZmNOTSA9PT0gMCAmJiByb3cuZmNIRCA9PT0gMCAmJiByb3cuZmNIUiA9PT0gMCAmJiByb3cuZmNIREhSID09PSAwKSByZXR1cm4gMjtcbiAgICAgICAgaWYgKHJvdy5mY05NID09PSAwICYmIHJvdy5mY0hEID09PSAwKSByZXR1cm4gMztcbiAgICAgICAgaWYgKHJvdy5mY0hEID09PSAwKSByZXR1cm4gNDtcbiAgICAgICAgaWYgKHJvdy5mY0hSID09PSAwICYmIHJvdy5mY0hESFIgPT09IDApIHJldHVybiA1O1xuICAgICAgICBpZiAocm93LmZjSERIUiA9PT0gMCkgcmV0dXJuIDY7XG4gICAgICAgIHJldHVybiA3O1xuICAgIH07XG5cbiAgICBjb25zdCBnZXRfbG9jYWxfZGF0YV9mbGFncyA9IChyb3c6IFN1bW1hcnlSb3cpOiBudW1iZXIgPT4ge1xuICAgICAgICBpZiAoYmVhdG1hcEluZm9NYXAuc2l6ZSA9PT0gMCkgcmV0dXJuIC0xO1xuICAgICAgICBsZXQgZmxhZ3MgPSAwO1xuICAgICAgICBjb25zdCBpbmZvID0gYmVhdG1hcEluZm9NYXAuZ2V0KHJvdy5iZWF0bWFwX2lkX251bWJlcik7XG4gICAgICAgIGlmICghaW5mbykgcmV0dXJuIDA7XG4gICAgICAgIGZsYWdzIHw9IDI7XG4gICAgICAgIGlmIChpbmZvLmxhc3RQbGF5ZWQudmFsdWVPZigpICE9PSBNSU5JTVVNX0RBVEUudmFsdWVPZigpKVxuICAgICAgICAgICAgZmxhZ3MgfD0gMTtcbiAgICAgICAgcmV0dXJuIGZsYWdzO1xuICAgIH07XG5cbiAgICBjdXJyZW50SGFzaExpbmsgPSAnIyc7XG4gICAgY29uc3Qgb2JqID0ge30gYXMgeyBba2V5OiBzdHJpbmddOiBzdHJpbmc7IH07XG4gICAgaWYgKGZpbHRlcl9hcHByb3ZlZF9zdGF0dXMgIT09IDEpXG4gICAgICAgIG9iai5zID0gZmlsdGVyX2FwcHJvdmVkX3N0YXR1cy50b1N0cmluZygpO1xuICAgIGlmIChmaWx0ZXJfbW9kZSAhPT0gMylcbiAgICAgICAgb2JqLm0gPSBmaWx0ZXJfbW9kZS50b1N0cmluZygpO1xuICAgIGlmIChmaWx0ZXJfc2VhcmNoX3F1ZXJ5Lm5vcm1hbGl6ZWRfc291cmNlICE9PSAnJylcbiAgICAgICAgb2JqLnEgPSBmaWx0ZXJfc2VhcmNoX3F1ZXJ5Lm5vcm1hbGl6ZWRfc291cmNlO1xuICAgIGlmIChmaWx0ZXJfZmNfbGV2ZWwgIT09IDApXG4gICAgICAgIG9iai5sID0gZmlsdGVyX2ZjX2xldmVsLnRvU3RyaW5nKCk7XG4gICAgaWYgKGZpbHRlcl9sb2NhbF9kYXRhICE9PSAwKVxuICAgICAgICBvYmouZCA9IGZpbHRlcl9sb2NhbF9kYXRhLnRvU3RyaW5nKCk7XG4gICAgaWYgKGN1cnJlbnRTb3J0T3JkZXIubGVuZ3RoICE9PSAwKVxuICAgICAgICBvYmoubyA9IGN1cnJlbnRTb3J0T3JkZXIuam9pbignLicpO1xuICAgIGlmIChzaG93X2Z1bGxfcmVzdWx0KVxuICAgICAgICBvYmouZiA9ICcxJztcblxuICAgIGN1cnJlbnRIYXNoTGluayArPSBzdHJpbmdpZnlPYmplY3Qob2JqKTtcbiAgICBoaXN0b3J5LnJlcGxhY2VTdGF0ZSh7fSwgZG9jdW1lbnQudGl0bGUsIGxvY2F0aW9uLnBhdGhuYW1lICsgKGN1cnJlbnRIYXNoTGluayA9PT0gJyMnID8gJycgOiBjdXJyZW50SGFzaExpbmspKTtcblxuICAgIGNvbnN0IGluZGljZXMgPSBzdW1tYXJ5Um93cy5tYXAoKF8sIGluZGV4KSA9PiBpbmRleCkuZmlsdGVyKGluZGV4ID0+IHtcbiAgICAgICAgY29uc3Qgcm93ID0gc3VtbWFyeVJvd3NbaW5kZXhdO1xuXG4gICAgICAgIGlmIChmaWx0ZXJfYXBwcm92ZWRfc3RhdHVzID09PSAxICYmXG4gICAgICAgICAgICAocm93LmFwcHJvdmVkX3N0YXR1cyAhPT0gMSAmJiByb3cuYXBwcm92ZWRfc3RhdHVzICE9PSAyKSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKGZpbHRlcl9hcHByb3ZlZF9zdGF0dXMgPT09IDIgJiYgcm93LmFwcHJvdmVkX3N0YXR1cyAhPT0gNClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICBpZiAoZmlsdGVyX21vZGUgPT09IDEgJiYgcm93Lm1vZGUgIT09IDApXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmIChmaWx0ZXJfbW9kZSA9PT0gMiAmJiByb3cubW9kZSAhPT0gMilcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICBpZiAoIWZpbHRlcl9zZWFyY2hfcXVlcnkuY2hlY2socm93KSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICBpZiAoZmlsdGVyX2ZjX2xldmVsICE9PSAwICYmIGdldF9mY19sZXZlbChyb3cpICE9PSBmaWx0ZXJfZmNfbGV2ZWwpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgaWYgKGZpbHRlcl9sb2NhbF9kYXRhICE9PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBmbGFncyA9IGdldF9sb2NhbF9kYXRhX2ZsYWdzKHJvdyk7XG4gICAgICAgICAgICBzd2l0Y2ggKGZpbHRlcl9sb2NhbF9kYXRhKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAxOiBpZiAoKGZsYWdzICYgMSkgIT09IDApIHJldHVybiBmYWxzZTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAyOiBpZiAoKGZsYWdzICYgMSkgPT09IDApIHJldHVybiBmYWxzZTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAzOiBpZiAoKGZsYWdzICYgMikgIT09IDApIHJldHVybiBmYWxzZTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA0OiBpZiAoKGZsYWdzICYgMikgPT09IDApIHJldHVybiBmYWxzZTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA1OiBpZiAoKGZsYWdzICYgMykgIT09IDIpIHJldHVybiBmYWxzZTsgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHByZXZJbmRleCA9IEFycmF5KHN1bW1hcnlSb3dzLmxlbmd0aCk7XG4gICAgZm9yIChjb25zdCBvcmQgb2YgY3VycmVudFNvcnRPcmRlcikge1xuICAgICAgICBpZiAob3JkID09PSAwKSBjb250aW51ZTtcbiAgICAgICAgaW5kaWNlcy5mb3JFYWNoKCh4LCBpKSA9PiBwcmV2SW5kZXhbeF0gPSBpKTtcbiAgICAgICAgY29uc3Qgc29ydEtleSA9IHNvcnRLZXlzW01hdGguYWJzKG9yZCkgLSAxXTtcbiAgICAgICAgY29uc3Qgc2lnbiA9IG9yZCA+IDAgPyAxIDogLTE7XG4gICAgICAgIGluZGljZXMuc29ydCgoeCwgeSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qga3ggPSBzb3J0S2V5KHN1bW1hcnlSb3dzW3hdKTtcbiAgICAgICAgICAgIGNvbnN0IGt5ID0gc29ydEtleShzdW1tYXJ5Um93c1t5XSk7XG4gICAgICAgICAgICByZXR1cm4ga3ggPCBreSA/IC1zaWduIDoga3ggPiBreSA/IHNpZ24gOiBwcmV2SW5kZXhbeF0gLSBwcmV2SW5kZXhbeV07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgICQoJyNudW0tcmVzdWx0cycpLnRleHQoaW5kaWNlcy5sZW5ndGggPT09IDEgPyAnMSBtYXAnIDogaW5kaWNlcy5sZW5ndGgudG9TdHJpbmcoKSArICcgbWFwcycpO1xuICAgIGNvbnN0IHRydW5jYXRlX251bSA9IHNob3dfZnVsbF9yZXN1bHQgPyBJbmZpbml0eSA6IDEwMDtcbiAgICBpZiAoaW5kaWNlcy5sZW5ndGggPiB0cnVuY2F0ZV9udW0pXG4gICAgICAgIGluZGljZXMubGVuZ3RoID0gdHJ1bmNhdGVfbnVtO1xuXG4gICAgJCgnI2hhc2gtbGluay10by10aGUtY3VycmVudC10YWJsZScpLmF0dHIoJ2hyZWYnLCBjdXJyZW50SGFzaExpbmspO1xuXG4gICAgZHJhd1RhYmxlKGluZGljZXMpO1xufVxuXG5mdW5jdGlvbiBzaW1wbGlmeVNvcnRPcmRlcihvcmRlcjogbnVtYmVyW10sIFtub1RpZXMsIGRlZmF1bHRPcmRlcl06IFtudW1iZXJbXSwgbnVtYmVyXSk6IG51bWJlcltdIHtcbiAgICBjb25zdCByZXMgPSBbXTtcbiAgICBjb25zdCBzZWVuID0gQXJyYXkoc29ydEtleXMubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gb3JkZXIubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLSBpKSB7XG4gICAgICAgIGNvbnN0IHggPSBvcmRlcltpXTtcbiAgICAgICAgaWYgKHggPT09IDApIGNvbnRpbnVlO1xuICAgICAgICBjb25zdCBrZXkgPSBNYXRoLmFicyh4KSAtIDEsIHNpZ24gPSB4ID4gMCA/IDEgOiAtMTtcbiAgICAgICAgaWYgKHNlZW5ba2V5XSkgY29udGludWU7XG4gICAgICAgIHNlZW5ba2V5XSA9IHNpZ247XG4gICAgICAgIHJlcy5wdXNoKHgpO1xuICAgICAgICBpZiAobm9UaWVzLmluZGV4T2Yoa2V5KSAhPT0gLTEpIC8vIHRoZXJlIGlzIGFsbW9zdCBubyB0aWVzXG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKHJlcy5sZW5ndGggIT09IDAgJiYgcmVzW3Jlcy5sZW5ndGggLSAxXSA9PT0gZGVmYXVsdE9yZGVyKVxuICAgICAgICByZXMucG9wKCk7XG4gICAgcmVzLnJldmVyc2UoKTtcbiAgICByZXR1cm4gcmVzO1xufVxuXG5jb25zdCBzdW1tYXJ5T3JkZXJDb25maWc6IFtudW1iZXJbXSwgbnVtYmVyXSA9IFtbMCwgMSwgMiwgMywgNCwgNSwgOV0sIC0zXTtcbmNvbnN0IHJhbmtpbmdPcmRlckNvbmZpZzogW251bWJlcltdLCBudW1iZXJdID0gW1swLCAxLCA3XSwgMV07XG5mdW5jdGlvbiBzZXRRdWVyeUFjY29yZGluZ1RvSGFzaCgpIHtcbiAgICBsZXQgb2JqOiB7IFtrOiBzdHJpbmddOiBzdHJpbmc7IH07XG4gICAgdHJ5IHtcbiAgICAgICAgb2JqID0gcGFyc2VPYmplY3QobG9jYXRpb24uaGFzaC5zdWJzdHIoMSkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgb2JqID0ge307XG4gICAgfVxuICAgIGlmIChvYmoucyA9PT0gdW5kZWZpbmVkKSBvYmoucyA9ICcxJztcbiAgICBpZiAob2JqLm0gPT09IHVuZGVmaW5lZCkgb2JqLm0gPSAnMyc7XG4gICAgaWYgKG9iai5xID09PSB1bmRlZmluZWQpIG9iai5xID0gJyc7XG4gICAgaWYgKG9iai5sID09PSB1bmRlZmluZWQpIG9iai5sID0gJzAnO1xuICAgIGlmIChvYmoubyA9PT0gdW5kZWZpbmVkKSBvYmoubyA9ICcnO1xuICAgIGlmIChvYmouZiA9PT0gdW5kZWZpbmVkKSBvYmouZiA9ICcwJztcbiAgICBpZiAob2JqLmQgPT09IHVuZGVmaW5lZCkgb2JqLmQgPSAnMCc7XG4gICAgJCgnI2ZpbHRlci1hcHByb3ZlZC1zdGF0dXMnKS52YWwocGFyc2VJbnQob2JqLnMpKTtcbiAgICAkKCcjZmlsdGVyLW1vZGUnKS52YWwocGFyc2VJbnQob2JqLm0pKTtcbiAgICAkKCcjZmlsdGVyLXNlYXJjaC1xdWVyeScpLnZhbChvYmoucSk7XG4gICAgJCgnI2ZpbHRlci1mYy1sZXZlbCcpLnZhbChwYXJzZUludChvYmoubCkpO1xuICAgICQoJyNmaWx0ZXItbG9jYWwtZGF0YScpLnZhbChwYXJzZUludChvYmouZCkpO1xuICAgICQoJyNzaG93LWZ1bGwtcmVzdWx0JykucHJvcCgnY2hlY2tlZCcsICEhcGFyc2VJbnQob2JqLmYpKTtcbiAgICBjdXJyZW50U29ydE9yZGVyID0gc2ltcGxpZnlTb3J0T3JkZXIob2JqLm8uc3BsaXQoJy4nKS5tYXAoeCA9PiBwYXJzZUludCh4KSB8fCAwKSwgc3VtbWFyeU9yZGVyQ29uZmlnKTtcbiAgICBzZXRUYWJsZUhlYWRTb3J0aW5nTWFyaygpO1xufVxuXG5mdW5jdGlvbiBzZXRUYWJsZUhlYWRTb3J0aW5nTWFyaygpIHtcbiAgICAkKCcuc29ydGVkJykucmVtb3ZlQ2xhc3MoJ3NvcnRlZCBhc2NlbmRpbmcgZGVzY2VuZGluZycpO1xuICAgIGNvbnN0IHggPSBjdXJyZW50U29ydE9yZGVyLmxlbmd0aCA9PT0gMCA/XG4gICAgICAgIC0zIDogLy8gc3RhcnMgZGVzY1xuICAgICAgICBjdXJyZW50U29ydE9yZGVyW2N1cnJlbnRTb3J0T3JkZXIubGVuZ3RoIC0gMV07XG4gICAgY29uc3QgaW5kZXggPSBNYXRoLmFicyh4KSAtIDE7XG4gICAgJCgkKCcjc3VtbWFyeS10YWJsZSA+IHRoZWFkID4gdHIgPiB0aCcpW2luZGV4XSlcbiAgICAgICAgLmFkZENsYXNzKCdzb3J0ZWQnKS5hZGRDbGFzcyh4ID4gMCA/ICdhc2NlbmRpbmcnIDogJ2Rlc2NlbmRpbmcnKTtcbn1cblxuZnVuY3Rpb24gcGFkKHg6IG51bWJlcikge1xuICAgIHJldHVybiAoeCA8IDEwID8gJzAnIDogJycpICsgeDtcbn1cblxuZnVuY3Rpb24gZm9ybWF0RGF0ZShkYXRlOiBEYXRlKSB7XG4gICAgcmV0dXJuIGRhdGUudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdICtcbiAgICAgICAgJyAnICsgcGFkKGRhdGUuZ2V0SG91cnMoKSkgK1xuICAgICAgICAnOicgKyBwYWQoZGF0ZS5nZXRNaW51dGVzKCkpO1xufVxuXG5jb25zdCByYW5rQWNoaWV2ZWRDbGFzcyA9IFtcbiAgICAnU1NIJywgJ1NIJywgJ1NTJywgJ1MnLCAnQScsXG4gICAgJ0InLCAnQycsICdEJywgJ0YnLCAnLSdcbl07XG5cbmxldCBiZWF0bWFwSW5mb01hcFVzZWRWZXJzaW9uID0gTUlOSU1VTV9EQVRFO1xuZnVuY3Rpb24gaW5pdFVuc29ydGVkVGFibGVSb3dzKCkge1xuICAgIGlmIChzdW1tYXJ5Um93cy5sZW5ndGggPT09IDApXG4gICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGlmICh1bnNvcnRlZFRhYmxlUm93cy5sZW5ndGggIT09IDAgJiYgYmVhdG1hcEluZm9NYXBVc2VkVmVyc2lvbiA9PT0gYmVhdG1hcEluZm9NYXBWZXJzaW9uKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgYmVhdG1hcEluZm9NYXBVc2VkVmVyc2lvbiA9IGJlYXRtYXBJbmZvTWFwVmVyc2lvbjtcbiAgICBpZiAoYmVhdG1hcEluZm9NYXAuc2l6ZSAhPT0gMCkge1xuICAgICAgICBzdW1tYXJ5Um93cy5mb3JFYWNoKHJvdyA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmZvID0gYmVhdG1hcEluZm9NYXAuZ2V0KHJvdy5iZWF0bWFwX2lkX251bWJlcik7XG4gICAgICAgICAgICBpZiAoaW5mbylcbiAgICAgICAgICAgICAgICByb3cuaW5mbyA9IGluZm87XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IG1vZGVfaWNvbnMgPSBbXG4gICAgICAgICdmYSBmYS1leGNoYW5nZScsXG4gICAgICAgICcnLFxuICAgICAgICAnZmEgZmEtdGludCcsXG4gICAgICAgICcnLFxuICAgIF07XG4gICAgY29uc3QgYXBwcm92ZWRfc3RhdHVzX2ljb25zID0gW1xuICAgICAgICAnZmEgZmEtcXVlc3Rpb24nLFxuICAgICAgICAnZmEgZmEtcXVlc3Rpb24nLFxuICAgICAgICAnZmEgZmEtcXVlc3Rpb24nLFxuICAgICAgICAnZmEgZmEtYW5nbGUtZG91YmxlLXJpZ2h0JyxcbiAgICAgICAgJ2ZhIGZhLWZpcmUnLFxuICAgICAgICAnZmEgZmEtY2hlY2snLFxuICAgICAgICAnZmEgZmEtaGVhcnQtbycsXG4gICAgXTtcbiAgICB1bnNvcnRlZFRhYmxlUm93cyA9IHN1bW1hcnlSb3dzLm1hcChyb3cgPT5cbiAgICAgICAgJCgnPHRyPicpLmFwcGVuZChbXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgJCgnPGk+JykuYWRkQ2xhc3MoYXBwcm92ZWRfc3RhdHVzX2ljb25zW3Jvdy5hcHByb3ZlZF9zdGF0dXMgKyAyXSksXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUocm93LmFwcHJvdmVkX2RhdGVfc3RyaW5nLnNwbGl0KCcgJylbMF0pXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICQoJzxpPicpLmFkZENsYXNzKG1vZGVfaWNvbnNbcm93Lm1vZGVdKSxcbiAgICAgICAgICAgICAgICAkKCc8YT4nKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cignaHJlZicsIGBodHRwczovL29zdS5wcHkuc2gvYi8ke3Jvdy5iZWF0bWFwX2lkfT9tPTJgKVxuICAgICAgICAgICAgICAgICAgICAudGV4dChyb3cuZGlzcGxheV9zdHJpbmcpLFxuICAgICAgICAgICAgICAgIHJvdy5iZWF0bWFwX2lkX251bWJlciA+IDAgPyAkKCc8ZGl2IGNsYXNzPVwiZmxvYXQtcmlnaHRcIj4nKS5hcHBlbmQoW1xuICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLXBpY3R1cmUtb1wiPicpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignaHJlZicsIGBodHRwczovL2IucHB5LnNoL3RodW1iLyR7cm93LmJlYXRtYXBzZXRfaWR9LmpwZ2ApLFxuICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLWRvd25sb2FkXCI+JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYGh0dHBzOi8vb3N1LnBweS5zaC9kLyR7cm93LmJlYXRtYXBzZXRfaWR9bmApLFxuICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLWNsb3VkLWRvd25sb2FkXCI+JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYG9zdTovL2RsLyR7cm93LmJlYXRtYXBzZXRfaWR9YClcbiAgICAgICAgICAgICAgICBdKSA6ICQoKVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJvdy5zdGFycy50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgcm93LnBwLnRvRml4ZWQoMCksXG4gICAgICAgICAgICBgJHtNYXRoLmZsb29yKHJvdy5oaXRfbGVuZ3RoIC8gNjApfToke3BhZChNYXRoLmZsb29yKHJvdy5oaXRfbGVuZ3RoICUgNjApKX1gLFxuICAgICAgICAgICAgcm93Lm1heF9jb21iby50b1N0cmluZygpLFxuICAgICAgICAgICAgcm93LmFwcHJvYWNoX3JhdGUudG9GaXhlZCgxKSxcbiAgICAgICAgICAgIHJvdy5jaXJjbGVfc2l6ZS50b0ZpeGVkKDEpLFxuICAgICAgICAgICAgcm93Lm1pbl9taXNzZXMgIT09IDAgPyAocm93Lm1pbl9taXNzZXMgPT09IDEgPyAnMSBtaXNzJyA6IHJvdy5taW5fbWlzc2VzICsgJyBtaXNzZXMnKSA6XG4gICAgICAgICAgICBbcm93LmZjTk0sIHJvdy5mY0hELCByb3cuZmNIUiwgcm93LmZjSERIUiwgcm93LmZjRFQsIHJvdy5mY0hERFRdLmpvaW4oJywgJyksXG4gICAgICAgIGJlYXRtYXBJbmZvTWFwLnNpemUgPT09IDAgPyBbXSA6XG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgJCgnPGkgY2xhc3M9XCJmYVwiPicpLmFkZENsYXNzKHJvdy5pbmZvID8gJ2ZhLWNoZWNrLXNxdWFyZS1vJyA6ICdmYS1zcXVhcmUtbycpLFxuICAgICAgICAgICAgICAgICQoJzxzcGFuPicpLmFkZENsYXNzKCdyYW5rLScgKyByYW5rQWNoaWV2ZWRDbGFzc1shcm93LmluZm8gPyA5IDogcm93LmluZm8ucmFua0FjaGlldmVkXSksXG4gICAgICAgICAgICAgICAgJCgnPHNwYW4+JykudGV4dChcbiAgICAgICAgICAgICAgICAgICAgIXJvdy5pbmZvIHx8IHJvdy5pbmZvLmxhc3RQbGF5ZWQudmFsdWVPZigpID09PSBNSU5JTVVNX0RBVEUudmFsdWVPZigpXG4gICAgICAgICAgICAgICAgICAgICAgICA/ICctLS0nIDogZm9ybWF0RGF0ZShyb3cuaW5mby5sYXN0UGxheWVkKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICBdXG4gICAgICAgIF0ubWFwKHggPT4gJCgnPHRkPicpLmFwcGVuZCh4KSkpWzBdIGFzIEhUTUxUYWJsZVJvd0VsZW1lbnQpO1xuXG4gICAgdW5zb3J0ZWRUYWJsZVJvd3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gc2hvd0Vycm9yTWVzc2FnZSh0ZXh0OiBzdHJpbmcpIHtcbiAgICAkKCcjYWxlcnRzJykuYXBwZW5kKFxuICAgICAgICAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtd2FybmluZyBhbGVydC1kaXNtaXNzYWJsZVwiPicpXG4gICAgICAgICAgICAudGV4dCh0ZXh0KVxuICAgICAgICAgICAgLmFwcGVuZCgnPGEgY2xhc3M9XCJjbG9zZVwiIGRhdGEtZGlzbWlzcz1cImFsZXJ0XCI+PHNwYW4+JnRpbWVzOycpKTtcbn1cblxuY29uc3QgTE9DQUxTVE9SQUdFX1BSRUZJWCA9ICdsaXN0LW1hcHMvJztcbnR5cGUgTG9jYWxGaWxlTmFtZSA9ICdvc3UhLmRiJyB8ICdzY29yZXMuZGInO1xuaW50ZXJmYWNlIExvY2FsRmlsZSB7XG4gICAgZGF0YTogVWludDhBcnJheTtcbiAgICB1cGxvYWRlZERhdGU6IERhdGU7XG59XG5jb25zdCBsb2NhbEZpbGVzOiB7XG4gICAgWydvc3UhLmRiJ10/OiBMb2NhbEZpbGUsXG4gICAgWydzY29yZXMuZGInXT86IExvY2FsRmlsZTtcbn0gPSB7fTtcblxuLypcbmZ1bmN0aW9uIGRhdGFVUkl0b1VJbnQ4QXJyYXkoZGF0YVVSSTogc3RyaW5nKSB7XG4gICAgY29uc3QgYmFzZTY0ID0gZGF0YVVSSS5zcGxpdCgnLCcpWzFdO1xuICAgIGNvbnN0IHN0ciA9IGF0b2IoYmFzZTY0KTtcbiAgICBjb25zdCBsZW4gPSBzdHIubGVuZ3RoO1xuICAgIGNvbnN0IGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkobGVuKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgKysgaSkge1xuICAgICAgICBhcnJheVtpXSA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXk7XG59XG4qL1xuXG5jb25zdCByZWdpc3RlcmVkQ2FsbGJhY2tNYXAgPSBuZXcgTWFwPG51bWJlciwgKGRhdGE6IGFueSkgPT4gYW55PigpO1xuZnVuY3Rpb24gcmVnaXN0ZXJDYWxsYmFjayhjYWxsYmFjazogKGRhdGE6IGFueSkgPT4gYW55KTogbnVtYmVyIHtcbiAgICBsZXQgaWQ7XG4gICAgZG9cbiAgICAgICAgaWQgPSBNYXRoLnJhbmRvbSgpO1xuICAgIHdoaWxlIChyZWdpc3RlcmVkQ2FsbGJhY2tNYXAuaGFzKGlkKSk7XG4gICAgcmVnaXN0ZXJlZENhbGxiYWNrTWFwLnNldChpZCwgY2FsbGJhY2spO1xuICAgIHJldHVybiBpZDtcbn1cblxuZnVuY3Rpb24gbmV3V29ya2VyKCk6IFdvcmtlciB7XG4gICAgcmV0dXJuIG5ldyBXb3JrZXIoJ2Rpc3QvbGlzdC1tYXBzLXdvcmtlci5qcycpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5Xb3JrZXIobWVzc2FnZTogb2JqZWN0LCB1c2luZz86IFdvcmtlcik6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueT4ocmVzb2x2ZSA9PiB7XG4gICAgICAgIGNvbnN0IHdvcmtlciA9IHVzaW5nIHx8IG5ld1dvcmtlcigpO1xuICAgICAgICAobWVzc2FnZSBhcyBhbnkpLmlkID0gcmVnaXN0ZXJDYWxsYmFjayhyZXNvbHZlKTtcbiAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICB3b3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gZXZlbnQuZGF0YTtcbiAgICAgICAgICAgIGlmIChkYXRhLnR5cGUgPT09ICdjYWxsYmFjaycgJiYgdHlwZW9mKGRhdGEuaWQpID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gcmVnaXN0ZXJlZENhbGxiYWNrTWFwLmdldChkYXRhLmlkKTtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgcmVnaXN0ZXJlZENhbGxiYWNrTWFwLmRlbGV0ZShkYXRhLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmYWxzZSk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21wcmVzc0J1ZmZlclRvU3RyaW5nKGJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGNvbXByZXNzZWQgPSAoYXdhaXQgcnVuV29ya2VyKHtcbiAgICAgICAgdHlwZTogJ2NvbXByZXNzJyxcbiAgICAgICAgZGF0YTogbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKVxuICAgIH0pKS5kYXRhIGFzIFVpbnQ4QXJyYXk7XG4gICAgY29uc3QgY2hhcnMgPSBuZXcgQXJyYXkoTWF0aC5mbG9vcihjb21wcmVzc2VkLmxlbmd0aCAvIDIpKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoYXJzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSAoY29tcHJlc3NlZFtpICogMiArIDBdICYgMHhmZikgPDwgOCB8IChjb21wcmVzc2VkW2kgKiAyICsgMV0gJiAweGZmKTtcbiAgICAgICAgY2hhcnNbaV0gPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpO1xuICAgIH1cbiAgICBsZXQgcmVzID0gY29tcHJlc3NlZC5sZW5ndGggJSAyID8gJzEnIDogJzAnO1xuICAgIHJlcyArPSBjaGFycy5qb2luKCcnKTtcbiAgICBpZiAoY29tcHJlc3NlZC5sZW5ndGggJSAyICE9PSAwKVxuICAgICAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoY29tcHJlc3NlZFtjb21wcmVzc2VkLmxlbmd0aCAtIDFdICYgMHhmZikgPDwgOCk7XG4gICAgcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlY29tcHJlc3NCdWZmZXJGcm9tU3RyaW5nKHN0cjogc3RyaW5nKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gICAgY29uc3QgcGFyaXR5ID0gc3RyWzBdID09PSAnMScgPyAxIDogMDtcbiAgICBjb25zdCBsZW4gPSBzdHIubGVuZ3RoIC0gMSAtIHBhcml0eTtcbiAgICBjb25zdCBhcnJheSA9IG5ldyBVaW50OEFycmF5KGxlbiAqIDIgKyBwYXJpdHkpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3QgY29kZSA9IHN0ci5jaGFyQ29kZUF0KGkgKyAxKTtcbiAgICAgICAgYXJyYXlbaSAqIDIgKyAwXSA9IGNvZGUgPj4gODtcbiAgICAgICAgYXJyYXlbaSAqIDIgKyAxXSA9IGNvZGUgJiAweGZmO1xuICAgIH1cbiAgICBpZiAocGFyaXR5ICE9PSAwKVxuICAgICAgICBhcnJheVtsZW4gKiAyXSA9IHN0ci5jaGFyQ29kZUF0KGxlbiArIDEpID4+IDg7XG4gICAgY29uc3QgZGVjb21wcmVzc2VkID0gKGF3YWl0IHJ1bldvcmtlcih7XG4gICAgICAgIHR5cGU6ICdkZWNvbXByZXNzJyxcbiAgICAgICAgZGF0YTogYXJyYXlcbiAgICB9KSkuZGF0YSBhcyBVaW50OEFycmF5O1xuICAgIHJldHVybiBkZWNvbXByZXNzZWQ7XG59XG5cbmZ1bmN0aW9uIHJlbG9hZExvY2FsRmlsZShuYW1lOiBMb2NhbEZpbGVOYW1lKSB7XG4gICAgY29uc3QgZiA9IGxvY2FsRmlsZXNbbmFtZV07XG4gICAgaWYgKG5hbWUgPT09ICdvc3UhLmRiJylcbiAgICAgICAgJCgnI2ZpbHRlci1sb2NhbC1kYXRhJykucHJvcCgnZGlzYWJsZWQnLCBmID09PSB1bmRlZmluZWQpO1xuICAgICQobmFtZSA9PT0gJ29zdSEuZGInID8gJyNjdXJyZW50LW9zdWRiLWZpbGUnIDogJyNjdXJyZW50LXNjb3Jlc2RiLWZpbGUnKVxuICAgICAgICAudGV4dCghZiA/ICdObyBkYXRhJyA6IGZvcm1hdERhdGUoZi51cGxvYWRlZERhdGUpKTtcbiAgICBpZiAoIWYpIHJldHVybjtcbiAgICBpZiAobmFtZSA9PT0gJ29zdSEuZGInKSB7XG4gICAgICAgIGxvYWRPc3VEQihmLmRhdGEuYnVmZmVyLCBmLnVwbG9hZGVkRGF0ZSk7XG4gICAgfSBlbHNlIHtcblxuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZEZyb21Mb2NhbFN0b3JhZ2UobmFtZTogTG9jYWxGaWxlTmFtZSkge1xuICAgIGNvbnN0IGRhdGVTdHIgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShMT0NBTFNUT1JBR0VfUFJFRklYICsgbmFtZSArICcvdXBsb2FkZWQtZGF0ZScpO1xuICAgIGlmICghZGF0ZVN0cikgcmV0dXJuO1xuICAgIGNvbnN0IGVuY29kZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShMT0NBTFNUT1JBR0VfUFJFRklYICsgbmFtZSArICcvZGF0YScpITtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZGVjb21wcmVzc0J1ZmZlckZyb21TdHJpbmcoZW5jb2RlZCk7XG4gICAgY29uc29sZS5sb2coJ2ZpbGUgJyArIG5hbWUgKyAnIGxvYWRlZCBmcm9tIGxvY2FsU3RvcmFnZScpO1xuICAgIGxvY2FsRmlsZXNbbmFtZV0gPSB7XG4gICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIHVwbG9hZGVkRGF0ZTogbmV3IERhdGUoZGF0ZVN0cilcbiAgICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBzZXRMb2NhbEZpbGUobmFtZTogTG9jYWxGaWxlTmFtZSwgZmlsZTogRmlsZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPihyZXNvbHZlID0+IHtcbiAgICAgICAgY29uc3QgZnIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICBmci5vbmxvYWQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmaWxlICcgKyBuYW1lICsgJyBsb2FkZWQnKTtcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IGZyLnJlc3VsdCBhcyBBcnJheUJ1ZmZlcjtcbiAgICAgICAgICAgIGNvbnN0IHVwbG9hZGVkRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBsb2NhbEZpbGVzW25hbWVdID0ge1xuICAgICAgICAgICAgICAgIGRhdGE6IG5ldyBVaW50OEFycmF5KGJ1ZmZlciksXG4gICAgICAgICAgICAgICAgdXBsb2FkZWREYXRlOiB1cGxvYWRlZERhdGUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVsb2FkTG9jYWxGaWxlKG5hbWUpO1xuICAgICAgICAgICAgY29tcHJlc3NCdWZmZXJUb1N0cmluZyhidWZmZXIpLnRoZW4oZGF0YVN0ciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpbGUgJyArIG5hbWUgKyAnIGNvbXByZXNzZWQnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50ID0gbG9jYWxGaWxlc1tuYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudCAmJiBjdXJyZW50LnVwbG9hZGVkRGF0ZS52YWx1ZU9mKCkgIT09IHVwbG9hZGVkRGF0ZS52YWx1ZU9mKCkpIHJldHVybjtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShMT0NBTFNUT1JBR0VfUFJFRklYICsgbmFtZSArICcvZGF0YScsIGRhdGFTdHIpO1xuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShMT0NBTFNUT1JBR0VfUFJFRklYICsgbmFtZSArICcvdXBsb2FkZWQtZGF0ZScsIHVwbG9hZGVkRGF0ZS50b0lTT1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpbGUgJyArIG5hbWUgKyAnIHNhdmVkIHRvIGxvY2FsU3RvcmFnZScpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignbG9jYWxTdG9yYWdlIGVycm9yOiAnLCBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKCk7XG4gICAgICAgIH07XG4gICAgICAgIGZyLnJlYWRBc0FycmF5QnVmZmVyKGZpbGUpO1xuICAgIH0pO1xufVxuXG5jbGFzcyBTZXJpYWxpemF0aW9uUmVhZGVyIHtcbiAgICBwcml2YXRlIGR2OiBEYXRhVmlldztcbiAgICBwcml2YXRlIG9mZnNldDogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IoYnVmZmVyOiBBcnJheUJ1ZmZlcikge1xuICAgICAgICB0aGlzLmR2ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG4gICAgICAgIHRoaXMub2Zmc2V0ID0gMDtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2tpcChieXRlczogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMub2Zmc2V0ICs9IGJ5dGVzO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkSW50OCgpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5kdi5nZXRJbnQ4KHRoaXMub2Zmc2V0KTtcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gMTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVhZEludDE2KCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmR2LmdldEludDE2KHRoaXMub2Zmc2V0LCB0cnVlKTtcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gMjtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVhZEludDMyKCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmR2LmdldEludDMyKHRoaXMub2Zmc2V0LCB0cnVlKTtcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gNDtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVhZEJ5dGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRJbnQ4KCkgfCAwO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkVUludDE2KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkSW50MTYoKSB8IDA7XG4gICAgfVxuXG4gICAgcHVibGljIHJlYWRVSW50MzIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRJbnQzMigpIHwgMDtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVhZEJvb2xlYW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRJbnQ4KCkgIT09IDA7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZWFkVUxFQjEyOCgpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IDA7XG4gICAgICAgIGZvciAobGV0IHNoaWZ0ID0gMDsgOyBzaGlmdCArPSA3KSB7XG4gICAgICAgICAgICBjb25zdCBieXRlID0gdGhpcy5kdi5nZXRVaW50OCh0aGlzLm9mZnNldCk7XG4gICAgICAgICAgICB0aGlzLm9mZnNldCArPSAxO1xuICAgICAgICAgICAgcmVzdWx0IHw9IChieXRlICYgMHg3ZikgPDwgc2hpZnQ7XG4gICAgICAgICAgICBpZiAoKGJ5dGUgJiAweDgwKSA9PT0gMClcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlYWRVaW50OEFycmF5KGxlbmd0aDogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KHRoaXMuZHYuYnVmZmVyLCB0aGlzLm9mZnNldCwgbGVuZ3RoKTtcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gbGVuZ3RoO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkU3RyaW5nKCkge1xuICAgICAgICBjb25zdCBoZWFkZXIgPSB0aGlzLnJlYWRJbnQ4KCk7XG4gICAgICAgIGlmIChoZWFkZXIgPT09IDApXG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMucmVhZFVMRUIxMjgoKTtcbiAgICAgICAgY29uc3QgYXJyYXkgPSB0aGlzLnJlYWRVaW50OEFycmF5KGxlbmd0aCk7XG4gICAgICAgIHJldHVybiBuZXcgVGV4dERlY29kZXIoJ3V0Zi04JykuZGVjb2RlKGFycmF5KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVhZEludDY0Um91bmRlZCgpIHtcbiAgICAgICAgY29uc3QgbG8gPSB0aGlzLmR2LmdldFVpbnQzMih0aGlzLm9mZnNldCwgdHJ1ZSk7XG4gICAgICAgIGNvbnN0IGhpID0gdGhpcy5kdi5nZXRVaW50MzIodGhpcy5vZmZzZXQgKyA0LCB0cnVlKTtcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gODtcbiAgICAgICAgcmV0dXJuIGhpICogMHgxMDAwMDAwMDAgKyBsbztcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVhZERhdGVUaW1lKCkge1xuICAgICAgICAvLyBPRkZTRVQgPSA2MjEzNTU5NjgwMDAwMDAwMDAgPSB0aWNrcyBmcm9tIDAwMDEvMS8xIHRvIDE5NzAvMS8xXG4gICAgICAgIGxldCBsbyA9IHRoaXMucmVhZFVJbnQzMigpO1xuICAgICAgICBsZXQgaGkgPSB0aGlzLnJlYWRVSW50MzIoKTtcbiAgICAgICAgbG8gLT0gMzQ0NDI5MzYzMjsgLy8gbG8gYml0cyBvZiBPRkZTRVRcbiAgICAgICAgaWYgKGxvIDwgMCkge1xuICAgICAgICAgICAgbG8gKz0gNDI5NDk2NzI5NjsgICAvLyAyXjMyXG4gICAgICAgICAgICBoaSAtPSAxO1xuICAgICAgICB9XG4gICAgICAgIGhpIC09IDE0NDY3MDUwODsgIC8vIGhpIGJpdHMgb2YgT0ZGU0VUXG4gICAgICAgIGNvbnN0IHRpY2tzID0gaGkgKiA0Mjk0OTY3Mjk2ICsgbG87XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZSh0aWNrcyAqIDFlLTQpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkU2luZ2xlKCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmR2LmdldEZsb2F0MzIodGhpcy5vZmZzZXQsIHRydWUpO1xuICAgICAgICB0aGlzLm9mZnNldCArPSA0O1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkRG91YmxlKCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmR2LmdldEZsb2F0NjQodGhpcy5vZmZzZXQsIHRydWUpO1xuICAgICAgICB0aGlzLm9mZnNldCArPSA4O1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkTGlzdChjYWxsYmFjazogKGluZGV4OiBudW1iZXIpID0+IGFueSkge1xuICAgICAgICBjb25zdCBjb3VudCA9IHRoaXMucmVhZEludDMyKCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkgKz0gMSlcbiAgICAgICAgICAgIGNhbGxiYWNrKGkpO1xuICAgIH1cbn1cblxuY2xhc3MgQmVhdG1hcEluZm8ge1xuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHVibGljIHJlYWRvbmx5IGJlYXRtYXBJZDogbnVtYmVyLFxuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgbGFzdFBsYXllZDogRGF0ZSxcbiAgICAgICAgcHVibGljIHJlYWRvbmx5IHJhbmtBY2hpZXZlZDogbnVtYmVyKSB7fVxufVxuXG5mdW5jdGlvbiByZWFkQmVhdG1hcChzcjogU2VyaWFsaXphdGlvblJlYWRlcikge1xuICAgIGNvbnN0IFNpemVJbkJ5dGVzID0gc3IucmVhZEludDMyKCk7XG5cbiAgICBjb25zdCBBcnRpc3QgPSBzci5yZWFkU3RyaW5nKCk7XG4gICAgY29uc3QgQXJ0aXN0VW5pY29kZSA9IHNyLnJlYWRTdHJpbmcoKTtcbiAgICBjb25zdCBUaXRsZSA9IHNyLnJlYWRTdHJpbmcoKTtcbiAgICBjb25zdCBUaXRsZVVuaWNvZGUgPSBzci5yZWFkU3RyaW5nKCk7XG4gICAgY29uc3QgQ3JlYXRvciA9IHNyLnJlYWRTdHJpbmcoKTtcbiAgICBjb25zdCBWZXJzaW9uID0gc3IucmVhZFN0cmluZygpO1xuICAgIGNvbnN0IEF1ZGlvRmlsZW5hbWUgPSBzci5yZWFkU3RyaW5nKCk7XG4gICAgY29uc3QgQmVhdG1hcENoZWNrc3VtID0gc3IucmVhZFN0cmluZygpO1xuICAgIGNvbnN0IEZpbGVuYW1lID0gc3IucmVhZFN0cmluZygpO1xuICAgIGNvbnN0IFN1Ym1pc3Npb25TdGF0dXMgPSBzci5yZWFkQnl0ZSgpO1xuICAgIGNvbnN0IGNvdW50Tm9ybWFsID0gc3IucmVhZFVJbnQxNigpO1xuICAgIGNvbnN0IGNvdW50U2xpZGVyID0gc3IucmVhZFVJbnQxNigpO1xuICAgIGNvbnN0IGNvdW50U3Bpbm5lciA9IHNyLnJlYWRVSW50MTYoKTtcbiAgICBjb25zdCBEYXRlTW9kaWZpZWQgPSBzci5yZWFkRGF0ZVRpbWUoKTtcblxuICAgIGNvbnN0IERpZmZpY3VsdHlBcHByb2FjaFJhdGUgPSBzci5yZWFkU2luZ2xlKCk7XG4gICAgY29uc3QgRGlmZmljdWx0eUNpcmNsZVNpemUgPSBzci5yZWFkU2luZ2xlKCk7XG4gICAgY29uc3QgRGlmZmljdWx0eUhwRHJhaW5SYXRlID0gc3IucmVhZFNpbmdsZSgpO1xuICAgIGNvbnN0IERpZmZpY3VsdHlPdmVyYWxsID0gc3IucmVhZFNpbmdsZSgpO1xuXG4gICAgY29uc3QgRGlmZmljdWx0eVNsaWRlck11bHRpcGxpZXIgPSBzci5yZWFkRG91YmxlKCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkgKz0gMSkge1xuICAgICAgICBzci5yZWFkTGlzdCgoKSA9PiB7XG4gICAgICAgICAgICBzci5yZWFkSW50MzIoKTtcbiAgICAgICAgICAgIHNyLnJlYWRJbnQxNigpO1xuICAgICAgICAgICAgc3IucmVhZERvdWJsZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBEcmFpbkxlbmd0aCA9IHNyLnJlYWRJbnQzMigpO1xuICAgIGNvbnN0IFRvdGFsTGVuZ3RoID0gc3IucmVhZEludDMyKCk7XG4gICAgY29uc3QgUHJldmlld1RpbWUgPSBzci5yZWFkSW50MzIoKTtcbiAgICBzci5yZWFkTGlzdCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IEJlYXRMZW5ndGggPSBzci5yZWFkRG91YmxlKCk7XG4gICAgICAgIGNvbnN0IE9mZnNldCA9IHNyLnJlYWREb3VibGUoKTtcbiAgICAgICAgY29uc3QgVGltaW5nQ2hhbmdlID0gc3IucmVhZEJvb2xlYW4oKTtcbiAgICB9KTtcbiAgICBjb25zdCBCZWF0bWFwSWQgPSBzci5yZWFkSW50MzIoKTtcbiAgICBjb25zdCBCZWF0bWFwU2V0SWQgPSBzci5yZWFkSW50MzIoKTtcbiAgICBjb25zdCBCZWF0bWFwVG9waWNJZCA9IHNyLnJlYWRJbnQzMigpO1xuICAgIGNvbnN0IFBsYXllclJhbmtPc3UgPSBzci5yZWFkQnl0ZSgpO1xuICAgIGNvbnN0IFBsYXllclJhbmtGcnVpdHMgPSBzci5yZWFkQnl0ZSgpO1xuICAgIGNvbnN0IFBsYXllclJhbmtUYWlrbyA9IHNyLnJlYWRCeXRlKCk7XG4gICAgY29uc3QgUGxheWVyUmFua01hbmlhID0gc3IucmVhZEJ5dGUoKTtcbiAgICBjb25zdCBQbGF5ZXJPZmZzZXQgPSBzci5yZWFkSW50MTYoKTtcbiAgICBjb25zdCBTdGFja0xlbmllbmN5ID0gc3IucmVhZFNpbmdsZSgpO1xuICAgIGNvbnN0IFBsYXlNb2RlID0gc3IucmVhZEJ5dGUoKTtcbiAgICBjb25zdCBTb3VyY2UgPSBzci5yZWFkU3RyaW5nKCk7XG4gICAgY29uc3QgVGFncyA9IHNyLnJlYWRTdHJpbmcoKTtcbiAgICBjb25zdCBPbmxpbmVPZmZzZXQgPSBzci5yZWFkSW50MTYoKTtcbiAgICBjb25zdCBPbmxpbmVEaXNwbGF5VGl0bGUgPSBzci5yZWFkU3RyaW5nKCk7XG4gICAgY29uc3QgTmV3RmlsZSA9IHNyLnJlYWRCb29sZWFuKCk7XG4gICAgY29uc3QgRGF0ZUxhc3RQbGF5ZWQgPSBzci5yZWFkRGF0ZVRpbWUoKTtcbiAgICBjb25zdCBJbk9zekNvbnRhaW5lciA9IHNyLnJlYWRCb29sZWFuKCk7XG4gICAgY29uc3QgQ29udGFpbmluZ0ZvbGRlckFic29sdXRlID0gc3IucmVhZFN0cmluZygpO1xuICAgIGNvbnN0IExhc3RJbmZvVXBkYXRlID0gc3IucmVhZERhdGVUaW1lKCk7XG4gICAgY29uc3QgRGlzYWJsZVNhbXBsZXMgPSBzci5yZWFkQm9vbGVhbigpO1xuICAgIGNvbnN0IERpc2FibGVTa2luID0gc3IucmVhZEJvb2xlYW4oKTtcbiAgICBjb25zdCBEaXNhYmxlU3Rvcnlib2FyZCA9IHNyLnJlYWRCb29sZWFuKCk7XG4gICAgY29uc3QgRGlzYWJsZVZpZGVvID0gc3IucmVhZEJvb2xlYW4oKTtcbiAgICBjb25zdCBWaXN1YWxTZXR0aW5nc092ZXJyaWRlID0gc3IucmVhZEJvb2xlYW4oKTtcblxuICAgIGNvbnN0IExhc3RFZGl0VGltZSA9IHNyLnJlYWRJbnQzMigpO1xuICAgIGNvbnN0IE1hbmlhU3BlZWQgPSBzci5yZWFkQnl0ZSgpO1xuXG4gICAgcmV0dXJuIG5ldyBCZWF0bWFwSW5mbyhcbiAgICAgICAgQmVhdG1hcElkLFxuICAgICAgICBuZXcgRGF0ZShNYXRoLm1heChNSU5JTVVNX0RBVEUudmFsdWVPZigpLCBEYXRlTGFzdFBsYXllZC52YWx1ZU9mKCkpKSxcbiAgICAgICAgUGxheWVyUmFua0ZydWl0cyk7XG59XG5cbmNvbnN0IGJlYXRtYXBJbmZvTWFwID0gbmV3IE1hcDxudW1iZXIsIEJlYXRtYXBJbmZvPigpO1xubGV0IGJlYXRtYXBJbmZvTWFwVmVyc2lvbiA9IE1JTklNVU1fREFURTtcblxuZnVuY3Rpb24gbG9hZE9zdURCKGJ1ZmZlcjogQXJyYXlCdWZmZXIsIHZlcnNpb246IERhdGUpIHtcbiAgICBiZWF0bWFwSW5mb01hcC5jbGVhcigpO1xuICAgIGNvbnN0IHNyID0gbmV3IFNlcmlhbGl6YXRpb25SZWFkZXIoYnVmZmVyKTtcbiAgICBzci5za2lwKDQgKyA0ICsgMSArIDgpO1xuICAgIHNyLnJlYWRTdHJpbmcoKTtcbiAgICBjb25zdCBiZWF0bWFwQ291bnQgPSBzci5yZWFkSW50MzIoKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmVhdG1hcENvdW50OyBpICs9IDEpIHtcbiAgICAgICAgY29uc3QgYmVhdG1hcCA9IHJlYWRCZWF0bWFwKHNyKTtcbiAgICAgICAgaWYgKGJlYXRtYXAuYmVhdG1hcElkID4gMClcbiAgICAgICAgICAgIGJlYXRtYXBJbmZvTWFwLnNldChiZWF0bWFwLmJlYXRtYXBJZCwgYmVhdG1hcCk7XG4gICAgfVxuXG4gICAgYmVhdG1hcEluZm9NYXBWZXJzaW9uID0gdmVyc2lvbjtcbn1cblxuZnVuY3Rpb24gaW5pdFRhYmxlKHNvcnRLZXlzOiB7fVtdLCBvcmRlckNvbmZpZzogW251bWJlcltdLCBudW1iZXJdLCBvblNvcnRPcmRlckNoYW5nZWQ6ICgpID0+IHZvaWQpIHtcbiAgICBjb25zdCB0aExpc3QgPSAkKCcjc3VtbWFyeS10YWJsZSA+IHRoZWFkID4gdHIgPiB0aCcpO1xuICAgIHNvcnRLZXlzLmZvckVhY2goKF8sIGluZGV4KSA9PiB7XG4gICAgICAgICQuZGF0YSh0aExpc3RbaW5kZXhdLCAndGhJbmRleCcsIGluZGV4KTtcbiAgICB9KTtcbiAgICB0aExpc3QuY2xpY2soKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHRoID0gJChldmVudC50YXJnZXQpO1xuICAgICAgICBsZXQgc2lnbjtcbiAgICAgICAgaWYgKHRoLmhhc0NsYXNzKCdzb3J0ZWQnKSlcbiAgICAgICAgICAgIHNpZ24gPSB0aC5oYXNDbGFzcygnZGVzY2VuZGluZycpID8gMSA6IC0xO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzaWduID0gdGguaGFzQ2xhc3MoJ2Rlc2MtZmlyc3QnKSA/IC0xIDogMTtcbiAgICAgICAgY29uc3QgdGhJbmRleCA9IHRoLmRhdGEoJ3RoSW5kZXgnKSBhcyBudW1iZXI7XG4gICAgICAgIGN1cnJlbnRTb3J0T3JkZXIucHVzaCgodGhJbmRleCArIDEpICogc2lnbik7XG4gICAgICAgIGN1cnJlbnRTb3J0T3JkZXIgPSBzaW1wbGlmeVNvcnRPcmRlcihjdXJyZW50U29ydE9yZGVyLCBvcmRlckNvbmZpZyk7XG4gICAgICAgIHNldFRhYmxlSGVhZFNvcnRpbmdNYXJrKCk7XG4gICAgICAgIG9uU29ydE9yZGVyQ2hhbmdlZCgpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBtYWluKCkge1xuICAgIFByb21pc2UuYWxsKFxuICAgICAgICAoWydvc3UhLmRiJywgJ3Njb3Jlcy5kYiddIGFzIExvY2FsRmlsZU5hbWVbXSlcbiAgICAgICAgICAgIC5tYXAobmFtZSA9PlxuICAgICAgICAgICAgICAgIGxvYWRGcm9tTG9jYWxTdG9yYWdlKG5hbWUpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHJlbG9hZExvY2FsRmlsZShuYW1lKSkpKS50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKGluaXRVbnNvcnRlZFRhYmxlUm93cygpKVxuICAgICAgICAgICAgZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpO1xuICAgIH0pO1xuICAgIHNldFF1ZXJ5QWNjb3JkaW5nVG9IYXNoKCk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgIHNldFF1ZXJ5QWNjb3JkaW5nVG9IYXNoKCk7XG4gICAgICAgIGRyYXdUYWJsZUZvckN1cnJlbnRGaWx0ZXJpbmcoKTtcbiAgICB9KTtcbiAgICBjb25zdCBvbkNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpO1xuICAgIH07XG4gICAgZm9yIChjb25zdCBpZCBvZiBbJ2ZpbHRlci1hcHByb3ZlZC1zdGF0dXMnLCAnZmlsdGVyLW1vZGUnLCAnZmlsdGVyLWZjLWxldmVsJywgJ2ZpbHRlci1sb2NhbC1kYXRhJywgJ3Nob3ctZnVsbC1yZXN1bHQnXSlcbiAgICAgICAgJChgIyR7aWR9YCkub24oJ2NoYW5nZScsIG9uQ2hhbmdlKTtcbiAgICBmb3IgKGNvbnN0IGlkIG9mIFsnZmlsdGVyLXNlYXJjaC1xdWVyeSddKVxuICAgICAgICAkKGAjJHtpZH1gKS5vbignaW5wdXQnLCBvbkNoYW5nZSk7XG4gICAgaW5pdFRhYmxlKHNvcnRLZXlzLCBzdW1tYXJ5T3JkZXJDb25maWcsIG9uQ2hhbmdlKTtcblxuICAgIGNvbnN0IGxvYWREYXRhID0gKGRhdGE6IFN1bW1hcnlSb3dEYXRhW10sIGxhc3RNb2RpZmllZDogRGF0ZSkgPT4ge1xuICAgICAgICAkKCcjbGFzdC11cGRhdGUtdGltZScpXG4gICAgICAgICAgICAuYXBwZW5kKCQoJzx0aW1lPicpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2RhdGV0aW1lJywgbGFzdE1vZGlmaWVkLnRvSVNPU3RyaW5nKCkpXG4gICAgICAgICAgICAgICAgLnRleHQobGFzdE1vZGlmaWVkLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSkpO1xuICAgICAgICBzdW1tYXJ5Um93cyA9IGRhdGEubWFwKHggPT4gbmV3IFN1bW1hcnlSb3coeCkpO1xuICAgICAgICBpbml0VW5zb3J0ZWRUYWJsZVJvd3MoKTtcbiAgICAgICAgZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpO1xuICAgICAgICAkKCcjc3VtbWFyeS10YWJsZS1sb2FkZXInKS5oaWRlKCk7XG4gICAgfTtcbiAgICAkLmdldEpTT04oJ2RhdGEvc3VtbWFyeS5qc29uJykudGhlbigoZGF0YSwgXywgeGhyKSA9PiB7XG4gICAgICAgIGxvYWREYXRhKGRhdGEsIG5ldyBEYXRlKHhoci5nZXRSZXNwb25zZUhlYWRlcignTGFzdC1Nb2RpZmllZCcpIGFzIHN0cmluZykpO1xuICAgIH0pO1xuICAgICQoJyNkYi1maWxlLWlucHV0JykuY2hhbmdlKGFzeW5jIGV2ZW50ID0+IHtcbiAgICAgICAgY29uc3QgZWxlbSA9IGV2ZW50LnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgICBpZiAoIWVsZW0uZmlsZXMpIHJldHVybjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbGVtLmZpbGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBmaWxlID0gZWxlbS5maWxlc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBmaWxlLm5hbWU7XG4gICAgICAgICAgICBpZiAobmFtZS5pbmRleE9mKCdvc3UhLmRiJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc2V0TG9jYWxGaWxlKCdvc3UhLmRiJywgZmlsZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUuaW5kZXhPZignc2NvcmVzLmRiJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc2V0TG9jYWxGaWxlKCdzY29yZXMuZGInLCBmaWxlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2hvd0Vycm9yTWVzc2FnZShgSW52YWxpZCBmaWxlICR7bmFtZX06IFBsZWFzZSBzZWxlY3Qgb3N1IS5kYiBvciBzY29yZXMuZGJgKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpbml0VW5zb3J0ZWRUYWJsZVJvd3MoKSlcbiAgICAgICAgICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxlbS52YWx1ZSA9ICcnO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0VW5zb3J0ZWRSYW5raW5nVGFibGVSb3dzKCkge1xuICAgIGlmIChyYW5raW5nUm93cy5sZW5ndGggPT09IDApXG4gICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIHVuc29ydGVkVGFibGVSb3dzID0gcmFua2luZ1Jvd3MubWFwKHJvdyA9PlxuICAgICAgICAkKCc8dHI+JykuYXBwZW5kKFtcbiAgICAgICAgICAgIHJvdy5yYW5rLnRvU3RyaW5nKCksXG4gICAgICAgICAgICByb3cucHAudG9GaXhlZCgyKSxcbiAgICAgICAgICAgICQoJzxhPicpLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9vc3UucHB5LnNoL3UvJHtyb3cudXNlcl9pZH1gKS50ZXh0KHJvdy51c2VybmFtZSksXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgJCgnPGE+JylcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9vc3UucHB5LnNoL2IvJHtyb3cuYmVhdG1hcF9pZH0/bT0yYClcbiAgICAgICAgICAgICAgICAgICAgLnRleHQocm93LmRpc3BsYXlfc3RyaW5nKSxcbiAgICAgICAgICAgICAgICByb3cuYmVhdG1hcF9pZF9udW1iZXIgPiAwID8gJCgnPGRpdiBjbGFzcz1cImZsb2F0LXJpZ2h0XCI+JykuYXBwZW5kKFtcbiAgICAgICAgICAgICAgICAgICAgJCgnPGE+PGkgY2xhc3M9XCJmYSBmYS1waWN0dXJlLW9cIj4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9iLnBweS5zaC90aHVtYi8ke3Jvdy5iZWF0bWFwc2V0X2lkfS5qcGdgKSxcbiAgICAgICAgICAgICAgICAgICAgJCgnPGE+PGkgY2xhc3M9XCJmYSBmYS1kb3dubG9hZFwiPicpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignaHJlZicsIGBodHRwczovL29zdS5wcHkuc2gvZC8ke3Jvdy5iZWF0bWFwc2V0X2lkfW5gKSxcbiAgICAgICAgICAgICAgICAgICAgJCgnPGE+PGkgY2xhc3M9XCJmYSBmYS1jbG91ZC1kb3dubG9hZFwiPicpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignaHJlZicsIGBvc3U6Ly9kbC8ke3Jvdy5iZWF0bWFwc2V0X2lkfWApXG4gICAgICAgICAgICAgICAgXSkgOiAkKClcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByb3cubW9kcyxcbiAgICAgICAgICAgIHJvdy5hY2N1cmFjeS50b0ZpeGVkKDIpICsgJyUnLFxuICAgICAgICAgICAgcm93LmNvbWJvX2Rpc3BsYXksXG4gICAgICAgICAgICByb3cuZGF0ZV9wbGF5ZWRfc3RyaW5nLFxuICAgICAgICBdLm1hcCh4ID0+ICQoJzx0ZD4nKS5hcHBlbmQoeCkpKVswXSBhcyBIVE1MVGFibGVSb3dFbGVtZW50KTtcblxuICAgIHVuc29ydGVkVGFibGVSb3dzQ2hhbmdlZCA9IHRydWU7XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmNvbnN0IHJhbmtpbmdTb3J0S2V5cyA9IFtcbiAgICAoeDogUmFua2luZ1JvdykgPT4geC5yYW5rLFxuICAgICh4OiBSYW5raW5nUm93KSA9PiB4LnBwLFxuICAgICh4OiBSYW5raW5nUm93KSA9PiB4LnVzZXJuYW1lX2xvd2VyLFxuICAgICh4OiBSYW5raW5nUm93KSA9PiB4LmRpc3BsYXlfc3RyaW5nX2xvd2VyLFxuICAgICh4OiBSYW5raW5nUm93KSA9PiB4Lm1vZHMsXG4gICAgKHg6IFJhbmtpbmdSb3cpID0+IHguYWNjdXJhY3ksXG4gICAgKHg6IFJhbmtpbmdSb3cpID0+IHguY29tYm9fZGlzcGxheSxcbiAgICAoeDogUmFua2luZ1JvdykgPT4geC5kYXRlX3BsYXllZF9zdHJpbmcsXG5dO1xuXG5mdW5jdGlvbiBkcmF3UmFua2luZ1RhYmxlKCkge1xuICAgIGNvbnN0IGluZGljZXMgPSByYW5raW5nUm93cy5tYXAoKF9yb3csIGkpID0+IGkpO1xuICAgIGNvbnN0IHByZXZJbmRleCA9IEFycmF5KHJhbmtpbmdSb3dzLmxlbmd0aCk7XG4gICAgZm9yIChjb25zdCBvcmQgb2YgY3VycmVudFNvcnRPcmRlcikge1xuICAgICAgICBpZiAob3JkID09PSAwKSBjb250aW51ZTtcbiAgICAgICAgaW5kaWNlcy5mb3JFYWNoKCh4LCBpKSA9PiBwcmV2SW5kZXhbeF0gPSBpKTtcbiAgICAgICAgY29uc3Qgc29ydEtleSA9IHJhbmtpbmdTb3J0S2V5c1tNYXRoLmFicyhvcmQpIC0gMV07XG4gICAgICAgIGNvbnN0IHNpZ24gPSBvcmQgPiAwID8gMSA6IC0xO1xuICAgICAgICBpbmRpY2VzLnNvcnQoKHgsIHkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGt4ID0gc29ydEtleShyYW5raW5nUm93c1t4XSk7XG4gICAgICAgICAgICBjb25zdCBreSA9IHNvcnRLZXkocmFua2luZ1Jvd3NbeV0pO1xuICAgICAgICAgICAgcmV0dXJuIGt4IDwga3kgPyAtc2lnbiA6IGt4ID4ga3kgPyBzaWduIDogcHJldkluZGV4W3hdIC0gcHJldkluZGV4W3ldO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZHJhd1RhYmxlKGluZGljZXMpO1xufVxuXG5mdW5jdGlvbiByYW5raW5nTWFpbigpIHtcbiAgICBpbml0VGFibGUocmFua2luZ1NvcnRLZXlzLCByYW5raW5nT3JkZXJDb25maWcsIGRyYXdSYW5raW5nVGFibGUpO1xuICAgIGNvbnN0IGxvYWREYXRhID0gKGRhdGE6IFJhbmtpbmdSb3dEYXRhW10sIGxhc3RNb2RpZmllZDogRGF0ZSkgPT4ge1xuICAgICAgICAkKCcjbGFzdC11cGRhdGUtdGltZScpXG4gICAgICAgICAgICAuYXBwZW5kKCQoJzx0aW1lPicpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2RhdGV0aW1lJywgbGFzdE1vZGlmaWVkLnRvSVNPU3RyaW5nKCkpXG4gICAgICAgICAgICAgICAgLnRleHQobGFzdE1vZGlmaWVkLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSkpO1xuICAgICAgICByYW5raW5nUm93cyA9IGRhdGEubWFwKCh4LCBpKSA9PiBuZXcgUmFua2luZ1JvdyhpICsgMSwgeCkpO1xuICAgICAgICBpbml0VW5zb3J0ZWRSYW5raW5nVGFibGVSb3dzKCk7XG4gICAgICAgIGRyYXdSYW5raW5nVGFibGUoKTtcbiAgICAgICAgJCgnI3N1bW1hcnktdGFibGUtbG9hZGVyJykuaGlkZSgpO1xuICAgIH07XG4gICAgJC5nZXRKU09OKCdkYXRhL3JhbmtpbmcuanNvbicpLnRoZW4oKGRhdGEsIF8sIHhocikgPT4ge1xuICAgICAgICBsb2FkRGF0YShkYXRhLCBuZXcgRGF0ZSh4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnKSBhcyBzdHJpbmcpKTtcbiAgICB9KTtcbn1cblxuaWYgKC9yYW5raW5nXFwuaHRtbCQvaS50ZXN0KGxvY2F0aW9uLnBhdGhuYW1lKSkge1xuICAgICQocmFua2luZ01haW4pO1xufSBlbHNlIHtcbiAgICAkKG1haW4pO1xufVxuXG59XG4iXX0=