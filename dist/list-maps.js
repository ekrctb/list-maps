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
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
        function RankingRow(data) {
            this.data = data;
            this.rank = data[0], this.stars = data[1], this.pp = data[2], this.user_id = data[3], this.username = data[4], this.beatmap_id = data[5], this.beatmapset_id = data[6], this.display_string = data[7], this.mods = data[8], this.accuracy = data[9], this.combo_display = data[10], this.date_played_string = data[11];
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
            if (noTies.indexOf(key) !== -1)
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
            rankingRows = data.map(function (x) { return new RankingRow(x); });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1tYXBzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpc3QtbWFwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFVLFFBQVEsQ0E4OUJqQjtBQTk5QkQsV0FBVSxRQUFRO0lBZWxCLElBQU0sWUFBWSxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pDO1FBd0JJLG9CQUE2QixJQUFvQjtZQUFwQixTQUFJLEdBQUosSUFBSSxDQUFnQjtZQUV6Qyw4QkFBb0IsRUFDcEIsbUNBQXlCLEVBQ3pCLG1CQUFTLEVBQ1QseUJBQWUsRUFDZiw0QkFBa0IsRUFDbEIsNkJBQW1CLEVBQ25CLG9CQUFVLEVBQ1YsaUJBQU8sRUFDUCx5QkFBZSxFQUNmLHdCQUFjLEVBQ2QsNkJBQWtCLEVBQ2xCLDJCQUFnQixFQUNoQiwwQkFBZSxFQUNmLG9CQUFTLEVBQ1Qsb0JBQVMsRUFDVCxvQkFBUyxFQUNULHNCQUFXLEVBQ1gsb0JBQVMsRUFDVCxzQkFBVyxDQUNOO1lBQ1QsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQztZQUN0RixJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM5RCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNyQixDQUFDO1FBQ0wsaUJBQUM7SUFBRCxDQUFDLEFBbkRELElBbURDO0lBTUQ7UUFnQkksb0JBQTZCLElBQW9CO1lBQXBCLFNBQUksR0FBSixJQUFJLENBQWdCO1lBRXpDLG1CQUFTLEVBQ1Qs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Q0FBQztZQUN6RCxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFqQixDQUFpQixDQUFDLENBQUM7WUFDL0MsNEJBQTRCLEVBQUUsQ0FBQztZQUMvQixnQkFBZ0IsRUFBRSxDQUFDO1lBQ25CLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3RDLENBQUMsQ0FBQztRQUNGLENBQUMsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUc7WUFDN0MsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFXLENBQUMsQ0FBQyxDQUFDO1FBQy9FLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBQUMsSUFBSSxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDWixDQUFDO0FBRUQsQ0FBQyxFQTk5QlMsUUFBUSxLQUFSLFFBQVEsUUE4OUJqQiIsInNvdXJjZXNDb250ZW50IjpbIm5hbWVzcGFjZSBMaXN0TWFwcyB7XHJcblxyXG5pbnRlcmZhY2UgSlF1ZXJ5IHtcclxuICAgIHRhYmxlc29ydCgpOiB2b2lkO1xyXG4gICAgZGF0YShrZXk6ICdzb3J0QnknLCBrZXlGdW5jOiAoXHJcbiAgICAgICAgdGg6IEhUTUxUYWJsZUhlYWRlckNlbGxFbGVtZW50LFxyXG4gICAgICAgIHRkOiBIVE1MVGFibGVEYXRhQ2VsbEVsZW1lbnQsXHJcbiAgICAgICAgdGFibGVzb3J0OiBhbnkpID0+IHZvaWQpOiB0aGlzO1xyXG59XHJcblxyXG50eXBlIFN1bW1hcnlSb3dEYXRhID1cclxuW1xyXG4gICAgbnVtYmVyLCBzdHJpbmcsIG51bWJlciwgc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgbnVtYmVyLCBudW1iZXIsIG51bWJlcixcclxuICAgIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyXHJcbl07XHJcbmNvbnN0IE1JTklNVU1fREFURSA9IG5ldyBEYXRlKDApO1xyXG5jbGFzcyBTdW1tYXJ5Um93IHtcclxuICAgIGFwcHJvdmVkX3N0YXR1czogbnVtYmVyO1xyXG4gICAgYXBwcm92ZWRfZGF0ZV9zdHJpbmc6IHN0cmluZztcclxuICAgIGFwcHJvdmVkX2RhdGU6IERhdGU7XHJcbiAgICBtb2RlOiBudW1iZXI7XHJcbiAgICBiZWF0bWFwX2lkOiBzdHJpbmc7XHJcbiAgICBiZWF0bWFwX2lkX251bWJlcjogbnVtYmVyO1xyXG4gICAgYmVhdG1hcHNldF9pZDogc3RyaW5nO1xyXG4gICAgZGlzcGxheV9zdHJpbmc6IHN0cmluZztcclxuICAgIGRpc3BsYXlfc3RyaW5nX2xvd2VyOiBzdHJpbmc7XHJcbiAgICBzdGFyczogbnVtYmVyO1xyXG4gICAgcHA6IG51bWJlcjtcclxuICAgIGhpdF9sZW5ndGg6IG51bWJlcjtcclxuICAgIG1heF9jb21ibzogbnVtYmVyO1xyXG4gICAgYXBwcm9hY2hfcmF0ZTogbnVtYmVyO1xyXG4gICAgY2lyY2xlX3NpemU6IG51bWJlcjtcclxuICAgIG1pbl9taXNzZXM6IG51bWJlcjtcclxuICAgIGZjTk06IG51bWJlcjtcclxuICAgIGZjSEQ6IG51bWJlcjtcclxuICAgIGZjSFI6IG51bWJlcjtcclxuICAgIGZjSERIUjogbnVtYmVyO1xyXG4gICAgZmNEVDogbnVtYmVyO1xyXG4gICAgZmNIRERUOiBudW1iZXI7XHJcbiAgICBpbmZvOiBCZWF0bWFwSW5mbyB8IG51bGw7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGRhdGE6IFN1bW1hcnlSb3dEYXRhKSB7XHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgICB0aGlzLmFwcHJvdmVkX3N0YXR1cyxcclxuICAgICAgICAgICAgdGhpcy5hcHByb3ZlZF9kYXRlX3N0cmluZyxcclxuICAgICAgICAgICAgdGhpcy5tb2RlLFxyXG4gICAgICAgICAgICB0aGlzLmJlYXRtYXBfaWQsXHJcbiAgICAgICAgICAgIHRoaXMuYmVhdG1hcHNldF9pZCxcclxuICAgICAgICAgICAgdGhpcy5kaXNwbGF5X3N0cmluZyxcclxuICAgICAgICAgICAgdGhpcy5zdGFycyxcclxuICAgICAgICAgICAgdGhpcy5wcCxcclxuICAgICAgICAgICAgdGhpcy5oaXRfbGVuZ3RoLFxyXG4gICAgICAgICAgICB0aGlzLm1heF9jb21ibyxcclxuICAgICAgICAgICAgdGhpcy5hcHByb2FjaF9yYXRlLFxyXG4gICAgICAgICAgICB0aGlzLmNpcmNsZV9zaXplLFxyXG4gICAgICAgICAgICB0aGlzLm1pbl9taXNzZXMsXHJcbiAgICAgICAgICAgIHRoaXMuZmNOTSxcclxuICAgICAgICAgICAgdGhpcy5mY0hELFxyXG4gICAgICAgICAgICB0aGlzLmZjSFIsXHJcbiAgICAgICAgICAgIHRoaXMuZmNIREhSLFxyXG4gICAgICAgICAgICB0aGlzLmZjRFQsXHJcbiAgICAgICAgICAgIHRoaXMuZmNIRERULFxyXG4gICAgICAgIF0gPSBkYXRhO1xyXG4gICAgICAgIHRoaXMuYmVhdG1hcF9pZF9udW1iZXIgPSBwYXJzZUludCh0aGlzLmJlYXRtYXBfaWQpO1xyXG4gICAgICAgIHRoaXMuYXBwcm92ZWRfZGF0ZSA9IG5ldyBEYXRlKHRoaXMuYXBwcm92ZWRfZGF0ZV9zdHJpbmcucmVwbGFjZSgnICcsICdUJykgKyAnKzA4OjAwJyk7XHJcbiAgICAgICAgdGhpcy5kaXNwbGF5X3N0cmluZ19sb3dlciA9IHRoaXMuZGlzcGxheV9zdHJpbmcudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICB0aGlzLmluZm8gPSBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG50eXBlIFJhbmtpbmdSb3dEYXRhID1cclxuW1xyXG4gICAgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgbnVtYmVyLCBzdHJpbmcsIHN0cmluZ1xyXG5dO1xyXG5jbGFzcyBSYW5raW5nUm93IHtcclxuICAgIHJhbms6IG51bWJlcjtcclxuICAgIHN0YXJzOiBudW1iZXI7XHJcbiAgICBwcDogbnVtYmVyO1xyXG4gICAgdXNlcl9pZDogc3RyaW5nO1xyXG4gICAgdXNlcm5hbWU6IHN0cmluZztcclxuICAgIHVzZXJuYW1lX2xvd2VyOiBzdHJpbmc7XHJcbiAgICBiZWF0bWFwX2lkOiBzdHJpbmc7XHJcbiAgICBiZWF0bWFwX2lkX251bWJlcjogbnVtYmVyO1xyXG4gICAgYmVhdG1hcHNldF9pZDogc3RyaW5nO1xyXG4gICAgZGlzcGxheV9zdHJpbmc6IHN0cmluZztcclxuICAgIGRpc3BsYXlfc3RyaW5nX2xvd2VyOiBzdHJpbmc7XHJcbiAgICBtb2RzOiBzdHJpbmc7XHJcbiAgICBhY2N1cmFjeTogbnVtYmVyO1xyXG4gICAgY29tYm9fZGlzcGxheTogc3RyaW5nO1xyXG4gICAgZGF0ZV9wbGF5ZWRfc3RyaW5nOiBzdHJpbmc7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGRhdGE6IFJhbmtpbmdSb3dEYXRhKSB7XHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgICB0aGlzLnJhbmssXHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnMsXHJcbiAgICAgICAgICAgIHRoaXMucHAsXHJcbiAgICAgICAgICAgIHRoaXMudXNlcl9pZCxcclxuICAgICAgICAgICAgdGhpcy51c2VybmFtZSxcclxuICAgICAgICAgICAgdGhpcy5iZWF0bWFwX2lkLFxyXG4gICAgICAgICAgICB0aGlzLmJlYXRtYXBzZXRfaWQsXHJcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheV9zdHJpbmcsXHJcbiAgICAgICAgICAgIHRoaXMubW9kcyxcclxuICAgICAgICAgICAgdGhpcy5hY2N1cmFjeSxcclxuICAgICAgICAgICAgdGhpcy5jb21ib19kaXNwbGF5LFxyXG4gICAgICAgICAgICB0aGlzLmRhdGVfcGxheWVkX3N0cmluZ1xyXG4gICAgICAgIF0gPSBkYXRhO1xyXG4gICAgICAgIHRoaXMuYmVhdG1hcF9pZF9udW1iZXIgPSBwYXJzZUludCh0aGlzLmJlYXRtYXBfaWQpO1xyXG4gICAgICAgIHRoaXMudXNlcm5hbWVfbG93ZXIgPSB0aGlzLnVzZXJuYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgdGhpcy5kaXNwbGF5X3N0cmluZ19sb3dlciA9IHRoaXMuZGlzcGxheV9zdHJpbmcudG9Mb3dlckNhc2UoKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmxldCBzdW1tYXJ5Um93czogU3VtbWFyeVJvd1tdID0gW107XHJcbmxldCByYW5raW5nUm93czogUmFua2luZ1Jvd1tdID0gW107XHJcbmxldCB1bnNvcnRlZFRhYmxlUm93czogSFRNTFRhYmxlUm93RWxlbWVudFtdID0gW107XHJcbmxldCBjdXJyZW50U29ydE9yZGVyOiBudW1iZXJbXSA9IFtdO1xyXG5sZXQgY3VycmVudEhhc2hMaW5rID0gJyMnO1xyXG5cclxubGV0IHByZXZpb3VzSW5kaWNlcyA9ICcnO1xyXG5sZXQgdW5zb3J0ZWRUYWJsZVJvd3NDaGFuZ2VkID0gZmFsc2U7XHJcbmZ1bmN0aW9uIGRyYXdUYWJsZShpbmRpY2VzOiBudW1iZXJbXSkge1xyXG4gICAgY29uc3Qgc3RyID0gaW5kaWNlcy5qb2luKCcsJyk7XHJcbiAgICBpZiAoIXVuc29ydGVkVGFibGVSb3dzQ2hhbmdlZCAmJiBwcmV2aW91c0luZGljZXMgPT09IHN0cikgcmV0dXJuO1xyXG4gICAgdW5zb3J0ZWRUYWJsZVJvd3NDaGFuZ2VkID0gZmFsc2U7XHJcbiAgICBwcmV2aW91c0luZGljZXMgPSBzdHI7XHJcbiAgICAkKCcjc3VtbWFyeS10YWJsZSA+IHRib2R5JylcclxuICAgICAgICAuZW1wdHkoKVxyXG4gICAgICAgIC5hcHBlbmQoaW5kaWNlcy5tYXAoaW5kZXggPT4gdW5zb3J0ZWRUYWJsZVJvd3NbaW5kZXhdKSk7XHJcbn1cclxuXHJcbmNsYXNzIFNlYXJjaFF1ZXJ5IHtcclxuICAgIHB1YmxpYyByZWFkb25seSBjaGVjazogKHJvdzogU3VtbWFyeVJvdykgPT4gYm9vbGVhbjtcclxuICAgIHB1YmxpYyByZWFkb25seSBub3JtYWxpemVkX3NvdXJjZTogc3RyaW5nO1xyXG4gICAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IHNvdXJjZTogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3Qga2V5X3RvX3Byb3BlcnR5X25hbWUgPSB7XHJcbiAgICAgICAgICAgICdzdGF0dXMnOiAnXCJwcHByYXFsXCJbcm93LmFwcHJvdmVkX3N0YXR1cysyXScsXHJcbiAgICAgICAgICAgICdtb2RlJzogJ1wib3RjbVwiW3Jvdy5tb2RlXScsXHJcbiAgICAgICAgICAgICdzdGFycyc6ICdyb3cuc3RhcnMnLFxyXG4gICAgICAgICAgICAncHAnOiAncm93LnBwJyxcclxuICAgICAgICAgICAgJ2xlbmd0aCc6ICdyb3cuaGl0X2xlbmd0aCcsXHJcbiAgICAgICAgICAgICdjb21ibyc6ICdyb3cubWF4X2NvbWJvJyxcclxuICAgICAgICAgICAgJ2FyJzogJ3Jvdy5hcHByb2FjaF9yYXRlJyxcclxuICAgICAgICAgICAgJ2NzJzogJ3Jvdy5jaXJjbGVfc2l6ZScsXHJcbiAgICAgICAgICAgICdwbGF5ZWQnOiBgKCFyb3cuaW5mbz9JbmZpbml0eTooJHtuZXcgRGF0ZSgpLnZhbHVlT2YoKX0tcm93LmluZm8ubGFzdFBsYXllZC52YWx1ZU9mKCkpLyR7MWUzICogNjAgKiA2MCAqIDI0fSlgLFxyXG4gICAgICAgICAgICAndW5wbGF5ZWQnOiBgKHJvdy5pbmZvJiZyb3cuaW5mby5sYXN0UGxheWVkLnZhbHVlT2YoKSE9PSR7TUlOSU1VTV9EQVRFLnZhbHVlT2YoKX0/J3knOicnKWAsXHJcbiAgICAgICAgICAgICdkYXRlJzogYCgke25ldyBEYXRlKCkudmFsdWVPZigpfS1yb3cuYXBwcm92ZWRfZGF0ZS52YWx1ZU9mKCkpLyR7MWUzICogNjAgKiA2MCAqIDI0fWAsXHJcbiAgICAgICAgICAgICdyYW5rJzogYCgke0pTT04uc3RyaW5naWZ5KHJhbmtBY2hpZXZlZENsYXNzKX1bIXJvdy5pbmZvPzk6cm93LmluZm8ucmFua0FjaGlldmVkXSkudG9Mb3dlckNhc2UoKWBcclxuICAgICAgICB9O1xyXG4gICAgICAgIGNvbnN0IHJlZ2V4cCA9IG5ldyBSZWdFeHAoYCgke1xyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhrZXlfdG9fcHJvcGVydHlfbmFtZSkuam9pbignfCcpXHJcbiAgICAgICAgfSkoPD0/fD49P3w9fCE9KShbLVxcXFx3XFxcXC5dKilgKTtcclxuICAgICAgICBsZXQgY2hlY2tfZnVuY19zb3VyY2UgPSAncmV0dXJuIHRydWUnO1xyXG4gICAgICAgIHRoaXMubm9ybWFsaXplZF9zb3VyY2UgPSAnJztcclxuICAgICAgICBmb3IgKGNvbnN0IHRva2VuIG9mIHNvdXJjZS5zcGxpdCgnICcpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRyaW1tZWQgPSB0b2tlbi50cmltKCk7XHJcbiAgICAgICAgICAgIGlmICh0cmltbWVkID09PSAnJykgY29udGludWU7XHJcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gcmVnZXhwLmV4ZWModHJpbW1lZCk7XHJcbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qga2V5ID0gbWF0Y2hbMV07XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZWwgPSBtYXRjaFsyXSA9PT0gJz0nID8gJz09JyA6IG1hdGNoWzJdO1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbDogbnVtYmVyIHwgc3RyaW5nID0gcGFyc2VGbG9hdChtYXRjaFszXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNOYU4odmFsKSlcclxuICAgICAgICAgICAgICAgICAgICB2YWwgPSBtYXRjaFszXS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcCA9IChrZXlfdG9fcHJvcGVydHlfbmFtZSBhcyBhbnkpW2tleV07XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ub3JtYWxpemVkX3NvdXJjZSAhPT0gJycpIHRoaXMubm9ybWFsaXplZF9zb3VyY2UgKz0gJyAnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ub3JtYWxpemVkX3NvdXJjZSArPSBtYXRjaFsxXSArIG1hdGNoWzJdICsgbWF0Y2hbM107XHJcbiAgICAgICAgICAgICAgICBjaGVja19mdW5jX3NvdXJjZSArPSBgJiYke3Byb3B9JHtyZWx9JHtKU09OLnN0cmluZ2lmeSh2YWwpfWA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdHIgPSB0cmltbWVkLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlc2NhcGVkID0gSlNPTi5zdHJpbmdpZnkoc3RyKTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5vcm1hbGl6ZWRfc291cmNlICE9PSAnJykgdGhpcy5ub3JtYWxpemVkX3NvdXJjZSArPSAnICc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5vcm1hbGl6ZWRfc291cmNlICs9IHN0cjtcclxuICAgICAgICAgICAgICAgIGNoZWNrX2Z1bmNfc291cmNlICs9IGAmJnJvdy5kaXNwbGF5X3N0cmluZ19sb3dlci5pbmRleE9mKCR7ZXNjYXBlZH0pIT09LTFgO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY2hlY2sgPSBuZXcgRnVuY3Rpb24oJ3JvdycsIGNoZWNrX2Z1bmNfc291cmNlKSBhcyBhbnk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNvbnN0IHNvcnRLZXlzID0gW1xyXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHguYXBwcm92ZWRfZGF0ZV9zdHJpbmcsXHJcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5kaXNwbGF5X3N0cmluZ19sb3dlcixcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LnN0YXJzLFxyXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHgucHAsXHJcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5oaXRfbGVuZ3RoLFxyXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHgubWF4X2NvbWJvLFxyXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHguYXBwcm9hY2hfcmF0ZSxcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LmNpcmNsZV9zaXplLFxyXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+XHJcbiAgICAgICAgeC5mY0hERFQgKiAyICsgeC5mY0RUICogMWU4ICtcclxuICAgICAgICB4LmZjSERIUiAqIDIgKyB4LmZjSFIgKiAxZTQgK1xyXG4gICAgICAgIHguZmNIRCAqIDIgKyB4LmZjTk0gLVxyXG4gICAgICAgIHgubWluX21pc3NlcyxcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiAheC5pbmZvID8gTUlOSU1VTV9EQVRFLnZhbHVlT2YoKSA6IHguaW5mby5sYXN0UGxheWVkLnZhbHVlT2YoKVxyXG5dO1xyXG5cclxuZnVuY3Rpb24gc3RyaW5naWZ5T2JqZWN0KG9iajogeyBba2V5OiBzdHJpbmddOiBzdHJpbmc7IH0pOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iailcclxuICAgICAgICAubWFwKGsgPT4gayArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChvYmpba10pKVxyXG4gICAgICAgIC5qb2luKCcmJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlT2JqZWN0KHN0cjogc3RyaW5nKSB7XHJcbiAgICBjb25zdCByZXMgPSB7fTtcclxuICAgIHN0ci5zcGxpdCgnJicpLmZvckVhY2gocGFydCA9PiB7XHJcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBwYXJ0Lm1hdGNoKC8oXFx3Kyk9KC4rKS8pO1xyXG4gICAgICAgIGlmIChtYXRjaClcclxuICAgICAgICAgICAgKHJlcyBhcyBhbnkpW21hdGNoWzFdXSA9IGRlY29kZVVSSUNvbXBvbmVudChtYXRjaFsyXSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRyYXdUYWJsZUZvckN1cnJlbnRGaWx0ZXJpbmcoKSB7XHJcbiAgICBjb25zdCBmaWx0ZXJfYXBwcm92ZWRfc3RhdHVzID0gcGFyc2VJbnQoJCgnI2ZpbHRlci1hcHByb3ZlZC1zdGF0dXMnKS52YWwoKSBhcyBzdHJpbmcpO1xyXG4gICAgY29uc3QgZmlsdGVyX21vZGUgPSBwYXJzZUludCgkKCcjZmlsdGVyLW1vZGUnKS52YWwoKSBhcyBzdHJpbmcpO1xyXG4gICAgY29uc3QgZmlsdGVyX3NlYXJjaF9xdWVyeSA9IG5ldyBTZWFyY2hRdWVyeSgoJCgnI2ZpbHRlci1zZWFyY2gtcXVlcnknKS52YWwoKSBhcyBzdHJpbmcpKTtcclxuICAgIGNvbnN0IGZpbHRlcl9mY19sZXZlbCA9IHBhcnNlSW50KCQoJyNmaWx0ZXItZmMtbGV2ZWwnKS52YWwoKSBhcyBzdHJpbmcpO1xyXG4gICAgY29uc3QgZmlsdGVyX2xvY2FsX2RhdGEgPSBwYXJzZUludCgkKCcjZmlsdGVyLWxvY2FsLWRhdGEnKS52YWwoKSBhcyBzdHJpbmcpO1xyXG4gICAgY29uc3Qgc2hvd19mdWxsX3Jlc3VsdCA9ICQoJyNzaG93LWZ1bGwtcmVzdWx0JykucHJvcCgnY2hlY2tlZCcpO1xyXG5cclxuICAgIGNvbnN0IGdldF9mY19sZXZlbCA9IChyb3c6IFN1bW1hcnlSb3cpID0+IHtcclxuICAgICAgICBpZiAocm93Lm1pbl9taXNzZXMgIT09IDApIHJldHVybiAxO1xyXG4gICAgICAgIGlmIChyb3cuZmNEVCAhPT0gMCB8fCByb3cuZmNIRERUICE9PSAwKSByZXR1cm4gODtcclxuICAgICAgICBpZiAocm93LmZjTk0gPT09IDAgJiYgcm93LmZjSEQgPT09IDAgJiYgcm93LmZjSFIgPT09IDAgJiYgcm93LmZjSERIUiA9PT0gMCkgcmV0dXJuIDI7XHJcbiAgICAgICAgaWYgKHJvdy5mY05NID09PSAwICYmIHJvdy5mY0hEID09PSAwKSByZXR1cm4gMztcclxuICAgICAgICBpZiAocm93LmZjSEQgPT09IDApIHJldHVybiA0O1xyXG4gICAgICAgIGlmIChyb3cuZmNIUiA9PT0gMCAmJiByb3cuZmNIREhSID09PSAwKSByZXR1cm4gNTtcclxuICAgICAgICBpZiAocm93LmZjSERIUiA9PT0gMCkgcmV0dXJuIDY7XHJcbiAgICAgICAgcmV0dXJuIDc7XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGdldF9sb2NhbF9kYXRhX2ZsYWdzID0gKHJvdzogU3VtbWFyeVJvdyk6IG51bWJlciA9PiB7XHJcbiAgICAgICAgaWYgKGJlYXRtYXBJbmZvTWFwLnNpemUgPT09IDApIHJldHVybiAtMTtcclxuICAgICAgICBsZXQgZmxhZ3MgPSAwO1xyXG4gICAgICAgIGNvbnN0IGluZm8gPSBiZWF0bWFwSW5mb01hcC5nZXQocm93LmJlYXRtYXBfaWRfbnVtYmVyKTtcclxuICAgICAgICBpZiAoIWluZm8pIHJldHVybiAwO1xyXG4gICAgICAgIGZsYWdzIHw9IDI7XHJcbiAgICAgICAgaWYgKGluZm8ubGFzdFBsYXllZC52YWx1ZU9mKCkgIT09IE1JTklNVU1fREFURS52YWx1ZU9mKCkpXHJcbiAgICAgICAgICAgIGZsYWdzIHw9IDE7XHJcbiAgICAgICAgcmV0dXJuIGZsYWdzO1xyXG4gICAgfTtcclxuXHJcbiAgICBjdXJyZW50SGFzaExpbmsgPSAnIyc7XHJcbiAgICBjb25zdCBvYmogPSB7fSBhcyB7IFtrZXk6IHN0cmluZ106IHN0cmluZzsgfTtcclxuICAgIGlmIChmaWx0ZXJfYXBwcm92ZWRfc3RhdHVzICE9PSAxKVxyXG4gICAgICAgIG9iai5zID0gZmlsdGVyX2FwcHJvdmVkX3N0YXR1cy50b1N0cmluZygpO1xyXG4gICAgaWYgKGZpbHRlcl9tb2RlICE9PSAzKVxyXG4gICAgICAgIG9iai5tID0gZmlsdGVyX21vZGUudG9TdHJpbmcoKTtcclxuICAgIGlmIChmaWx0ZXJfc2VhcmNoX3F1ZXJ5Lm5vcm1hbGl6ZWRfc291cmNlICE9PSAnJylcclxuICAgICAgICBvYmoucSA9IGZpbHRlcl9zZWFyY2hfcXVlcnkubm9ybWFsaXplZF9zb3VyY2U7XHJcbiAgICBpZiAoZmlsdGVyX2ZjX2xldmVsICE9PSAwKVxyXG4gICAgICAgIG9iai5sID0gZmlsdGVyX2ZjX2xldmVsLnRvU3RyaW5nKCk7XHJcbiAgICBpZiAoZmlsdGVyX2xvY2FsX2RhdGEgIT09IDApXHJcbiAgICAgICAgb2JqLmQgPSBmaWx0ZXJfbG9jYWxfZGF0YS50b1N0cmluZygpO1xyXG4gICAgaWYgKGN1cnJlbnRTb3J0T3JkZXIubGVuZ3RoICE9PSAwKVxyXG4gICAgICAgIG9iai5vID0gY3VycmVudFNvcnRPcmRlci5qb2luKCcuJyk7XHJcbiAgICBpZiAoc2hvd19mdWxsX3Jlc3VsdClcclxuICAgICAgICBvYmouZiA9ICcxJztcclxuXHJcbiAgICBjdXJyZW50SGFzaExpbmsgKz0gc3RyaW5naWZ5T2JqZWN0KG9iaik7XHJcbiAgICBoaXN0b3J5LnJlcGxhY2VTdGF0ZSh7fSwgZG9jdW1lbnQudGl0bGUsIGxvY2F0aW9uLnBhdGhuYW1lICsgKGN1cnJlbnRIYXNoTGluayA9PT0gJyMnID8gJycgOiBjdXJyZW50SGFzaExpbmspKTtcclxuXHJcbiAgICBjb25zdCBpbmRpY2VzID0gc3VtbWFyeVJvd3MubWFwKChfLCBpbmRleCkgPT4gaW5kZXgpLmZpbHRlcihpbmRleCA9PiB7XHJcbiAgICAgICAgY29uc3Qgcm93ID0gc3VtbWFyeVJvd3NbaW5kZXhdO1xyXG5cclxuICAgICAgICBpZiAoZmlsdGVyX2FwcHJvdmVkX3N0YXR1cyA9PT0gMSAmJlxyXG4gICAgICAgICAgICAocm93LmFwcHJvdmVkX3N0YXR1cyAhPT0gMSAmJiByb3cuYXBwcm92ZWRfc3RhdHVzICE9PSAyKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGlmIChmaWx0ZXJfYXBwcm92ZWRfc3RhdHVzID09PSAyICYmIHJvdy5hcHByb3ZlZF9zdGF0dXMgIT09IDQpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKGZpbHRlcl9tb2RlID09PSAxICYmIHJvdy5tb2RlICE9PSAwKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgaWYgKGZpbHRlcl9tb2RlID09PSAyICYmIHJvdy5tb2RlICE9PSAyKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICghZmlsdGVyX3NlYXJjaF9xdWVyeS5jaGVjayhyb3cpKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmIChmaWx0ZXJfZmNfbGV2ZWwgIT09IDAgJiYgZ2V0X2ZjX2xldmVsKHJvdykgIT09IGZpbHRlcl9mY19sZXZlbClcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoZmlsdGVyX2xvY2FsX2RhdGEgIT09IDApIHtcclxuICAgICAgICAgICAgY29uc3QgZmxhZ3MgPSBnZXRfbG9jYWxfZGF0YV9mbGFncyhyb3cpO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGZpbHRlcl9sb2NhbF9kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDE6IGlmICgoZmxhZ3MgJiAxKSAhPT0gMCkgcmV0dXJuIGZhbHNlOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgMjogaWYgKChmbGFncyAmIDEpID09PSAwKSByZXR1cm4gZmFsc2U7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAzOiBpZiAoKGZsYWdzICYgMikgIT09IDApIHJldHVybiBmYWxzZTsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDQ6IGlmICgoZmxhZ3MgJiAyKSA9PT0gMCkgcmV0dXJuIGZhbHNlOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogaWYgKChmbGFncyAmIDMpICE9PSAyKSByZXR1cm4gZmFsc2U7IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHByZXZJbmRleCA9IEFycmF5KHN1bW1hcnlSb3dzLmxlbmd0aCk7XHJcbiAgICBmb3IgKGNvbnN0IG9yZCBvZiBjdXJyZW50U29ydE9yZGVyKSB7XHJcbiAgICAgICAgaWYgKG9yZCA9PT0gMCkgY29udGludWU7XHJcbiAgICAgICAgaW5kaWNlcy5mb3JFYWNoKCh4LCBpKSA9PiBwcmV2SW5kZXhbeF0gPSBpKTtcclxuICAgICAgICBjb25zdCBzb3J0S2V5ID0gc29ydEtleXNbTWF0aC5hYnMob3JkKSAtIDFdO1xyXG4gICAgICAgIGNvbnN0IHNpZ24gPSBvcmQgPiAwID8gMSA6IC0xO1xyXG4gICAgICAgIGluZGljZXMuc29ydCgoeCwgeSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBreCA9IHNvcnRLZXkoc3VtbWFyeVJvd3NbeF0pO1xyXG4gICAgICAgICAgICBjb25zdCBreSA9IHNvcnRLZXkoc3VtbWFyeVJvd3NbeV0pO1xyXG4gICAgICAgICAgICByZXR1cm4ga3ggPCBreSA/IC1zaWduIDoga3ggPiBreSA/IHNpZ24gOiBwcmV2SW5kZXhbeF0gLSBwcmV2SW5kZXhbeV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgJCgnI251bS1yZXN1bHRzJykudGV4dChpbmRpY2VzLmxlbmd0aCA9PT0gMSA/ICcxIG1hcCcgOiBpbmRpY2VzLmxlbmd0aC50b1N0cmluZygpICsgJyBtYXBzJyk7XHJcbiAgICBjb25zdCB0cnVuY2F0ZV9udW0gPSBzaG93X2Z1bGxfcmVzdWx0ID8gSW5maW5pdHkgOiAxMDA7XHJcbiAgICBpZiAoaW5kaWNlcy5sZW5ndGggPiB0cnVuY2F0ZV9udW0pXHJcbiAgICAgICAgaW5kaWNlcy5sZW5ndGggPSB0cnVuY2F0ZV9udW07XHJcblxyXG4gICAgJCgnI2hhc2gtbGluay10by10aGUtY3VycmVudC10YWJsZScpLmF0dHIoJ2hyZWYnLCBjdXJyZW50SGFzaExpbmspO1xyXG5cclxuICAgIGRyYXdUYWJsZShpbmRpY2VzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2ltcGxpZnlTb3J0T3JkZXIob3JkZXI6IG51bWJlcltdLCBbbm9UaWVzLCBkZWZhdWx0T3JkZXJdOiBbbnVtYmVyW10sIG51bWJlcl0pOiBudW1iZXJbXSB7XHJcbiAgICBjb25zdCByZXMgPSBbXTtcclxuICAgIGNvbnN0IHNlZW4gPSBBcnJheShzb3J0S2V5cy5sZW5ndGgpO1xyXG4gICAgZm9yIChsZXQgaSA9IG9yZGVyLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS0gaSkge1xyXG4gICAgICAgIGNvbnN0IHggPSBvcmRlcltpXTtcclxuICAgICAgICBpZiAoeCA9PT0gMCkgY29udGludWU7XHJcbiAgICAgICAgY29uc3Qga2V5ID0gTWF0aC5hYnMoeCkgLSAxLCBzaWduID0geCA+IDAgPyAxIDogLTE7XHJcbiAgICAgICAgaWYgKHNlZW5ba2V5XSkgY29udGludWU7XHJcbiAgICAgICAgc2VlbltrZXldID0gc2lnbjtcclxuICAgICAgICByZXMucHVzaCh4KTtcclxuICAgICAgICBpZiAobm9UaWVzLmluZGV4T2Yoa2V5KSAhPT0gLTEpIC8vIHRoZXJlIGlzIGFsbW9zdCBubyB0aWVzXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgaWYgKHJlcy5sZW5ndGggIT09IDAgJiYgcmVzW3Jlcy5sZW5ndGggLSAxXSA9PT0gZGVmYXVsdE9yZGVyKVxyXG4gICAgICAgIHJlcy5wb3AoKTtcclxuICAgIHJlcy5yZXZlcnNlKCk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5jb25zdCBzdW1tYXJ5T3JkZXJDb25maWc6IFtudW1iZXJbXSwgbnVtYmVyXSA9IFtbMCwgMSwgMiwgMywgNCwgNSwgOV0sIC0zXTtcclxuY29uc3QgcmFua2luZ09yZGVyQ29uZmlnOiBbbnVtYmVyW10sIG51bWJlcl0gPSBbWzAsIDEsIDddLCAxXTtcclxuZnVuY3Rpb24gc2V0UXVlcnlBY2NvcmRpbmdUb0hhc2goKSB7XHJcbiAgICBsZXQgb2JqOiB7IFtrOiBzdHJpbmddOiBzdHJpbmc7IH07XHJcbiAgICB0cnkge1xyXG4gICAgICAgIG9iaiA9IHBhcnNlT2JqZWN0KGxvY2F0aW9uLmhhc2guc3Vic3RyKDEpKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBvYmogPSB7fTtcclxuICAgIH1cclxuICAgIGlmIChvYmoucyA9PT0gdW5kZWZpbmVkKSBvYmoucyA9ICcxJztcclxuICAgIGlmIChvYmoubSA9PT0gdW5kZWZpbmVkKSBvYmoubSA9ICczJztcclxuICAgIGlmIChvYmoucSA9PT0gdW5kZWZpbmVkKSBvYmoucSA9ICcnO1xyXG4gICAgaWYgKG9iai5sID09PSB1bmRlZmluZWQpIG9iai5sID0gJzAnO1xyXG4gICAgaWYgKG9iai5vID09PSB1bmRlZmluZWQpIG9iai5vID0gJyc7XHJcbiAgICBpZiAob2JqLmYgPT09IHVuZGVmaW5lZCkgb2JqLmYgPSAnMCc7XHJcbiAgICBpZiAob2JqLmQgPT09IHVuZGVmaW5lZCkgb2JqLmQgPSAnMCc7XHJcbiAgICAkKCcjZmlsdGVyLWFwcHJvdmVkLXN0YXR1cycpLnZhbChwYXJzZUludChvYmoucykpO1xyXG4gICAgJCgnI2ZpbHRlci1tb2RlJykudmFsKHBhcnNlSW50KG9iai5tKSk7XHJcbiAgICAkKCcjZmlsdGVyLXNlYXJjaC1xdWVyeScpLnZhbChvYmoucSk7XHJcbiAgICAkKCcjZmlsdGVyLWZjLWxldmVsJykudmFsKHBhcnNlSW50KG9iai5sKSk7XHJcbiAgICAkKCcjZmlsdGVyLWxvY2FsLWRhdGEnKS52YWwocGFyc2VJbnQob2JqLmQpKTtcclxuICAgICQoJyNzaG93LWZ1bGwtcmVzdWx0JykucHJvcCgnY2hlY2tlZCcsICEhcGFyc2VJbnQob2JqLmYpKTtcclxuICAgIGN1cnJlbnRTb3J0T3JkZXIgPSBzaW1wbGlmeVNvcnRPcmRlcihvYmouby5zcGxpdCgnLicpLm1hcCh4ID0+IHBhcnNlSW50KHgpIHx8IDApLCBzdW1tYXJ5T3JkZXJDb25maWcpO1xyXG4gICAgc2V0VGFibGVIZWFkU29ydGluZ01hcmsoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0VGFibGVIZWFkU29ydGluZ01hcmsoKSB7XHJcbiAgICAkKCcuc29ydGVkJykucmVtb3ZlQ2xhc3MoJ3NvcnRlZCBhc2NlbmRpbmcgZGVzY2VuZGluZycpO1xyXG4gICAgY29uc3QgeCA9IGN1cnJlbnRTb3J0T3JkZXIubGVuZ3RoID09PSAwID9cclxuICAgICAgICAtMyA6IC8vIHN0YXJzIGRlc2NcclxuICAgICAgICBjdXJyZW50U29ydE9yZGVyW2N1cnJlbnRTb3J0T3JkZXIubGVuZ3RoIC0gMV07XHJcbiAgICBjb25zdCBpbmRleCA9IE1hdGguYWJzKHgpIC0gMTtcclxuICAgICQoJCgnI3N1bW1hcnktdGFibGUgPiB0aGVhZCA+IHRyID4gdGgnKVtpbmRleF0pXHJcbiAgICAgICAgLmFkZENsYXNzKCdzb3J0ZWQnKS5hZGRDbGFzcyh4ID4gMCA/ICdhc2NlbmRpbmcnIDogJ2Rlc2NlbmRpbmcnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFkKHg6IG51bWJlcikge1xyXG4gICAgcmV0dXJuICh4IDwgMTAgPyAnMCcgOiAnJykgKyB4O1xyXG59XHJcblxyXG5mdW5jdGlvbiBmb3JtYXREYXRlKGRhdGU6IERhdGUpIHtcclxuICAgIHJldHVybiBkYXRlLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSArXHJcbiAgICAgICAgJyAnICsgcGFkKGRhdGUuZ2V0SG91cnMoKSkgK1xyXG4gICAgICAgICc6JyArIHBhZChkYXRlLmdldE1pbnV0ZXMoKSk7XHJcbn1cclxuXHJcbmNvbnN0IHJhbmtBY2hpZXZlZENsYXNzID0gW1xyXG4gICAgJ1NTSCcsICdTSCcsICdTUycsICdTJywgJ0EnLFxyXG4gICAgJ0InLCAnQycsICdEJywgJ0YnLCAnLSdcclxuXTtcclxuXHJcbmxldCBiZWF0bWFwSW5mb01hcFVzZWRWZXJzaW9uID0gTUlOSU1VTV9EQVRFO1xyXG5mdW5jdGlvbiBpbml0VW5zb3J0ZWRUYWJsZVJvd3MoKSB7XHJcbiAgICBpZiAoc3VtbWFyeVJvd3MubGVuZ3RoID09PSAwKVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICBpZiAodW5zb3J0ZWRUYWJsZVJvd3MubGVuZ3RoICE9PSAwICYmIGJlYXRtYXBJbmZvTWFwVXNlZFZlcnNpb24gPT09IGJlYXRtYXBJbmZvTWFwVmVyc2lvbilcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICBiZWF0bWFwSW5mb01hcFVzZWRWZXJzaW9uID0gYmVhdG1hcEluZm9NYXBWZXJzaW9uO1xyXG4gICAgaWYgKGJlYXRtYXBJbmZvTWFwLnNpemUgIT09IDApIHtcclxuICAgICAgICBzdW1tYXJ5Um93cy5mb3JFYWNoKHJvdyA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBiZWF0bWFwSW5mb01hcC5nZXQocm93LmJlYXRtYXBfaWRfbnVtYmVyKTtcclxuICAgICAgICAgICAgaWYgKGluZm8pXHJcbiAgICAgICAgICAgICAgICByb3cuaW5mbyA9IGluZm87XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbW9kZV9pY29ucyA9IFtcclxuICAgICAgICAnZmEgZmEtZXhjaGFuZ2UnLFxyXG4gICAgICAgICcnLFxyXG4gICAgICAgICdmYSBmYS10aW50JyxcclxuICAgICAgICAnJyxcclxuICAgIF07XHJcbiAgICBjb25zdCBhcHByb3ZlZF9zdGF0dXNfaWNvbnMgPSBbXHJcbiAgICAgICAgJ2ZhIGZhLXF1ZXN0aW9uJyxcclxuICAgICAgICAnZmEgZmEtcXVlc3Rpb24nLFxyXG4gICAgICAgICdmYSBmYS1xdWVzdGlvbicsXHJcbiAgICAgICAgJ2ZhIGZhLWFuZ2xlLWRvdWJsZS1yaWdodCcsXHJcbiAgICAgICAgJ2ZhIGZhLWZpcmUnLFxyXG4gICAgICAgICdmYSBmYS1jaGVjaycsXHJcbiAgICAgICAgJ2ZhIGZhLWhlYXJ0LW8nLFxyXG4gICAgXTtcclxuICAgIHVuc29ydGVkVGFibGVSb3dzID0gc3VtbWFyeVJvd3MubWFwKHJvdyA9PlxyXG4gICAgICAgICQoJzx0cj4nKS5hcHBlbmQoW1xyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAkKCc8aT4nKS5hZGRDbGFzcyhhcHByb3ZlZF9zdGF0dXNfaWNvbnNbcm93LmFwcHJvdmVkX3N0YXR1cyArIDJdKSxcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHJvdy5hcHByb3ZlZF9kYXRlX3N0cmluZy5zcGxpdCgnICcpWzBdKVxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAkKCc8aT4nKS5hZGRDbGFzcyhtb2RlX2ljb25zW3Jvdy5tb2RlXSksXHJcbiAgICAgICAgICAgICAgICAkKCc8YT4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYGh0dHBzOi8vb3N1LnBweS5zaC9iLyR7cm93LmJlYXRtYXBfaWR9P209MmApXHJcbiAgICAgICAgICAgICAgICAgICAgLnRleHQocm93LmRpc3BsYXlfc3RyaW5nKSxcclxuICAgICAgICAgICAgICAgIHJvdy5iZWF0bWFwX2lkX251bWJlciA+IDAgPyAkKCc8ZGl2IGNsYXNzPVwiZmxvYXQtcmlnaHRcIj4nKS5hcHBlbmQoW1xyXG4gICAgICAgICAgICAgICAgICAgICQoJzxhPjxpIGNsYXNzPVwiZmEgZmEtcGljdHVyZS1vXCI+JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9iLnBweS5zaC90aHVtYi8ke3Jvdy5iZWF0bWFwc2V0X2lkfS5qcGdgKSxcclxuICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLWRvd25sb2FkXCI+JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9vc3UucHB5LnNoL2QvJHtyb3cuYmVhdG1hcHNldF9pZH1uYCksXHJcbiAgICAgICAgICAgICAgICAgICAgJCgnPGE+PGkgY2xhc3M9XCJmYSBmYS1jbG91ZC1kb3dubG9hZFwiPicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYG9zdTovL2RsLyR7cm93LmJlYXRtYXBzZXRfaWR9YClcclxuICAgICAgICAgICAgICAgIF0pIDogJCgpXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIHJvdy5zdGFycy50b0ZpeGVkKDIpLFxyXG4gICAgICAgICAgICByb3cucHAudG9GaXhlZCgwKSxcclxuICAgICAgICAgICAgYCR7TWF0aC5mbG9vcihyb3cuaGl0X2xlbmd0aCAvIDYwKX06JHtwYWQoTWF0aC5mbG9vcihyb3cuaGl0X2xlbmd0aCAlIDYwKSl9YCxcclxuICAgICAgICAgICAgcm93Lm1heF9jb21iby50b1N0cmluZygpLFxyXG4gICAgICAgICAgICByb3cuYXBwcm9hY2hfcmF0ZS50b0ZpeGVkKDEpLFxyXG4gICAgICAgICAgICByb3cuY2lyY2xlX3NpemUudG9GaXhlZCgxKSxcclxuICAgICAgICAgICAgcm93Lm1pbl9taXNzZXMgIT09IDAgPyAocm93Lm1pbl9taXNzZXMgPT09IDEgPyAnMSBtaXNzJyA6IHJvdy5taW5fbWlzc2VzICsgJyBtaXNzZXMnKSA6XHJcbiAgICAgICAgICAgIFtyb3cuZmNOTSwgcm93LmZjSEQsIHJvdy5mY0hSLCByb3cuZmNIREhSLCByb3cuZmNEVCwgcm93LmZjSEREVF0uam9pbignLCAnKSxcclxuICAgICAgICBiZWF0bWFwSW5mb01hcC5zaXplID09PSAwID8gW10gOlxyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAkKCc8aSBjbGFzcz1cImZhXCI+JykuYWRkQ2xhc3Mocm93LmluZm8gPyAnZmEtY2hlY2stc3F1YXJlLW8nIDogJ2ZhLXNxdWFyZS1vJyksXHJcbiAgICAgICAgICAgICAgICAkKCc8c3Bhbj4nKS5hZGRDbGFzcygncmFuay0nICsgcmFua0FjaGlldmVkQ2xhc3NbIXJvdy5pbmZvID8gOSA6IHJvdy5pbmZvLnJhbmtBY2hpZXZlZF0pLFxyXG4gICAgICAgICAgICAgICAgJCgnPHNwYW4+JykudGV4dChcclxuICAgICAgICAgICAgICAgICAgICAhcm93LmluZm8gfHwgcm93LmluZm8ubGFzdFBsYXllZC52YWx1ZU9mKCkgPT09IE1JTklNVU1fREFURS52YWx1ZU9mKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgPyAnLS0tJyA6IGZvcm1hdERhdGUocm93LmluZm8ubGFzdFBsYXllZClcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICBdLm1hcCh4ID0+ICQoJzx0ZD4nKS5hcHBlbmQoeCkpKVswXSBhcyBIVE1MVGFibGVSb3dFbGVtZW50KTtcclxuXHJcbiAgICB1bnNvcnRlZFRhYmxlUm93c0NoYW5nZWQgPSB0cnVlO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3dFcnJvck1lc3NhZ2UodGV4dDogc3RyaW5nKSB7XHJcbiAgICAkKCcjYWxlcnRzJykuYXBwZW5kKFxyXG4gICAgICAgICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC13YXJuaW5nIGFsZXJ0LWRpc21pc3NhYmxlXCI+JylcclxuICAgICAgICAgICAgLnRleHQodGV4dClcclxuICAgICAgICAgICAgLmFwcGVuZCgnPGEgY2xhc3M9XCJjbG9zZVwiIGRhdGEtZGlzbWlzcz1cImFsZXJ0XCI+PHNwYW4+JnRpbWVzOycpKTtcclxufVxyXG5cclxuY29uc3QgTE9DQUxTVE9SQUdFX1BSRUZJWCA9ICdsaXN0LW1hcHMvJztcclxudHlwZSBMb2NhbEZpbGVOYW1lID0gJ29zdSEuZGInIHwgJ3Njb3Jlcy5kYic7XHJcbmludGVyZmFjZSBMb2NhbEZpbGUge1xyXG4gICAgZGF0YTogVWludDhBcnJheTtcclxuICAgIHVwbG9hZGVkRGF0ZTogRGF0ZTtcclxufVxyXG5jb25zdCBsb2NhbEZpbGVzOiB7XHJcbiAgICBbJ29zdSEuZGInXT86IExvY2FsRmlsZSxcclxuICAgIFsnc2NvcmVzLmRiJ10/OiBMb2NhbEZpbGU7XHJcbn0gPSB7fTtcclxuXHJcbi8qXHJcbmZ1bmN0aW9uIGRhdGFVUkl0b1VJbnQ4QXJyYXkoZGF0YVVSSTogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBiYXNlNjQgPSBkYXRhVVJJLnNwbGl0KCcsJylbMV07XHJcbiAgICBjb25zdCBzdHIgPSBhdG9iKGJhc2U2NCk7XHJcbiAgICBjb25zdCBsZW4gPSBzdHIubGVuZ3RoO1xyXG4gICAgY29uc3QgYXJyYXkgPSBuZXcgVWludDhBcnJheShsZW4pO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47ICsrIGkpIHtcclxuICAgICAgICBhcnJheVtpXSA9IHN0ci5jaGFyQ29kZUF0KGkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFycmF5O1xyXG59XHJcbiovXHJcblxyXG5jb25zdCByZWdpc3RlcmVkQ2FsbGJhY2tNYXAgPSBuZXcgTWFwPG51bWJlciwgKGRhdGE6IGFueSkgPT4gYW55PigpO1xyXG5mdW5jdGlvbiByZWdpc3RlckNhbGxiYWNrKGNhbGxiYWNrOiAoZGF0YTogYW55KSA9PiBhbnkpOiBudW1iZXIge1xyXG4gICAgbGV0IGlkO1xyXG4gICAgZG9cclxuICAgICAgICBpZCA9IE1hdGgucmFuZG9tKCk7XHJcbiAgICB3aGlsZSAocmVnaXN0ZXJlZENhbGxiYWNrTWFwLmhhcyhpZCkpO1xyXG4gICAgcmVnaXN0ZXJlZENhbGxiYWNrTWFwLnNldChpZCwgY2FsbGJhY2spO1xyXG4gICAgcmV0dXJuIGlkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBuZXdXb3JrZXIoKTogV29ya2VyIHtcclxuICAgIHJldHVybiBuZXcgV29ya2VyKCdkaXN0L2xpc3QtbWFwcy13b3JrZXIuanMnKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcnVuV29ya2VyKG1lc3NhZ2U6IG9iamVjdCwgdXNpbmc/OiBXb3JrZXIpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueT4ocmVzb2x2ZSA9PiB7XHJcbiAgICAgICAgY29uc3Qgd29ya2VyID0gdXNpbmcgfHwgbmV3V29ya2VyKCk7XHJcbiAgICAgICAgKG1lc3NhZ2UgYXMgYW55KS5pZCA9IHJlZ2lzdGVyQ2FsbGJhY2socmVzb2x2ZSk7XHJcbiAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKG1lc3NhZ2UpO1xyXG4gICAgICAgIHdvcmtlci5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGV2ZW50LmRhdGE7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLnR5cGUgPT09ICdjYWxsYmFjaycgJiYgdHlwZW9mKGRhdGEuaWQpID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSByZWdpc3RlcmVkQ2FsbGJhY2tNYXAuZ2V0KGRhdGEuaWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVnaXN0ZXJlZENhbGxiYWNrTWFwLmRlbGV0ZShkYXRhLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIGZhbHNlKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tcHJlc3NCdWZmZXJUb1N0cmluZyhidWZmZXI6IEFycmF5QnVmZmVyKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIGNvbnN0IGNvbXByZXNzZWQgPSAoYXdhaXQgcnVuV29ya2VyKHtcclxuICAgICAgICB0eXBlOiAnY29tcHJlc3MnLFxyXG4gICAgICAgIGRhdGE6IG5ldyBVaW50OEFycmF5KGJ1ZmZlcilcclxuICAgIH0pKS5kYXRhIGFzIFVpbnQ4QXJyYXk7XHJcbiAgICBjb25zdCBjaGFycyA9IG5ldyBBcnJheShNYXRoLmZsb29yKGNvbXByZXNzZWQubGVuZ3RoIC8gMikpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGFycy5sZW5ndGg7IGkgKz0gMSkge1xyXG4gICAgICAgIGNvbnN0IGNvZGUgPSAoY29tcHJlc3NlZFtpICogMiArIDBdICYgMHhmZikgPDwgOCB8IChjb21wcmVzc2VkW2kgKiAyICsgMV0gJiAweGZmKTtcclxuICAgICAgICBjaGFyc1tpXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XHJcbiAgICB9XHJcbiAgICBsZXQgcmVzID0gY29tcHJlc3NlZC5sZW5ndGggJSAyID8gJzEnIDogJzAnO1xyXG4gICAgcmVzICs9IGNoYXJzLmpvaW4oJycpO1xyXG4gICAgaWYgKGNvbXByZXNzZWQubGVuZ3RoICUgMiAhPT0gMClcclxuICAgICAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoY29tcHJlc3NlZFtjb21wcmVzc2VkLmxlbmd0aCAtIDFdICYgMHhmZikgPDwgOCk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVjb21wcmVzc0J1ZmZlckZyb21TdHJpbmcoc3RyOiBzdHJpbmcpOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcclxuICAgIGNvbnN0IHBhcml0eSA9IHN0clswXSA9PT0gJzEnID8gMSA6IDA7XHJcbiAgICBjb25zdCBsZW4gPSBzdHIubGVuZ3RoIC0gMSAtIHBhcml0eTtcclxuICAgIGNvbnN0IGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkobGVuICogMiArIHBhcml0eSk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XHJcbiAgICAgICAgY29uc3QgY29kZSA9IHN0ci5jaGFyQ29kZUF0KGkgKyAxKTtcclxuICAgICAgICBhcnJheVtpICogMiArIDBdID0gY29kZSA+PiA4O1xyXG4gICAgICAgIGFycmF5W2kgKiAyICsgMV0gPSBjb2RlICYgMHhmZjtcclxuICAgIH1cclxuICAgIGlmIChwYXJpdHkgIT09IDApXHJcbiAgICAgICAgYXJyYXlbbGVuICogMl0gPSBzdHIuY2hhckNvZGVBdChsZW4gKyAxKSA+PiA4O1xyXG4gICAgY29uc3QgZGVjb21wcmVzc2VkID0gKGF3YWl0IHJ1bldvcmtlcih7XHJcbiAgICAgICAgdHlwZTogJ2RlY29tcHJlc3MnLFxyXG4gICAgICAgIGRhdGE6IGFycmF5XHJcbiAgICB9KSkuZGF0YSBhcyBVaW50OEFycmF5O1xyXG4gICAgcmV0dXJuIGRlY29tcHJlc3NlZDtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVsb2FkTG9jYWxGaWxlKG5hbWU6IExvY2FsRmlsZU5hbWUpIHtcclxuICAgIGNvbnN0IGYgPSBsb2NhbEZpbGVzW25hbWVdO1xyXG4gICAgaWYgKG5hbWUgPT09ICdvc3UhLmRiJylcclxuICAgICAgICAkKCcjZmlsdGVyLWxvY2FsLWRhdGEnKS5wcm9wKCdkaXNhYmxlZCcsIGYgPT09IHVuZGVmaW5lZCk7XHJcbiAgICAkKG5hbWUgPT09ICdvc3UhLmRiJyA/ICcjY3VycmVudC1vc3VkYi1maWxlJyA6ICcjY3VycmVudC1zY29yZXNkYi1maWxlJylcclxuICAgICAgICAudGV4dCghZiA/ICdObyBkYXRhJyA6IGZvcm1hdERhdGUoZi51cGxvYWRlZERhdGUpKTtcclxuICAgIGlmICghZikgcmV0dXJuO1xyXG4gICAgaWYgKG5hbWUgPT09ICdvc3UhLmRiJykge1xyXG4gICAgICAgIGxvYWRPc3VEQihmLmRhdGEuYnVmZmVyLCBmLnVwbG9hZGVkRGF0ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gbG9hZEZyb21Mb2NhbFN0b3JhZ2UobmFtZTogTG9jYWxGaWxlTmFtZSkge1xyXG4gICAgY29uc3QgZGF0ZVN0ciA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKExPQ0FMU1RPUkFHRV9QUkVGSVggKyBuYW1lICsgJy91cGxvYWRlZC1kYXRlJyk7XHJcbiAgICBpZiAoIWRhdGVTdHIpIHJldHVybjtcclxuICAgIGNvbnN0IGVuY29kZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShMT0NBTFNUT1JBR0VfUFJFRklYICsgbmFtZSArICcvZGF0YScpITtcclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBkZWNvbXByZXNzQnVmZmVyRnJvbVN0cmluZyhlbmNvZGVkKTtcclxuICAgIGNvbnNvbGUubG9nKCdmaWxlICcgKyBuYW1lICsgJyBsb2FkZWQgZnJvbSBsb2NhbFN0b3JhZ2UnKTtcclxuICAgIGxvY2FsRmlsZXNbbmFtZV0gPSB7XHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICB1cGxvYWRlZERhdGU6IG5ldyBEYXRlKGRhdGVTdHIpXHJcbiAgICB9O1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzZXRMb2NhbEZpbGUobmFtZTogTG9jYWxGaWxlTmFtZSwgZmlsZTogRmlsZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4ge1xyXG4gICAgICAgIGNvbnN0IGZyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICBmci5vbmxvYWQgPSAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpbGUgJyArIG5hbWUgKyAnIGxvYWRlZCcpO1xyXG4gICAgICAgICAgICBjb25zdCBidWZmZXIgPSBmci5yZXN1bHQgYXMgQXJyYXlCdWZmZXI7XHJcbiAgICAgICAgICAgIGNvbnN0IHVwbG9hZGVkRGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgICAgIGxvY2FsRmlsZXNbbmFtZV0gPSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhOiBuZXcgVWludDhBcnJheShidWZmZXIpLFxyXG4gICAgICAgICAgICAgICAgdXBsb2FkZWREYXRlOiB1cGxvYWRlZERhdGUsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJlbG9hZExvY2FsRmlsZShuYW1lKTtcclxuICAgICAgICAgICAgY29tcHJlc3NCdWZmZXJUb1N0cmluZyhidWZmZXIpLnRoZW4oZGF0YVN0ciA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZmlsZSAnICsgbmFtZSArICcgY29tcHJlc3NlZCcpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudCA9IGxvY2FsRmlsZXNbbmFtZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudCAmJiBjdXJyZW50LnVwbG9hZGVkRGF0ZS52YWx1ZU9mKCkgIT09IHVwbG9hZGVkRGF0ZS52YWx1ZU9mKCkpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oTE9DQUxTVE9SQUdFX1BSRUZJWCArIG5hbWUgKyAnL2RhdGEnLCBkYXRhU3RyKTtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShMT0NBTFNUT1JBR0VfUFJFRklYICsgbmFtZSArICcvdXBsb2FkZWQtZGF0ZScsIHVwbG9hZGVkRGF0ZS50b0lTT1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZmlsZSAnICsgbmFtZSArICcgc2F2ZWQgdG8gbG9jYWxTdG9yYWdlJyk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignbG9jYWxTdG9yYWdlIGVycm9yOiAnLCBlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBmci5yZWFkQXNBcnJheUJ1ZmZlcihmaWxlKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5jbGFzcyBTZXJpYWxpemF0aW9uUmVhZGVyIHtcclxuICAgIHByaXZhdGUgZHY6IERhdGFWaWV3O1xyXG4gICAgcHJpdmF0ZSBvZmZzZXQ6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihidWZmZXI6IEFycmF5QnVmZmVyKSB7XHJcbiAgICAgICAgdGhpcy5kdiA9IG5ldyBEYXRhVmlldyhidWZmZXIpO1xyXG4gICAgICAgIHRoaXMub2Zmc2V0ID0gMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2tpcChieXRlczogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gYnl0ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRJbnQ4KCkge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0SW50OCh0aGlzLm9mZnNldCk7XHJcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gMTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkSW50MTYoKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5kdi5nZXRJbnQxNih0aGlzLm9mZnNldCwgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gMjtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkSW50MzIoKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5kdi5nZXRJbnQzMih0aGlzLm9mZnNldCwgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gNDtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkQnl0ZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWFkSW50OCgpIHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZFVJbnQxNigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWFkSW50MTYoKSB8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRVSW50MzIoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZEludDMyKCkgfCAwO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkQm9vbGVhbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWFkSW50OCgpICE9PSAwO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVhZFVMRUIxMjgoKSB7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IDA7XHJcbiAgICAgICAgZm9yIChsZXQgc2hpZnQgPSAwOyA7IHNoaWZ0ICs9IDcpIHtcclxuICAgICAgICAgICAgY29uc3QgYnl0ZSA9IHRoaXMuZHYuZ2V0VWludDgodGhpcy5vZmZzZXQpO1xyXG4gICAgICAgICAgICB0aGlzLm9mZnNldCArPSAxO1xyXG4gICAgICAgICAgICByZXN1bHQgfD0gKGJ5dGUgJiAweDdmKSA8PCBzaGlmdDtcclxuICAgICAgICAgICAgaWYgKChieXRlICYgMHg4MCkgPT09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZFVpbnQ4QXJyYXkobGVuZ3RoOiBudW1iZXIpIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh0aGlzLmR2LmJ1ZmZlciwgdGhpcy5vZmZzZXQsIGxlbmd0aCk7XHJcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gbGVuZ3RoO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRTdHJpbmcoKSB7XHJcbiAgICAgICAgY29uc3QgaGVhZGVyID0gdGhpcy5yZWFkSW50OCgpO1xyXG4gICAgICAgIGlmIChoZWFkZXIgPT09IDApXHJcbiAgICAgICAgICAgIHJldHVybiAnJztcclxuICAgICAgICBjb25zdCBsZW5ndGggPSB0aGlzLnJlYWRVTEVCMTI4KCk7XHJcbiAgICAgICAgY29uc3QgYXJyYXkgPSB0aGlzLnJlYWRVaW50OEFycmF5KGxlbmd0aCk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBUZXh0RGVjb2RlcigndXRmLTgnKS5kZWNvZGUoYXJyYXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkSW50NjRSb3VuZGVkKCkge1xyXG4gICAgICAgIGNvbnN0IGxvID0gdGhpcy5kdi5nZXRVaW50MzIodGhpcy5vZmZzZXQsIHRydWUpO1xyXG4gICAgICAgIGNvbnN0IGhpID0gdGhpcy5kdi5nZXRVaW50MzIodGhpcy5vZmZzZXQgKyA0LCB0cnVlKTtcclxuICAgICAgICB0aGlzLm9mZnNldCArPSA4O1xyXG4gICAgICAgIHJldHVybiBoaSAqIDB4MTAwMDAwMDAwICsgbG87XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWREYXRlVGltZSgpIHtcclxuICAgICAgICAvLyBPRkZTRVQgPSA2MjEzNTU5NjgwMDAwMDAwMDAgPSB0aWNrcyBmcm9tIDAwMDEvMS8xIHRvIDE5NzAvMS8xXHJcbiAgICAgICAgbGV0IGxvID0gdGhpcy5yZWFkVUludDMyKCk7XHJcbiAgICAgICAgbGV0IGhpID0gdGhpcy5yZWFkVUludDMyKCk7XHJcbiAgICAgICAgbG8gLT0gMzQ0NDI5MzYzMjsgLy8gbG8gYml0cyBvZiBPRkZTRVRcclxuICAgICAgICBpZiAobG8gPCAwKSB7XHJcbiAgICAgICAgICAgIGxvICs9IDQyOTQ5NjcyOTY7ICAgLy8gMl4zMlxyXG4gICAgICAgICAgICBoaSAtPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBoaSAtPSAxNDQ2NzA1MDg7ICAvLyBoaSBiaXRzIG9mIE9GRlNFVFxyXG4gICAgICAgIGNvbnN0IHRpY2tzID0gaGkgKiA0Mjk0OTY3Mjk2ICsgbG87XHJcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKHRpY2tzICogMWUtNCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRTaW5nbGUoKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5kdi5nZXRGbG9hdDMyKHRoaXMub2Zmc2V0LCB0cnVlKTtcclxuICAgICAgICB0aGlzLm9mZnNldCArPSA0O1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWREb3VibGUoKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5kdi5nZXRGbG9hdDY0KHRoaXMub2Zmc2V0LCB0cnVlKTtcclxuICAgICAgICB0aGlzLm9mZnNldCArPSA4O1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRMaXN0KGNhbGxiYWNrOiAoaW5kZXg6IG51bWJlcikgPT4gYW55KSB7XHJcbiAgICAgICAgY29uc3QgY291bnQgPSB0aGlzLnJlYWRJbnQzMigpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkgKz0gMSlcclxuICAgICAgICAgICAgY2FsbGJhY2soaSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEJlYXRtYXBJbmZvIHtcclxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmVhdG1hcElkOiBudW1iZXIsXHJcbiAgICAgICAgcHVibGljIHJlYWRvbmx5IGxhc3RQbGF5ZWQ6IERhdGUsXHJcbiAgICAgICAgcHVibGljIHJlYWRvbmx5IHJhbmtBY2hpZXZlZDogbnVtYmVyKSB7fVxyXG59XHJcblxyXG5mdW5jdGlvbiByZWFkQmVhdG1hcChzcjogU2VyaWFsaXphdGlvblJlYWRlcikge1xyXG4gICAgY29uc3QgU2l6ZUluQnl0ZXMgPSBzci5yZWFkSW50MzIoKTtcclxuXHJcbiAgICBjb25zdCBBcnRpc3QgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBBcnRpc3RVbmljb2RlID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgVGl0bGUgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBUaXRsZVVuaWNvZGUgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBDcmVhdG9yID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgVmVyc2lvbiA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IEF1ZGlvRmlsZW5hbWUgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBCZWF0bWFwQ2hlY2tzdW0gPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBGaWxlbmFtZSA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IFN1Ym1pc3Npb25TdGF0dXMgPSBzci5yZWFkQnl0ZSgpO1xyXG4gICAgY29uc3QgY291bnROb3JtYWwgPSBzci5yZWFkVUludDE2KCk7XHJcbiAgICBjb25zdCBjb3VudFNsaWRlciA9IHNyLnJlYWRVSW50MTYoKTtcclxuICAgIGNvbnN0IGNvdW50U3Bpbm5lciA9IHNyLnJlYWRVSW50MTYoKTtcclxuICAgIGNvbnN0IERhdGVNb2RpZmllZCA9IHNyLnJlYWREYXRlVGltZSgpO1xyXG5cclxuICAgIGNvbnN0IERpZmZpY3VsdHlBcHByb2FjaFJhdGUgPSBzci5yZWFkU2luZ2xlKCk7XHJcbiAgICBjb25zdCBEaWZmaWN1bHR5Q2lyY2xlU2l6ZSA9IHNyLnJlYWRTaW5nbGUoKTtcclxuICAgIGNvbnN0IERpZmZpY3VsdHlIcERyYWluUmF0ZSA9IHNyLnJlYWRTaW5nbGUoKTtcclxuICAgIGNvbnN0IERpZmZpY3VsdHlPdmVyYWxsID0gc3IucmVhZFNpbmdsZSgpO1xyXG5cclxuICAgIGNvbnN0IERpZmZpY3VsdHlTbGlkZXJNdWx0aXBsaWVyID0gc3IucmVhZERvdWJsZSgpO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSArPSAxKSB7XHJcbiAgICAgICAgc3IucmVhZExpc3QoKCkgPT4ge1xyXG4gICAgICAgICAgICBzci5yZWFkSW50MzIoKTtcclxuICAgICAgICAgICAgc3IucmVhZEludDE2KCk7XHJcbiAgICAgICAgICAgIHNyLnJlYWREb3VibGUoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBEcmFpbkxlbmd0aCA9IHNyLnJlYWRJbnQzMigpO1xyXG4gICAgY29uc3QgVG90YWxMZW5ndGggPSBzci5yZWFkSW50MzIoKTtcclxuICAgIGNvbnN0IFByZXZpZXdUaW1lID0gc3IucmVhZEludDMyKCk7XHJcbiAgICBzci5yZWFkTGlzdCgoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgQmVhdExlbmd0aCA9IHNyLnJlYWREb3VibGUoKTtcclxuICAgICAgICBjb25zdCBPZmZzZXQgPSBzci5yZWFkRG91YmxlKCk7XHJcbiAgICAgICAgY29uc3QgVGltaW5nQ2hhbmdlID0gc3IucmVhZEJvb2xlYW4oKTtcclxuICAgIH0pO1xyXG4gICAgY29uc3QgQmVhdG1hcElkID0gc3IucmVhZEludDMyKCk7XHJcbiAgICBjb25zdCBCZWF0bWFwU2V0SWQgPSBzci5yZWFkSW50MzIoKTtcclxuICAgIGNvbnN0IEJlYXRtYXBUb3BpY0lkID0gc3IucmVhZEludDMyKCk7XHJcbiAgICBjb25zdCBQbGF5ZXJSYW5rT3N1ID0gc3IucmVhZEJ5dGUoKTtcclxuICAgIGNvbnN0IFBsYXllclJhbmtGcnVpdHMgPSBzci5yZWFkQnl0ZSgpO1xyXG4gICAgY29uc3QgUGxheWVyUmFua1RhaWtvID0gc3IucmVhZEJ5dGUoKTtcclxuICAgIGNvbnN0IFBsYXllclJhbmtNYW5pYSA9IHNyLnJlYWRCeXRlKCk7XHJcbiAgICBjb25zdCBQbGF5ZXJPZmZzZXQgPSBzci5yZWFkSW50MTYoKTtcclxuICAgIGNvbnN0IFN0YWNrTGVuaWVuY3kgPSBzci5yZWFkU2luZ2xlKCk7XHJcbiAgICBjb25zdCBQbGF5TW9kZSA9IHNyLnJlYWRCeXRlKCk7XHJcbiAgICBjb25zdCBTb3VyY2UgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBUYWdzID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgT25saW5lT2Zmc2V0ID0gc3IucmVhZEludDE2KCk7XHJcbiAgICBjb25zdCBPbmxpbmVEaXNwbGF5VGl0bGUgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBOZXdGaWxlID0gc3IucmVhZEJvb2xlYW4oKTtcclxuICAgIGNvbnN0IERhdGVMYXN0UGxheWVkID0gc3IucmVhZERhdGVUaW1lKCk7XHJcbiAgICBjb25zdCBJbk9zekNvbnRhaW5lciA9IHNyLnJlYWRCb29sZWFuKCk7XHJcbiAgICBjb25zdCBDb250YWluaW5nRm9sZGVyQWJzb2x1dGUgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBMYXN0SW5mb1VwZGF0ZSA9IHNyLnJlYWREYXRlVGltZSgpO1xyXG4gICAgY29uc3QgRGlzYWJsZVNhbXBsZXMgPSBzci5yZWFkQm9vbGVhbigpO1xyXG4gICAgY29uc3QgRGlzYWJsZVNraW4gPSBzci5yZWFkQm9vbGVhbigpO1xyXG4gICAgY29uc3QgRGlzYWJsZVN0b3J5Ym9hcmQgPSBzci5yZWFkQm9vbGVhbigpO1xyXG4gICAgY29uc3QgRGlzYWJsZVZpZGVvID0gc3IucmVhZEJvb2xlYW4oKTtcclxuICAgIGNvbnN0IFZpc3VhbFNldHRpbmdzT3ZlcnJpZGUgPSBzci5yZWFkQm9vbGVhbigpO1xyXG5cclxuICAgIGNvbnN0IExhc3RFZGl0VGltZSA9IHNyLnJlYWRJbnQzMigpO1xyXG4gICAgY29uc3QgTWFuaWFTcGVlZCA9IHNyLnJlYWRCeXRlKCk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBCZWF0bWFwSW5mbyhcclxuICAgICAgICBCZWF0bWFwSWQsXHJcbiAgICAgICAgbmV3IERhdGUoTWF0aC5tYXgoTUlOSU1VTV9EQVRFLnZhbHVlT2YoKSwgRGF0ZUxhc3RQbGF5ZWQudmFsdWVPZigpKSksXHJcbiAgICAgICAgUGxheWVyUmFua0ZydWl0cyk7XHJcbn1cclxuXHJcbmNvbnN0IGJlYXRtYXBJbmZvTWFwID0gbmV3IE1hcDxudW1iZXIsIEJlYXRtYXBJbmZvPigpO1xyXG5sZXQgYmVhdG1hcEluZm9NYXBWZXJzaW9uID0gTUlOSU1VTV9EQVRFO1xyXG5cclxuZnVuY3Rpb24gbG9hZE9zdURCKGJ1ZmZlcjogQXJyYXlCdWZmZXIsIHZlcnNpb246IERhdGUpIHtcclxuICAgIGJlYXRtYXBJbmZvTWFwLmNsZWFyKCk7XHJcbiAgICBjb25zdCBzciA9IG5ldyBTZXJpYWxpemF0aW9uUmVhZGVyKGJ1ZmZlcik7XHJcbiAgICBzci5za2lwKDQgKyA0ICsgMSArIDgpO1xyXG4gICAgc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgYmVhdG1hcENvdW50ID0gc3IucmVhZEludDMyKCk7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiZWF0bWFwQ291bnQ7IGkgKz0gMSkge1xyXG4gICAgICAgIGNvbnN0IGJlYXRtYXAgPSByZWFkQmVhdG1hcChzcik7XHJcbiAgICAgICAgaWYgKGJlYXRtYXAuYmVhdG1hcElkID4gMClcclxuICAgICAgICAgICAgYmVhdG1hcEluZm9NYXAuc2V0KGJlYXRtYXAuYmVhdG1hcElkLCBiZWF0bWFwKTtcclxuICAgIH1cclxuXHJcbiAgICBiZWF0bWFwSW5mb01hcFZlcnNpb24gPSB2ZXJzaW9uO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0VGFibGUoc29ydEtleXM6IHt9W10sIG9yZGVyQ29uZmlnOiBbbnVtYmVyW10sIG51bWJlcl0sIG9uU29ydE9yZGVyQ2hhbmdlZDogKCkgPT4gdm9pZCkge1xyXG4gICAgY29uc3QgdGhMaXN0ID0gJCgnI3N1bW1hcnktdGFibGUgPiB0aGVhZCA+IHRyID4gdGgnKTtcclxuICAgIHNvcnRLZXlzLmZvckVhY2goKF8sIGluZGV4KSA9PiB7XHJcbiAgICAgICAgJC5kYXRhKHRoTGlzdFtpbmRleF0sICd0aEluZGV4JywgaW5kZXgpO1xyXG4gICAgfSk7XHJcbiAgICB0aExpc3QuY2xpY2soKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgY29uc3QgdGggPSAkKGV2ZW50LnRhcmdldCk7XHJcbiAgICAgICAgbGV0IHNpZ247XHJcbiAgICAgICAgaWYgKHRoLmhhc0NsYXNzKCdzb3J0ZWQnKSlcclxuICAgICAgICAgICAgc2lnbiA9IHRoLmhhc0NsYXNzKCdkZXNjZW5kaW5nJykgPyAxIDogLTE7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBzaWduID0gdGguaGFzQ2xhc3MoJ2Rlc2MtZmlyc3QnKSA/IC0xIDogMTtcclxuICAgICAgICBjb25zdCB0aEluZGV4ID0gdGguZGF0YSgndGhJbmRleCcpIGFzIG51bWJlcjtcclxuICAgICAgICBjdXJyZW50U29ydE9yZGVyLnB1c2goKHRoSW5kZXggKyAxKSAqIHNpZ24pO1xyXG4gICAgICAgIGN1cnJlbnRTb3J0T3JkZXIgPSBzaW1wbGlmeVNvcnRPcmRlcihjdXJyZW50U29ydE9yZGVyLCBvcmRlckNvbmZpZyk7XHJcbiAgICAgICAgc2V0VGFibGVIZWFkU29ydGluZ01hcmsoKTtcclxuICAgICAgICBvblNvcnRPcmRlckNoYW5nZWQoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWluKCkge1xyXG4gICAgUHJvbWlzZS5hbGwoXHJcbiAgICAgICAgKFsnb3N1IS5kYicsICdzY29yZXMuZGInXSBhcyBMb2NhbEZpbGVOYW1lW10pXHJcbiAgICAgICAgICAgIC5tYXAobmFtZSA9PlxyXG4gICAgICAgICAgICAgICAgbG9hZEZyb21Mb2NhbFN0b3JhZ2UobmFtZSlcclxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiByZWxvYWRMb2NhbEZpbGUobmFtZSkpKSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgaWYgKGluaXRVbnNvcnRlZFRhYmxlUm93cygpKVxyXG4gICAgICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XHJcbiAgICB9KTtcclxuICAgIHNldFF1ZXJ5QWNjb3JkaW5nVG9IYXNoKCk7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsICgpID0+IHtcclxuICAgICAgICBzZXRRdWVyeUFjY29yZGluZ1RvSGFzaCgpO1xyXG4gICAgICAgIGRyYXdUYWJsZUZvckN1cnJlbnRGaWx0ZXJpbmcoKTtcclxuICAgIH0pO1xyXG4gICAgY29uc3Qgb25DaGFuZ2UgPSAoKSA9PiB7XHJcbiAgICAgICAgZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpO1xyXG4gICAgfTtcclxuICAgIGZvciAoY29uc3QgaWQgb2YgWydmaWx0ZXItYXBwcm92ZWQtc3RhdHVzJywgJ2ZpbHRlci1tb2RlJywgJ2ZpbHRlci1mYy1sZXZlbCcsICdmaWx0ZXItbG9jYWwtZGF0YScsICdzaG93LWZ1bGwtcmVzdWx0J10pXHJcbiAgICAgICAgJChgIyR7aWR9YCkub24oJ2NoYW5nZScsIG9uQ2hhbmdlKTtcclxuICAgIGZvciAoY29uc3QgaWQgb2YgWydmaWx0ZXItc2VhcmNoLXF1ZXJ5J10pXHJcbiAgICAgICAgJChgIyR7aWR9YCkub24oJ2lucHV0Jywgb25DaGFuZ2UpO1xyXG4gICAgaW5pdFRhYmxlKHNvcnRLZXlzLCBzdW1tYXJ5T3JkZXJDb25maWcsIG9uQ2hhbmdlKTtcclxuXHJcbiAgICBjb25zdCBsb2FkRGF0YSA9IChkYXRhOiBTdW1tYXJ5Um93RGF0YVtdLCBsYXN0TW9kaWZpZWQ6IERhdGUpID0+IHtcclxuICAgICAgICAkKCcjbGFzdC11cGRhdGUtdGltZScpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoJCgnPHRpbWU+JylcclxuICAgICAgICAgICAgICAgIC5hdHRyKCdkYXRldGltZScsIGxhc3RNb2RpZmllZC50b0lTT1N0cmluZygpKVxyXG4gICAgICAgICAgICAgICAgLnRleHQobGFzdE1vZGlmaWVkLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSkpO1xyXG4gICAgICAgIHN1bW1hcnlSb3dzID0gZGF0YS5tYXAoeCA9PiBuZXcgU3VtbWFyeVJvdyh4KSk7XHJcbiAgICAgICAgaW5pdFVuc29ydGVkVGFibGVSb3dzKCk7XHJcbiAgICAgICAgZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpO1xyXG4gICAgICAgICQoJyNzdW1tYXJ5LXRhYmxlLWxvYWRlcicpLmhpZGUoKTtcclxuICAgIH07XHJcbiAgICAkLmdldEpTT04oJ2RhdGEvc3VtbWFyeS5qc29uJykudGhlbigoZGF0YSwgXywgeGhyKSA9PiB7XHJcbiAgICAgICAgbG9hZERhdGEoZGF0YSwgbmV3IERhdGUoeGhyLmdldFJlc3BvbnNlSGVhZGVyKCdMYXN0LU1vZGlmaWVkJykgYXMgc3RyaW5nKSk7XHJcbiAgICB9KTtcclxuICAgICQoJyNkYi1maWxlLWlucHV0JykuY2hhbmdlKGFzeW5jIGV2ZW50ID0+IHtcclxuICAgICAgICBjb25zdCBlbGVtID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQ7XHJcbiAgICAgICAgaWYgKCFlbGVtLmZpbGVzKSByZXR1cm47XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbGVtLmZpbGVzLmxlbmd0aDsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBlbGVtLmZpbGVzW2ldO1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZmlsZS5uYW1lO1xyXG4gICAgICAgICAgICBpZiAobmFtZS5pbmRleE9mKCdvc3UhLmRiJykgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBzZXRMb2NhbEZpbGUoJ29zdSEuZGInLCBmaWxlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChuYW1lLmluZGV4T2YoJ3Njb3Jlcy5kYicpICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgc2V0TG9jYWxGaWxlKCdzY29yZXMuZGInLCBmaWxlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNob3dFcnJvck1lc3NhZ2UoYEludmFsaWQgZmlsZSAke25hbWV9OiBQbGVhc2Ugc2VsZWN0IG9zdSEuZGIgb3Igc2NvcmVzLmRiYCk7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaW5pdFVuc29ydGVkVGFibGVSb3dzKCkpXHJcbiAgICAgICAgICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsZW0udmFsdWUgPSAnJztcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0VW5zb3J0ZWRSYW5raW5nVGFibGVSb3dzKCkge1xyXG4gICAgaWYgKHJhbmtpbmdSb3dzLmxlbmd0aCA9PT0gMClcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgdW5zb3J0ZWRUYWJsZVJvd3MgPSByYW5raW5nUm93cy5tYXAocm93ID0+XHJcbiAgICAgICAgJCgnPHRyPicpLmFwcGVuZChbXHJcbiAgICAgICAgICAgIHJvdy5yYW5rLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgIHJvdy5wcC50b0ZpeGVkKDIpLFxyXG4gICAgICAgICAgICAkKCc8YT4nKS5hdHRyKCdocmVmJywgYGh0dHBzOi8vb3N1LnBweS5zaC91LyR7cm93LnVzZXJfaWR9YCkudGV4dChyb3cudXNlcm5hbWUpLFxyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAkKCc8YT4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYGh0dHBzOi8vb3N1LnBweS5zaC9iLyR7cm93LmJlYXRtYXBfaWR9P209MmApXHJcbiAgICAgICAgICAgICAgICAgICAgLnRleHQocm93LmRpc3BsYXlfc3RyaW5nKSxcclxuICAgICAgICAgICAgICAgIHJvdy5iZWF0bWFwX2lkX251bWJlciA+IDAgPyAkKCc8ZGl2IGNsYXNzPVwiZmxvYXQtcmlnaHRcIj4nKS5hcHBlbmQoW1xyXG4gICAgICAgICAgICAgICAgICAgICQoJzxhPjxpIGNsYXNzPVwiZmEgZmEtcGljdHVyZS1vXCI+JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9iLnBweS5zaC90aHVtYi8ke3Jvdy5iZWF0bWFwc2V0X2lkfS5qcGdgKSxcclxuICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLWRvd25sb2FkXCI+JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9vc3UucHB5LnNoL2QvJHtyb3cuYmVhdG1hcHNldF9pZH1uYCksXHJcbiAgICAgICAgICAgICAgICAgICAgJCgnPGE+PGkgY2xhc3M9XCJmYSBmYS1jbG91ZC1kb3dubG9hZFwiPicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYG9zdTovL2RsLyR7cm93LmJlYXRtYXBzZXRfaWR9YClcclxuICAgICAgICAgICAgICAgIF0pIDogJCgpXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIHJvdy5tb2RzLFxyXG4gICAgICAgICAgICByb3cuYWNjdXJhY3kudG9GaXhlZCgyKSArICclJyxcclxuICAgICAgICAgICAgcm93LmNvbWJvX2Rpc3BsYXksXHJcbiAgICAgICAgICAgIHJvdy5kYXRlX3BsYXllZF9zdHJpbmcsXHJcbiAgICAgICAgXS5tYXAoeCA9PiAkKCc8dGQ+JykuYXBwZW5kKHgpKSlbMF0gYXMgSFRNTFRhYmxlUm93RWxlbWVudCk7XHJcblxyXG4gICAgdW5zb3J0ZWRUYWJsZVJvd3NDaGFuZ2VkID0gdHJ1ZTtcclxuICAgIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5jb25zdCByYW5raW5nU29ydEtleXMgPSBbXHJcbiAgICAoeDogUmFua2luZ1JvdykgPT4geC5yYW5rLFxyXG4gICAgKHg6IFJhbmtpbmdSb3cpID0+IHgucHAsXHJcbiAgICAoeDogUmFua2luZ1JvdykgPT4geC51c2VybmFtZV9sb3dlcixcclxuICAgICh4OiBSYW5raW5nUm93KSA9PiB4LmRpc3BsYXlfc3RyaW5nX2xvd2VyLFxyXG4gICAgKHg6IFJhbmtpbmdSb3cpID0+IHgubW9kcyxcclxuICAgICh4OiBSYW5raW5nUm93KSA9PiB4LmFjY3VyYWN5LFxyXG4gICAgKHg6IFJhbmtpbmdSb3cpID0+IHguY29tYm9fZGlzcGxheSxcclxuICAgICh4OiBSYW5raW5nUm93KSA9PiB4LmRhdGVfcGxheWVkX3N0cmluZyxcclxuXTtcclxuXHJcbmZ1bmN0aW9uIGRyYXdSYW5raW5nVGFibGUoKSB7XHJcbiAgICBjb25zdCBpbmRpY2VzID0gcmFua2luZ1Jvd3MubWFwKChfcm93LCBpKSA9PiBpKTtcclxuICAgIGNvbnN0IHByZXZJbmRleCA9IEFycmF5KHJhbmtpbmdSb3dzLmxlbmd0aCk7XHJcbiAgICBmb3IgKGNvbnN0IG9yZCBvZiBjdXJyZW50U29ydE9yZGVyKSB7XHJcbiAgICAgICAgaWYgKG9yZCA9PT0gMCkgY29udGludWU7XHJcbiAgICAgICAgaW5kaWNlcy5mb3JFYWNoKCh4LCBpKSA9PiBwcmV2SW5kZXhbeF0gPSBpKTtcclxuICAgICAgICBjb25zdCBzb3J0S2V5ID0gcmFua2luZ1NvcnRLZXlzW01hdGguYWJzKG9yZCkgLSAxXTtcclxuICAgICAgICBjb25zdCBzaWduID0gb3JkID4gMCA/IDEgOiAtMTtcclxuICAgICAgICBpbmRpY2VzLnNvcnQoKHgsIHkpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qga3ggPSBzb3J0S2V5KHJhbmtpbmdSb3dzW3hdKTtcclxuICAgICAgICAgICAgY29uc3Qga3kgPSBzb3J0S2V5KHJhbmtpbmdSb3dzW3ldKTtcclxuICAgICAgICAgICAgcmV0dXJuIGt4IDwga3kgPyAtc2lnbiA6IGt4ID4ga3kgPyBzaWduIDogcHJldkluZGV4W3hdIC0gcHJldkluZGV4W3ldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZHJhd1RhYmxlKGluZGljZXMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByYW5raW5nTWFpbigpIHtcclxuICAgIGluaXRUYWJsZShyYW5raW5nU29ydEtleXMsIHJhbmtpbmdPcmRlckNvbmZpZywgZHJhd1JhbmtpbmdUYWJsZSk7XHJcbiAgICBjb25zdCBsb2FkRGF0YSA9IChkYXRhOiBSYW5raW5nUm93RGF0YVtdLCBsYXN0TW9kaWZpZWQ6IERhdGUpID0+IHtcclxuICAgICAgICAkKCcjbGFzdC11cGRhdGUtdGltZScpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoJCgnPHRpbWU+JylcclxuICAgICAgICAgICAgICAgIC5hdHRyKCdkYXRldGltZScsIGxhc3RNb2RpZmllZC50b0lTT1N0cmluZygpKVxyXG4gICAgICAgICAgICAgICAgLnRleHQobGFzdE1vZGlmaWVkLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSkpO1xyXG4gICAgICAgIHJhbmtpbmdSb3dzID0gZGF0YS5tYXAoeCA9PiBuZXcgUmFua2luZ1Jvdyh4KSk7XHJcbiAgICAgICAgaW5pdFVuc29ydGVkUmFua2luZ1RhYmxlUm93cygpO1xyXG4gICAgICAgIGRyYXdSYW5raW5nVGFibGUoKTtcclxuICAgICAgICAkKCcjc3VtbWFyeS10YWJsZS1sb2FkZXInKS5oaWRlKCk7XHJcbiAgICB9O1xyXG4gICAgJC5nZXRKU09OKCdkYXRhL3JhbmtpbmcuanNvbicpLnRoZW4oKGRhdGEsIF8sIHhocikgPT4ge1xyXG4gICAgICAgIGxvYWREYXRhKGRhdGEsIG5ldyBEYXRlKHhoci5nZXRSZXNwb25zZUhlYWRlcignTGFzdC1Nb2RpZmllZCcpIGFzIHN0cmluZykpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmlmICgvcmFua2luZ1xcLmh0bWwkL2kudGVzdChsb2NhdGlvbi5wYXRobmFtZSkpIHtcclxuICAgICQocmFua2luZ01haW4pO1xyXG59IGVsc2Uge1xyXG4gICAgJChtYWluKTtcclxufVxyXG5cclxufVxyXG4iXX0=