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
    var _this = this;
    var MINIMUM_DATE = new Date(0);
    var SummaryRow = /** @class */ (function () {
        function SummaryRow(data) {
            this.data = data;
            this.approved_status = data[0], this.approved_date = data[1], this.mode = data[2], this.beatmap_id = data[3], this.beatmapset_id = data[4], this.display_string = data[5], this.stars = data[6], this.pp = data[7], this.hit_length = data[8], this.max_combo = data[9], this.approach_rate = data[10], this.circle_size = data[11], this.min_misses = data[12], this.fcNM = data[13], this.fcHD = data[14], this.fcHR = data[15], this.fcHDHR = data[16], this.fcDT = data[17], this.fcHDDT = data[18];
            this.beatmap_id_number = parseInt(this.beatmap_id);
            this.display_string_lower = this.display_string.toLowerCase();
            this.info = null;
        }
        return SummaryRow;
    }());
    var summaryRows = [];
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
        function (x) { return x.approved_date; },
        function (x) { return x.display_string; },
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
        if (filter_mode !== 1)
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
        var _loop_1 = function (ord) {
            if (ord === 0)
                return "continue";
            var prevIndex = Array(indices.length);
            indices.forEach(function (x, i) { return prevIndex[x] = i; });
            var sortKey = sortKeys[Math.abs(ord) - 1];
            var sign = ord > 0 ? 1 : -1;
            indices.sort(function (x, y) {
                var kx = sortKey(summaryRows[x]);
                var ky = sortKey(summaryRows[y]);
                return kx < ky ? -sign : kx > ky ? sign : prevIndex[y] - prevIndex[x];
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
    function simplySortOrder(order) {
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
            if ([0, 1, 2, 3, 4, 5, 9].indexOf(key) !== -1)
                break;
        }
        if (res.length !== 0 && res[res.length - 1] === -3)
            res.pop();
        res.reverse();
        return res;
    }
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
            obj.m = '1';
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
        currentSortOrder = simplySortOrder(obj.o.split('.').map(function (x) { return parseInt(x) || 0; }));
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
                    document.createTextNode(row.approved_date.split(' ')[0])
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
    $(function () {
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
        var thList = $('#summary-table > thead > tr > th');
        sortKeys.forEach(function (_, index) {
            $.data(thList[index], 'thIndex', index);
        });
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
        thList.click(function (event) {
            var th = $(event.target);
            var sign;
            if (th.hasClass('sorted'))
                sign = th.hasClass('descending') ? 1 : -1;
            else
                sign = th.hasClass('desc-first') ? -1 : 1;
            var thIndex = th.data('thIndex');
            currentSortOrder.push((thIndex + 1) * sign);
            currentSortOrder = simplySortOrder(currentSortOrder);
            setTableHeadSortingMark();
            drawTableForCurrentFiltering();
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
    });
})(ListMaps || (ListMaps = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1tYXBzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpc3QtbWFwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFVLFFBQVEsQ0F3MUJqQjtBQXgxQkQsV0FBVSxRQUFROztJQWVsQixJQUFNLFlBQVksR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqQztRQXVCSSxvQkFBNkIsSUFBb0I7WUFBcEIsU0FBSSxHQUFKLElBQUksQ0FBZ0I7WUFFekMsOEJBQW9CLEVBQ3BCLDRCQUFrQixFQUNsQixtQkFBUyxFQUNULHlCQUFlLEVBQ2YsNEJBQWtCLEVBQ2xCLDZCQUFtQixFQUNuQixvQkFBVSxFQUNWLGlCQUFPLEVBQ1AseUJBQWUsRUFDZix3QkFBYyxFQUNkLDZCQUFrQixFQUNsQiwyQkFBZ0IsRUFDaEIsMEJBQWUsRUFDZixvQkFBUyxFQUNULG9CQUFTLEVBQ1Qsb0JBQVMsRUFDVCxzQkFBVyxFQUNYLG9CQUFTLEVBQ1Qsc0JBQVcsQ0FDTjtZQUNULElBQUksQ0FBQyxpQkFBaUIsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzlELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLENBQUM7UUFDTCxpQkFBQztJQUFELENBQUMsQUFqREQsSUFpREM7SUFFRCxJQUFJLFdBQVcsR0FBaUIsRUFBRSxDQUFDO0lBQ25DLElBQUksaUJBQWlCLEdBQTBCLEVBQUUsQ0FBQztJQUNsRCxJQUFJLGdCQUFnQixHQUFhLEVBQUUsQ0FBQztJQUNwQyxJQUFJLGVBQWUsR0FBRyxHQUFHLENBQUM7SUFFMUIsSUFBSSxlQUFlLEdBQUcsRUFBRSxDQUFDO0lBQ3pCLElBQUksd0JBQXdCLEdB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QUM7d0JBQ3JCLFNBQU8sSUFBSSxDQUFDLElBQUksQ0FBQzs2QkFDbkIsQ0FBQSxNQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBLEVBQTlCLHdCQUE4Qjt3QkFDOUIscUJBQU0sWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsRUFBQTs7d0JBQW5DLFNBQW1DLENBQUM7Ozs2QkFDN0IsQ0FBQSxNQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBLEVBQWhDLHdCQUFnQzt3QkFDdkMscUJBQU0sWUFBWSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsRUFBQTs7d0JBQXJDLFNBQXFDLENBQUM7Ozt3QkFFdEMsZ0JBQWdCLENBQUMsa0JBQWdCLE1BQUkseUNBQXNDLENBQUMsQ0FBQzt3QkFDN0Usd0JBQVM7O3dCQUViLEVBQUUsQ0FBQyxDQUFDLHFCQUFxQixFQUFFLENBQUM7NEJBQ3hCLDRCQUE0QixFQUFFLENBQUM7Ozt3QkFaQSxDQUFDLElBQUksQ0FBQyxDQUFBOzs7d0JBYzdDLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDOzs7O2FBQ25CLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQyxDQUFDO0FBRUgsQ0FBQyxFQXgxQlMsUUFBUSxLQUFSLFFBQVEsUUF3MUJqQiIsInNvdXJjZXNDb250ZW50IjpbIm5hbWVzcGFjZSBMaXN0TWFwcyB7XHJcblxyXG5pbnRlcmZhY2UgSlF1ZXJ5IHtcclxuICAgIHRhYmxlc29ydCgpOiB2b2lkO1xyXG4gICAgZGF0YShrZXk6ICdzb3J0QnknLCBrZXlGdW5jOiAoXHJcbiAgICAgICAgdGg6IEhUTUxUYWJsZUhlYWRlckNlbGxFbGVtZW50LFxyXG4gICAgICAgIHRkOiBIVE1MVGFibGVEYXRhQ2VsbEVsZW1lbnQsXHJcbiAgICAgICAgdGFibGVzb3J0OiBhbnkpID0+IHZvaWQpOiB0aGlzO1xyXG59XHJcblxyXG50eXBlIFN1bW1hcnlSb3dEYXRhID1cclxuW1xyXG4gICAgbnVtYmVyLCBzdHJpbmcsIG51bWJlciwgc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgbnVtYmVyLCBudW1iZXIsIG51bWJlcixcclxuICAgIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyXHJcbl07XHJcbmNvbnN0IE1JTklNVU1fREFURSA9IG5ldyBEYXRlKDApO1xyXG5jbGFzcyBTdW1tYXJ5Um93IHtcclxuICAgIGFwcHJvdmVkX3N0YXR1czogbnVtYmVyO1xyXG4gICAgYXBwcm92ZWRfZGF0ZTogc3RyaW5nO1xyXG4gICAgbW9kZTogbnVtYmVyO1xyXG4gICAgYmVhdG1hcF9pZDogc3RyaW5nO1xyXG4gICAgYmVhdG1hcF9pZF9udW1iZXI6IG51bWJlcjtcclxuICAgIGJlYXRtYXBzZXRfaWQ6IHN0cmluZztcclxuICAgIGRpc3BsYXlfc3RyaW5nOiBzdHJpbmc7XHJcbiAgICBkaXNwbGF5X3N0cmluZ19sb3dlcjogc3RyaW5nO1xyXG4gICAgc3RhcnM6IG51bWJlcjtcclxuICAgIHBwOiBudW1iZXI7XHJcbiAgICBoaXRfbGVuZ3RoOiBudW1iZXI7XHJcbiAgICBtYXhfY29tYm86IG51bWJlcjtcclxuICAgIGFwcHJvYWNoX3JhdGU6IG51bWJlcjtcclxuICAgIGNpcmNsZV9zaXplOiBudW1iZXI7XHJcbiAgICBtaW5fbWlzc2VzOiBudW1iZXI7XHJcbiAgICBmY05NOiBudW1iZXI7XHJcbiAgICBmY0hEOiBudW1iZXI7XHJcbiAgICBmY0hSOiBudW1iZXI7XHJcbiAgICBmY0hESFI6IG51bWJlcjtcclxuICAgIGZjRFQ6IG51bWJlcjtcclxuICAgIGZjSEREVDogbnVtYmVyO1xyXG4gICAgaW5mbzogQmVhdG1hcEluZm8gfCBudWxsO1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBkYXRhOiBTdW1tYXJ5Um93RGF0YSkge1xyXG4gICAgICAgIFtcclxuICAgICAgICAgICAgdGhpcy5hcHByb3ZlZF9zdGF0dXMsXHJcbiAgICAgICAgICAgIHRoaXMuYXBwcm92ZWRfZGF0ZSxcclxuICAgICAgICAgICAgdGhpcy5tb2RlLFxyXG4gICAgICAgICAgICB0aGlzLmJlYXRtYXBfaWQsXHJcbiAgICAgICAgICAgIHRoaXMuYmVhdG1hcHNldF9pZCxcclxuICAgICAgICAgICAgdGhpcy5kaXNwbGF5X3N0cmluZyxcclxuICAgICAgICAgICAgdGhpcy5zdGFycyxcclxuICAgICAgICAgICAgdGhpcy5wcCxcclxuICAgICAgICAgICAgdGhpcy5oaXRfbGVuZ3RoLFxyXG4gICAgICAgICAgICB0aGlzLm1heF9jb21ibyxcclxuICAgICAgICAgICAgdGhpcy5hcHByb2FjaF9yYXRlLFxyXG4gICAgICAgICAgICB0aGlzLmNpcmNsZV9zaXplLFxyXG4gICAgICAgICAgICB0aGlzLm1pbl9taXNzZXMsXHJcbiAgICAgICAgICAgIHRoaXMuZmNOTSxcclxuICAgICAgICAgICAgdGhpcy5mY0hELFxyXG4gICAgICAgICAgICB0aGlzLmZjSFIsXHJcbiAgICAgICAgICAgIHRoaXMuZmNIREhSLFxyXG4gICAgICAgICAgICB0aGlzLmZjRFQsXHJcbiAgICAgICAgICAgIHRoaXMuZmNIRERULFxyXG4gICAgICAgIF0gPSBkYXRhO1xyXG4gICAgICAgIHRoaXMuYmVhdG1hcF9pZF9udW1iZXIgPSBwYXJzZUludCh0aGlzLmJlYXRtYXBfaWQpO1xyXG4gICAgICAgIHRoaXMuZGlzcGxheV9zdHJpbmdfbG93ZXIgPSB0aGlzLmRpc3BsYXlfc3RyaW5nLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgdGhpcy5pbmZvID0gbnVsbDtcclxuICAgIH1cclxufVxyXG5cclxubGV0IHN1bW1hcnlSb3dzOiBTdW1tYXJ5Um93W10gPSBbXTtcclxubGV0IHVuc29ydGVkVGFibGVSb3dzOiBIVE1MVGFibGVSb3dFbGVtZW50W10gPSBbXTtcclxubGV0IGN1cnJlbnRTb3J0T3JkZXI6IG51bWJlcltdID0gW107XHJcbmxldCBjdXJyZW50SGFzaExpbmsgPSAnIyc7XHJcblxyXG5sZXQgcHJldmlvdXNJbmRpY2VzID0gJyc7XHJcbmxldCB1bnNvcnRlZFRhYmxlUm93c0NoYW5nZWQgPSBmYWxzZTtcclxuZnVuY3Rpb24gZHJhd1RhYmxlKGluZGljZXM6IG51bWJlcltdKSB7XHJcbiAgICBjb25zdCBzdHIgPSBpbmRpY2VzLmpvaW4oJywnKTtcclxuICAgIGlmICghdW5zb3J0ZWRUYWJsZVJvd3NDaGFuZ2VkICYmIHByZXZpb3VzSW5kaWNlcyA9PT0gc3RyKSByZXR1cm47XHJcbiAgICB1bnNvcnRlZFRhYmxlUm93c0NoYW5nZWQgPSBmYWxzZTtcclxuICAgIHByZXZpb3VzSW5kaWNlcyA9IHN0cjtcclxuICAgICQoJyNzdW1tYXJ5LXRhYmxlID4gdGJvZHknKVxyXG4gICAgICAgIC5lbXB0eSgpXHJcbiAgICAgICAgLmFwcGVuZChpbmRpY2VzLm1hcChpbmRleCA9PiB1bnNvcnRlZFRhYmxlUm93c1tpbmRleF0pKTtcclxufVxyXG5cclxuY2xhc3MgU2VhcmNoUXVlcnkge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNoZWNrOiAocm93OiBTdW1tYXJ5Um93KSA9PiBib29sZWFuO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IG5vcm1hbGl6ZWRfc291cmNlOiBzdHJpbmc7XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgc291cmNlOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBrZXlfdG9fcHJvcGVydHlfbmFtZSA9IHtcclxuICAgICAgICAgICAgJ3N0YXR1cyc6ICdcInBwcHJhcWxcIltyb3cuYXBwcm92ZWRfc3RhdHVzKzJdJyxcclxuICAgICAgICAgICAgJ21vZGUnOiAnXCJvdGNtXCJbcm93Lm1vZGVdJyxcclxuICAgICAgICAgICAgJ3N0YXJzJzogJ3Jvdy5zdGFycycsXHJcbiAgICAgICAgICAgICdwcCc6ICdyb3cucHAnLFxyXG4gICAgICAgICAgICAnbGVuZ3RoJzogJ3Jvdy5oaXRfbGVuZ3RoJyxcclxuICAgICAgICAgICAgJ2NvbWJvJzogJ3Jvdy5tYXhfY29tYm8nLFxyXG4gICAgICAgICAgICAnYXInOiAncm93LmFwcHJvYWNoX3JhdGUnLFxyXG4gICAgICAgICAgICAnY3MnOiAncm93LmNpcmNsZV9zaXplJyxcclxuICAgICAgICAgICAgJ3BsYXllZCc6IGAoIXJvdy5pbmZvP0luZmluaXR5Oigke25ldyBEYXRlKCkudmFsdWVPZigpfS1yb3cuaW5mby5sYXN0UGxheWVkLnZhbHVlT2YoKSkvJHsxZTMgKiA2MCAqIDYwICogMjR9KWAsXHJcbiAgICAgICAgICAgICd1bnBsYXllZCc6IGAocm93LmluZm8mJnJvdy5pbmZvLmxhc3RQbGF5ZWQudmFsdWVPZigpIT09JHtNSU5JTVVNX0RBVEUudmFsdWVPZigpfT8neSc6JycpYCxcclxuICAgICAgICAgICAgJ3JhbmsnOiBgKCR7SlNPTi5zdHJpbmdpZnkocmFua0FjaGlldmVkQ2xhc3MpfVshcm93LmluZm8/OTpyb3cuaW5mby5yYW5rQWNoaWV2ZWRdKS50b0xvd2VyQ2FzZSgpYFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgY29uc3QgcmVnZXhwID0gbmV3IFJlZ0V4cChgKCR7XHJcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGtleV90b19wcm9wZXJ0eV9uYW1lKS5qb2luKCd8JylcclxuICAgICAgICB9KSg8PT98Pj0/fD18IT0pKFstXFxcXHdcXFxcLl0qKWApO1xyXG4gICAgICAgIGxldCBjaGVja19mdW5jX3NvdXJjZSA9ICdyZXR1cm4gdHJ1ZSc7XHJcbiAgICAgICAgdGhpcy5ub3JtYWxpemVkX3NvdXJjZSA9ICcnO1xyXG4gICAgICAgIGZvciAoY29uc3QgdG9rZW4gb2Ygc291cmNlLnNwbGl0KCcgJykpIHtcclxuICAgICAgICAgICAgY29uc3QgdHJpbW1lZCA9IHRva2VuLnRyaW0oKTtcclxuICAgICAgICAgICAgaWYgKHRyaW1tZWQgPT09ICcnKSBjb250aW51ZTtcclxuICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSByZWdleHAuZXhlYyh0cmltbWVkKTtcclxuICAgICAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSBtYXRjaFsxXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlbCA9IG1hdGNoWzJdID09PSAnPScgPyAnPT0nIDogbWF0Y2hbMl07XHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsOiBudW1iZXIgfCBzdHJpbmcgPSBwYXJzZUZsb2F0KG1hdGNoWzNdKTtcclxuICAgICAgICAgICAgICAgIGlmIChpc05hTih2YWwpKVxyXG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IG1hdGNoWzNdLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wID0gKGtleV90b19wcm9wZXJ0eV9uYW1lIGFzIGFueSlba2V5XTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5vcm1hbGl6ZWRfc291cmNlICE9PSAnJykgdGhpcy5ub3JtYWxpemVkX3NvdXJjZSArPSAnICc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5vcm1hbGl6ZWRfc291cmNlICs9IG1hdGNoWzFdICsgbWF0Y2hbMl0gKyBtYXRjaFszXTtcclxuICAgICAgICAgICAgICAgIGNoZWNrX2Z1bmNfc291cmNlICs9IGAmJiR7cHJvcH0ke3JlbH0ke0pTT04uc3RyaW5naWZ5KHZhbCl9YDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0ciA9IHRyaW1tZWQudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVzY2FwZWQgPSBKU09OLnN0cmluZ2lmeShzdHIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubm9ybWFsaXplZF9zb3VyY2UgIT09ICcnKSB0aGlzLm5vcm1hbGl6ZWRfc291cmNlICs9ICcgJztcclxuICAgICAgICAgICAgICAgIHRoaXMubm9ybWFsaXplZF9zb3VyY2UgKz0gc3RyO1xyXG4gICAgICAgICAgICAgICAgY2hlY2tfZnVuY19zb3VyY2UgKz0gYCYmcm93LmRpc3BsYXlfc3RyaW5nX2xvd2VyLmluZGV4T2YoJHtlc2NhcGVkfSkhPT0tMWA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jaGVjayA9IG5ldyBGdW5jdGlvbigncm93JywgY2hlY2tfZnVuY19zb3VyY2UpIGFzIGFueTtcclxuICAgIH1cclxufVxyXG5cclxuY29uc3Qgc29ydEtleXMgPSBbXHJcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5hcHByb3ZlZF9kYXRlLFxyXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHguZGlzcGxheV9zdHJpbmcsXHJcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5zdGFycyxcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LnBwLFxyXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHguaGl0X2xlbmd0aCxcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4Lm1heF9jb21ibyxcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LmFwcHJvYWNoX3JhdGUsXHJcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5jaXJjbGVfc2l6ZSxcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PlxyXG4gICAgICAgIHguZmNIRERUICogMiArIHguZmNEVCAqIDFlOCArXHJcbiAgICAgICAgeC5mY0hESFIgKiAyICsgeC5mY0hSICogMWU0ICtcclxuICAgICAgICB4LmZjSEQgKiAyICsgeC5mY05NIC1cclxuICAgICAgICB4Lm1pbl9taXNzZXMsXHJcbiAgICAoeDogU3VtbWFyeVJvdykgPT4gIXguaW5mbyA/IE1JTklNVU1fREFURS52YWx1ZU9mKCkgOiB4LmluZm8ubGFzdFBsYXllZC52YWx1ZU9mKClcclxuXTtcclxuXHJcbmZ1bmN0aW9uIHN0cmluZ2lmeU9iamVjdChvYmo6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nOyB9KTogc3RyaW5nIHtcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopXHJcbiAgICAgICAgLm1hcChrID0+IGsgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQob2JqW2tdKSlcclxuICAgICAgICAuam9pbignJicpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZU9iamVjdChzdHI6IHN0cmluZykge1xyXG4gICAgY29uc3QgcmVzID0ge307XHJcbiAgICBzdHIuc3BsaXQoJyYnKS5mb3JFYWNoKHBhcnQgPT4ge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoID0gcGFydC5tYXRjaCgvKFxcdyspPSguKykvKTtcclxuICAgICAgICBpZiAobWF0Y2gpXHJcbiAgICAgICAgICAgIChyZXMgYXMgYW55KVttYXRjaFsxXV0gPSBkZWNvZGVVUklDb21wb25lbnQobWF0Y2hbMl0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCkge1xyXG4gICAgY29uc3QgZmlsdGVyX2FwcHJvdmVkX3N0YXR1cyA9IHBhcnNlSW50KCQoJyNmaWx0ZXItYXBwcm92ZWQtc3RhdHVzJykudmFsKCkgYXMgc3RyaW5nKTtcclxuICAgIGNvbnN0IGZpbHRlcl9tb2RlID0gcGFyc2VJbnQoJCgnI2ZpbHRlci1tb2RlJykudmFsKCkgYXMgc3RyaW5nKTtcclxuICAgIGNvbnN0IGZpbHRlcl9zZWFyY2hfcXVlcnkgPSBuZXcgU2VhcmNoUXVlcnkoKCQoJyNmaWx0ZXItc2VhcmNoLXF1ZXJ5JykudmFsKCkgYXMgc3RyaW5nKSk7XHJcbiAgICBjb25zdCBmaWx0ZXJfZmNfbGV2ZWwgPSBwYXJzZUludCgkKCcjZmlsdGVyLWZjLWxldmVsJykudmFsKCkgYXMgc3RyaW5nKTtcclxuICAgIGNvbnN0IGZpbHRlcl9sb2NhbF9kYXRhID0gcGFyc2VJbnQoJCgnI2ZpbHRlci1sb2NhbC1kYXRhJykudmFsKCkgYXMgc3RyaW5nKTtcclxuICAgIGNvbnN0IHNob3dfZnVsbF9yZXN1bHQgPSAkKCcjc2hvdy1mdWxsLXJlc3VsdCcpLnByb3AoJ2NoZWNrZWQnKTtcclxuXHJcbiAgICBjb25zdCBnZXRfZmNfbGV2ZWwgPSAocm93OiBTdW1tYXJ5Um93KSA9PiB7XHJcbiAgICAgICAgaWYgKHJvdy5taW5fbWlzc2VzICE9PSAwKSByZXR1cm4gMTtcclxuICAgICAgICBpZiAocm93LmZjRFQgIT09IDAgfHwgcm93LmZjSEREVCAhPT0gMCkgcmV0dXJuIDg7XHJcbiAgICAgICAgaWYgKHJvdy5mY05NID09PSAwICYmIHJvdy5mY0hEID09PSAwICYmIHJvdy5mY0hSID09PSAwICYmIHJvdy5mY0hESFIgPT09IDApIHJldHVybiAyO1xyXG4gICAgICAgIGlmIChyb3cuZmNOTSA9PT0gMCAmJiByb3cuZmNIRCA9PT0gMCkgcmV0dXJuIDM7XHJcbiAgICAgICAgaWYgKHJvdy5mY0hEID09PSAwKSByZXR1cm4gNDtcclxuICAgICAgICBpZiAocm93LmZjSFIgPT09IDAgJiYgcm93LmZjSERIUiA9PT0gMCkgcmV0dXJuIDU7XHJcbiAgICAgICAgaWYgKHJvdy5mY0hESFIgPT09IDApIHJldHVybiA2O1xyXG4gICAgICAgIHJldHVybiA3O1xyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBnZXRfbG9jYWxfZGF0YV9mbGFncyA9IChyb3c6IFN1bW1hcnlSb3cpOiBudW1iZXIgPT4ge1xyXG4gICAgICAgIGlmIChiZWF0bWFwSW5mb01hcC5zaXplID09PSAwKSByZXR1cm4gLTE7XHJcbiAgICAgICAgbGV0IGZsYWdzID0gMDtcclxuICAgICAgICBjb25zdCBpbmZvID0gYmVhdG1hcEluZm9NYXAuZ2V0KHJvdy5iZWF0bWFwX2lkX251bWJlcik7XHJcbiAgICAgICAgaWYgKCFpbmZvKSByZXR1cm4gMDtcclxuICAgICAgICBmbGFncyB8PSAyO1xyXG4gICAgICAgIGlmIChpbmZvLmxhc3RQbGF5ZWQudmFsdWVPZigpICE9PSBNSU5JTVVNX0RBVEUudmFsdWVPZigpKVxyXG4gICAgICAgICAgICBmbGFncyB8PSAxO1xyXG4gICAgICAgIHJldHVybiBmbGFncztcclxuICAgIH07XHJcblxyXG4gICAgY3VycmVudEhhc2hMaW5rID0gJyMnO1xyXG4gICAgY29uc3Qgb2JqID0ge30gYXMgeyBba2V5OiBzdHJpbmddOiBzdHJpbmc7IH07XHJcbiAgICBpZiAoZmlsdGVyX2FwcHJvdmVkX3N0YXR1cyAhPT0gMSlcclxuICAgICAgICBvYmoucyA9IGZpbHRlcl9hcHByb3ZlZF9zdGF0dXMudG9TdHJpbmcoKTtcclxuICAgIGlmIChmaWx0ZXJfbW9kZSAhPT0gMSlcclxuICAgICAgICBvYmoubSA9IGZpbHRlcl9tb2RlLnRvU3RyaW5nKCk7XHJcbiAgICBpZiAoZmlsdGVyX3NlYXJjaF9xdWVyeS5ub3JtYWxpemVkX3NvdXJjZSAhPT0gJycpXHJcbiAgICAgICAgb2JqLnEgPSBmaWx0ZXJfc2VhcmNoX3F1ZXJ5Lm5vcm1hbGl6ZWRfc291cmNlO1xyXG4gICAgaWYgKGZpbHRlcl9mY19sZXZlbCAhPT0gMClcclxuICAgICAgICBvYmoubCA9IGZpbHRlcl9mY19sZXZlbC50b1N0cmluZygpO1xyXG4gICAgaWYgKGZpbHRlcl9sb2NhbF9kYXRhICE9PSAwKVxyXG4gICAgICAgIG9iai5kID0gZmlsdGVyX2xvY2FsX2RhdGEudG9TdHJpbmcoKTtcclxuICAgIGlmIChjdXJyZW50U29ydE9yZGVyLmxlbmd0aCAhPT0gMClcclxuICAgICAgICBvYmoubyA9IGN1cnJlbnRTb3J0T3JkZXIuam9pbignLicpO1xyXG4gICAgaWYgKHNob3dfZnVsbF9yZXN1bHQpXHJcbiAgICAgICAgb2JqLmYgPSAnMSc7XHJcblxyXG4gICAgY3VycmVudEhhc2hMaW5rICs9IHN0cmluZ2lmeU9iamVjdChvYmopO1xyXG4gICAgaGlzdG9yeS5yZXBsYWNlU3RhdGUoe30sIGRvY3VtZW50LnRpdGxlLCBsb2NhdGlvbi5wYXRobmFtZSArIChjdXJyZW50SGFzaExpbmsgPT09ICcjJyA/ICcnIDogY3VycmVudEhhc2hMaW5rKSk7XHJcblxyXG4gICAgY29uc3QgaW5kaWNlcyA9IHN1bW1hcnlSb3dzLm1hcCgoXywgaW5kZXgpID0+IGluZGV4KS5maWx0ZXIoaW5kZXggPT4ge1xyXG4gICAgICAgIGNvbnN0IHJvdyA9IHN1bW1hcnlSb3dzW2luZGV4XTtcclxuXHJcbiAgICAgICAgaWYgKGZpbHRlcl9hcHByb3ZlZF9zdGF0dXMgPT09IDEgJiZcclxuICAgICAgICAgICAgKHJvdy5hcHByb3ZlZF9zdGF0dXMgIT09IDEgJiYgcm93LmFwcHJvdmVkX3N0YXR1cyAhPT0gMikpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICBpZiAoZmlsdGVyX2FwcHJvdmVkX3N0YXR1cyA9PT0gMiAmJiByb3cuYXBwcm92ZWRfc3RhdHVzICE9PSA0KVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmIChmaWx0ZXJfbW9kZSA9PT0gMSAmJiByb3cubW9kZSAhPT0gMClcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGlmIChmaWx0ZXJfbW9kZSA9PT0gMiAmJiByb3cubW9kZSAhPT0gMilcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoIWZpbHRlcl9zZWFyY2hfcXVlcnkuY2hlY2socm93KSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoZmlsdGVyX2ZjX2xldmVsICE9PSAwICYmIGdldF9mY19sZXZlbChyb3cpICE9PSBmaWx0ZXJfZmNfbGV2ZWwpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKGZpbHRlcl9sb2NhbF9kYXRhICE9PSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZsYWdzID0gZ2V0X2xvY2FsX2RhdGFfZmxhZ3Mocm93KTtcclxuICAgICAgICAgICAgc3dpdGNoIChmaWx0ZXJfbG9jYWxfZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAxOiBpZiAoKGZsYWdzICYgMSkgIT09IDApIHJldHVybiBmYWxzZTsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDI6IGlmICgoZmxhZ3MgJiAxKSA9PT0gMCkgcmV0dXJuIGZhbHNlOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgMzogaWYgKChmbGFncyAmIDIpICE9PSAwKSByZXR1cm4gZmFsc2U7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBpZiAoKGZsYWdzICYgMikgPT09IDApIHJldHVybiBmYWxzZTsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDU6IGlmICgoZmxhZ3MgJiAzKSAhPT0gMikgcmV0dXJuIGZhbHNlOyBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9KTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IG9yZCBvZiBjdXJyZW50U29ydE9yZGVyKSB7XHJcbiAgICAgICAgaWYgKG9yZCA9PT0gMCkgY29udGludWU7XHJcbiAgICAgICAgY29uc3QgcHJldkluZGV4ID0gQXJyYXkoaW5kaWNlcy5sZW5ndGgpO1xyXG4gICAgICAgIGluZGljZXMuZm9yRWFjaCgoeCwgaSkgPT4gcHJldkluZGV4W3hdID0gaSk7XHJcbiAgICAgICAgY29uc3Qgc29ydEtleSA9IHNvcnRLZXlzW01hdGguYWJzKG9yZCkgLSAxXTtcclxuICAgICAgICBjb25zdCBzaWduID0gb3JkID4gMCA/IDEgOiAtMTtcclxuICAgICAgICBpbmRpY2VzLnNvcnQoKHgsIHkpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qga3ggPSBzb3J0S2V5KHN1bW1hcnlSb3dzW3hdKTtcclxuICAgICAgICAgICAgY29uc3Qga3kgPSBzb3J0S2V5KHN1bW1hcnlSb3dzW3ldKTtcclxuICAgICAgICAgICAgcmV0dXJuIGt4IDwga3kgPyAtc2lnbiA6IGt4ID4ga3kgPyBzaWduIDogcHJldkluZGV4W3ldIC0gcHJldkluZGV4W3hdO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgICQoJyNudW0tcmVzdWx0cycpLnRleHQoaW5kaWNlcy5sZW5ndGggPT09IDEgPyAnMSBtYXAnIDogaW5kaWNlcy5sZW5ndGgudG9TdHJpbmcoKSArICcgbWFwcycpO1xyXG4gICAgY29uc3QgdHJ1bmNhdGVfbnVtID0gc2hvd19mdWxsX3Jlc3VsdCA/IEluZmluaXR5IDogMTAwO1xyXG4gICAgaWYgKGluZGljZXMubGVuZ3RoID4gdHJ1bmNhdGVfbnVtKVxyXG4gICAgICAgIGluZGljZXMubGVuZ3RoID0gdHJ1bmNhdGVfbnVtO1xyXG5cclxuICAgICQoJyNoYXNoLWxpbmstdG8tdGhlLWN1cnJlbnQtdGFibGUnKS5hdHRyKCdocmVmJywgY3VycmVudEhhc2hMaW5rKTtcclxuXHJcbiAgICBkcmF3VGFibGUoaW5kaWNlcyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbXBseVNvcnRPcmRlcihvcmRlcjogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICBjb25zdCByZXMgPSBbXTtcclxuICAgIGNvbnN0IHNlZW4gPSBBcnJheShzb3J0S2V5cy5sZW5ndGgpO1xyXG4gICAgZm9yIChsZXQgaSA9IG9yZGVyLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS0gaSkge1xyXG4gICAgICAgIGNvbnN0IHggPSBvcmRlcltpXTtcclxuICAgICAgICBpZiAoeCA9PT0gMCkgY29udGludWU7XHJcbiAgICAgICAgY29uc3Qga2V5ID0gTWF0aC5hYnMoeCkgLSAxLCBzaWduID0geCA+IDAgPyAxIDogLTE7XHJcbiAgICAgICAgaWYgKHNlZW5ba2V5XSkgY29udGludWU7XHJcbiAgICAgICAgc2VlbltrZXldID0gc2lnbjtcclxuICAgICAgICByZXMucHVzaCh4KTtcclxuICAgICAgICBpZiAoWzAsIDEsIDIsIDMsIDQsIDUsIDldLmluZGV4T2Yoa2V5KSAhPT0gLTEpIC8vIHRoZXJlIGlzIGFsbW9zdCBubyB0aWVzXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgaWYgKHJlcy5sZW5ndGggIT09IDAgJiYgcmVzW3Jlcy5sZW5ndGggLSAxXSA9PT0gLTMpXHJcbiAgICAgICAgcmVzLnBvcCgpO1xyXG4gICAgcmVzLnJldmVyc2UoKTtcclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFF1ZXJ5QWNjb3JkaW5nVG9IYXNoKCkge1xyXG4gICAgbGV0IG9iajogeyBbazogc3RyaW5nXTogc3RyaW5nOyB9O1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBvYmogPSBwYXJzZU9iamVjdChsb2NhdGlvbi5oYXNoLnN1YnN0cigxKSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgb2JqID0ge307XHJcbiAgICB9XHJcbiAgICBpZiAob2JqLnMgPT09IHVuZGVmaW5lZCkgb2JqLnMgPSAnMSc7XHJcbiAgICBpZiAob2JqLm0gPT09IHVuZGVmaW5lZCkgb2JqLm0gPSAnMSc7XHJcbiAgICBpZiAob2JqLnEgPT09IHVuZGVmaW5lZCkgb2JqLnEgPSAnJztcclxuICAgIGlmIChvYmoubCA9PT0gdW5kZWZpbmVkKSBvYmoubCA9ICcwJztcclxuICAgIGlmIChvYmoubyA9PT0gdW5kZWZpbmVkKSBvYmoubyA9ICcnO1xyXG4gICAgaWYgKG9iai5mID09PSB1bmRlZmluZWQpIG9iai5mID0gJzAnO1xyXG4gICAgaWYgKG9iai5kID09PSB1bmRlZmluZWQpIG9iai5kID0gJzAnO1xyXG4gICAgJCgnI2ZpbHRlci1hcHByb3ZlZC1zdGF0dXMnKS52YWwocGFyc2VJbnQob2JqLnMpKTtcclxuICAgICQoJyNmaWx0ZXItbW9kZScpLnZhbChwYXJzZUludChvYmoubSkpO1xyXG4gICAgJCgnI2ZpbHRlci1zZWFyY2gtcXVlcnknKS52YWwob2JqLnEpO1xyXG4gICAgJCgnI2ZpbHRlci1mYy1sZXZlbCcpLnZhbChwYXJzZUludChvYmoubCkpO1xyXG4gICAgJCgnI2ZpbHRlci1sb2NhbC1kYXRhJykudmFsKHBhcnNlSW50KG9iai5kKSk7XHJcbiAgICAkKCcjc2hvdy1mdWxsLXJlc3VsdCcpLnByb3AoJ2NoZWNrZWQnLCAhIXBhcnNlSW50KG9iai5mKSk7XHJcbiAgICBjdXJyZW50U29ydE9yZGVyID0gc2ltcGx5U29ydE9yZGVyKG9iai5vLnNwbGl0KCcuJykubWFwKHggPT4gcGFyc2VJbnQoeCkgfHwgMCkpO1xyXG4gICAgc2V0VGFibGVIZWFkU29ydGluZ01hcmsoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0VGFibGVIZWFkU29ydGluZ01hcmsoKSB7XHJcbiAgICAkKCcuc29ydGVkJykucmVtb3ZlQ2xhc3MoJ3NvcnRlZCBhc2NlbmRpbmcgZGVzY2VuZGluZycpO1xyXG4gICAgY29uc3QgeCA9IGN1cnJlbnRTb3J0T3JkZXIubGVuZ3RoID09PSAwID9cclxuICAgICAgICAtMyA6IC8vIHN0YXJzIGRlc2NcclxuICAgICAgICBjdXJyZW50U29ydE9yZGVyW2N1cnJlbnRTb3J0T3JkZXIubGVuZ3RoIC0gMV07XHJcbiAgICBjb25zdCBpbmRleCA9IE1hdGguYWJzKHgpIC0gMTtcclxuICAgICQoJCgnI3N1bW1hcnktdGFibGUgPiB0aGVhZCA+IHRyID4gdGgnKVtpbmRleF0pXHJcbiAgICAgICAgLmFkZENsYXNzKCdzb3J0ZWQnKS5hZGRDbGFzcyh4ID4gMCA/ICdhc2NlbmRpbmcnIDogJ2Rlc2NlbmRpbmcnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFkKHg6IG51bWJlcikge1xyXG4gICAgcmV0dXJuICh4IDwgMTAgPyAnMCcgOiAnJykgKyB4O1xyXG59XHJcblxyXG5mdW5jdGlvbiBmb3JtYXREYXRlKGRhdGU6IERhdGUpIHtcclxuICAgIHJldHVybiBkYXRlLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSArXHJcbiAgICAgICAgJyAnICsgcGFkKGRhdGUuZ2V0SG91cnMoKSkgK1xyXG4gICAgICAgICc6JyArIHBhZChkYXRlLmdldE1pbnV0ZXMoKSk7XHJcbn1cclxuXHJcbmNvbnN0IHJhbmtBY2hpZXZlZENsYXNzID0gW1xyXG4gICAgJ1NTSCcsICdTSCcsICdTUycsICdTJywgJ0EnLFxyXG4gICAgJ0InLCAnQycsICdEJywgJ0YnLCAnLSdcclxuXTtcclxuXHJcbmxldCBiZWF0bWFwSW5mb01hcFVzZWRWZXJzaW9uID0gTUlOSU1VTV9EQVRFO1xyXG5mdW5jdGlvbiBpbml0VW5zb3J0ZWRUYWJsZVJvd3MoKSB7XHJcbiAgICBpZiAoc3VtbWFyeVJvd3MubGVuZ3RoID09PSAwKVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICBpZiAodW5zb3J0ZWRUYWJsZVJvd3MubGVuZ3RoICE9PSAwICYmIGJlYXRtYXBJbmZvTWFwVXNlZFZlcnNpb24gPT09IGJlYXRtYXBJbmZvTWFwVmVyc2lvbilcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICBiZWF0bWFwSW5mb01hcFVzZWRWZXJzaW9uID0gYmVhdG1hcEluZm9NYXBWZXJzaW9uO1xyXG4gICAgaWYgKGJlYXRtYXBJbmZvTWFwLnNpemUgIT09IDApIHtcclxuICAgICAgICBzdW1tYXJ5Um93cy5mb3JFYWNoKHJvdyA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBiZWF0bWFwSW5mb01hcC5nZXQocm93LmJlYXRtYXBfaWRfbnVtYmVyKTtcclxuICAgICAgICAgICAgaWYgKGluZm8pXHJcbiAgICAgICAgICAgICAgICByb3cuaW5mbyA9IGluZm87XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbW9kZV9pY29ucyA9IFtcclxuICAgICAgICAnZmEgZmEtZXhjaGFuZ2UnLFxyXG4gICAgICAgICcnLFxyXG4gICAgICAgICdmYSBmYS10aW50JyxcclxuICAgICAgICAnJyxcclxuICAgIF07XHJcbiAgICBjb25zdCBhcHByb3ZlZF9zdGF0dXNfaWNvbnMgPSBbXHJcbiAgICAgICAgJ2ZhIGZhLXF1ZXN0aW9uJyxcclxuICAgICAgICAnZmEgZmEtcXVlc3Rpb24nLFxyXG4gICAgICAgICdmYSBmYS1xdWVzdGlvbicsXHJcbiAgICAgICAgJ2ZhIGZhLWFuZ2xlLWRvdWJsZS1yaWdodCcsXHJcbiAgICAgICAgJ2ZhIGZhLWZpcmUnLFxyXG4gICAgICAgICdmYSBmYS1jaGVjaycsXHJcbiAgICAgICAgJ2ZhIGZhLWhlYXJ0LW8nLFxyXG4gICAgXTtcclxuICAgIHVuc29ydGVkVGFibGVSb3dzID0gc3VtbWFyeVJvd3MubWFwKHJvdyA9PlxyXG4gICAgICAgICQoJzx0cj4nKS5hcHBlbmQoW1xyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAkKCc8aT4nKS5hZGRDbGFzcyhhcHByb3ZlZF9zdGF0dXNfaWNvbnNbcm93LmFwcHJvdmVkX3N0YXR1cyArIDJdKSxcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHJvdy5hcHByb3ZlZF9kYXRlLnNwbGl0KCcgJylbMF0pXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICQoJzxpPicpLmFkZENsYXNzKG1vZGVfaWNvbnNbcm93Lm1vZGVdKSxcclxuICAgICAgICAgICAgICAgICQoJzxhPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9vc3UucHB5LnNoL2IvJHtyb3cuYmVhdG1hcF9pZH0/bT0yYClcclxuICAgICAgICAgICAgICAgICAgICAudGV4dChyb3cuZGlzcGxheV9zdHJpbmcpLFxyXG4gICAgICAgICAgICAgICAgcm93LmJlYXRtYXBfaWRfbnVtYmVyID4gMCA/ICQoJzxkaXYgY2xhc3M9XCJmbG9hdC1yaWdodFwiPicpLmFwcGVuZChbXHJcbiAgICAgICAgICAgICAgICAgICAgJCgnPGE+PGkgY2xhc3M9XCJmYSBmYS1waWN0dXJlLW9cIj4nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignaHJlZicsIGBodHRwczovL2IucHB5LnNoL3RodW1iLyR7cm93LmJlYXRtYXBzZXRfaWR9LmpwZ2ApLFxyXG4gICAgICAgICAgICAgICAgICAgICQoJzxhPjxpIGNsYXNzPVwiZmEgZmEtZG93bmxvYWRcIj4nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignaHJlZicsIGBodHRwczovL29zdS5wcHkuc2gvZC8ke3Jvdy5iZWF0bWFwc2V0X2lkfW5gKSxcclxuICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLWNsb3VkLWRvd25sb2FkXCI+JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgb3N1Oi8vZGwvJHtyb3cuYmVhdG1hcHNldF9pZH1gKVxyXG4gICAgICAgICAgICAgICAgXSkgOiAkKClcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgcm93LnN0YXJzLnRvRml4ZWQoMiksXHJcbiAgICAgICAgICAgIHJvdy5wcC50b0ZpeGVkKDApLFxyXG4gICAgICAgICAgICBgJHtNYXRoLmZsb29yKHJvdy5oaXRfbGVuZ3RoIC8gNjApfToke3BhZChNYXRoLmZsb29yKHJvdy5oaXRfbGVuZ3RoICUgNjApKX1gLFxyXG4gICAgICAgICAgICByb3cubWF4X2NvbWJvLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgIHJvdy5hcHByb2FjaF9yYXRlLnRvRml4ZWQoMSksXHJcbiAgICAgICAgICAgIHJvdy5jaXJjbGVfc2l6ZS50b0ZpeGVkKDEpLFxyXG4gICAgICAgICAgICByb3cubWluX21pc3NlcyAhPT0gMCA/IChyb3cubWluX21pc3NlcyA9PT0gMSA/ICcxIG1pc3MnIDogcm93Lm1pbl9taXNzZXMgKyAnIG1pc3NlcycpIDpcclxuICAgICAgICAgICAgW3Jvdy5mY05NLCByb3cuZmNIRCwgcm93LmZjSFIsIHJvdy5mY0hESFIsIHJvdy5mY0RULCByb3cuZmNIRERUXS5qb2luKCcsICcpLFxyXG4gICAgICAgIGJlYXRtYXBJbmZvTWFwLnNpemUgPT09IDAgPyBbXSA6XHJcbiAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICQoJzxpIGNsYXNzPVwiZmFcIj4nKS5hZGRDbGFzcyhyb3cuaW5mbyA/ICdmYS1jaGVjay1zcXVhcmUtbycgOiAnZmEtc3F1YXJlLW8nKSxcclxuICAgICAgICAgICAgICAgICQoJzxzcGFuPicpLmFkZENsYXNzKCdyYW5rLScgKyByYW5rQWNoaWV2ZWRDbGFzc1shcm93LmluZm8gPyA5IDogcm93LmluZm8ucmFua0FjaGlldmVkXSksXHJcbiAgICAgICAgICAgICAgICAkKCc8c3Bhbj4nKS50ZXh0KFxyXG4gICAgICAgICAgICAgICAgICAgICFyb3cuaW5mbyB8fCByb3cuaW5mby5sYXN0UGxheWVkLnZhbHVlT2YoKSA9PT0gTUlOSU1VTV9EQVRFLnZhbHVlT2YoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA/ICctLS0nIDogZm9ybWF0RGF0ZShyb3cuaW5mby5sYXN0UGxheWVkKVxyXG4gICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIF0ubWFwKHggPT4gJCgnPHRkPicpLmFwcGVuZCh4KSkpWzBdIGFzIEhUTUxUYWJsZVJvd0VsZW1lbnQpO1xyXG5cclxuICAgIHVuc29ydGVkVGFibGVSb3dzQ2hhbmdlZCA9IHRydWU7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2hvd0Vycm9yTWVzc2FnZSh0ZXh0OiBzdHJpbmcpIHtcclxuICAgICQoJyNhbGVydHMnKS5hcHBlbmQoXHJcbiAgICAgICAgJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LXdhcm5pbmcgYWxlcnQtZGlzbWlzc2FibGVcIj4nKVxyXG4gICAgICAgICAgICAudGV4dCh0ZXh0KVxyXG4gICAgICAgICAgICAuYXBwZW5kKCc8YSBjbGFzcz1cImNsb3NlXCIgZGF0YS1kaXNtaXNzPVwiYWxlcnRcIj48c3Bhbj4mdGltZXM7JykpO1xyXG59XHJcblxyXG5jb25zdCBMT0NBTFNUT1JBR0VfUFJFRklYID0gJ2xpc3QtbWFwcy8nO1xyXG50eXBlIExvY2FsRmlsZU5hbWUgPSAnb3N1IS5kYicgfCAnc2NvcmVzLmRiJztcclxuaW50ZXJmYWNlIExvY2FsRmlsZSB7XHJcbiAgICBkYXRhOiBVaW50OEFycmF5O1xyXG4gICAgdXBsb2FkZWREYXRlOiBEYXRlO1xyXG59XHJcbmNvbnN0IGxvY2FsRmlsZXM6IHtcclxuICAgIFsnb3N1IS5kYiddPzogTG9jYWxGaWxlLFxyXG4gICAgWydzY29yZXMuZGInXT86IExvY2FsRmlsZTtcclxufSA9IHt9O1xyXG5cclxuLypcclxuZnVuY3Rpb24gZGF0YVVSSXRvVUludDhBcnJheShkYXRhVVJJOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IGJhc2U2NCA9IGRhdGFVUkkuc3BsaXQoJywnKVsxXTtcclxuICAgIGNvbnN0IHN0ciA9IGF0b2IoYmFzZTY0KTtcclxuICAgIGNvbnN0IGxlbiA9IHN0ci5sZW5ndGg7XHJcbiAgICBjb25zdCBhcnJheSA9IG5ldyBVaW50OEFycmF5KGxlbik7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgKysgaSkge1xyXG4gICAgICAgIGFycmF5W2ldID0gc3RyLmNoYXJDb2RlQXQoaSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXJyYXk7XHJcbn1cclxuKi9cclxuXHJcbmNvbnN0IHJlZ2lzdGVyZWRDYWxsYmFja01hcCA9IG5ldyBNYXA8bnVtYmVyLCAoZGF0YTogYW55KSA9PiBhbnk+KCk7XHJcbmZ1bmN0aW9uIHJlZ2lzdGVyQ2FsbGJhY2soY2FsbGJhY2s6IChkYXRhOiBhbnkpID0+IGFueSk6IG51bWJlciB7XHJcbiAgICBsZXQgaWQ7XHJcbiAgICBkb1xyXG4gICAgICAgIGlkID0gTWF0aC5yYW5kb20oKTtcclxuICAgIHdoaWxlIChyZWdpc3RlcmVkQ2FsbGJhY2tNYXAuaGFzKGlkKSk7XHJcbiAgICByZWdpc3RlcmVkQ2FsbGJhY2tNYXAuc2V0KGlkLCBjYWxsYmFjayk7XHJcbiAgICByZXR1cm4gaWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5ld1dvcmtlcigpOiBXb3JrZXIge1xyXG4gICAgcmV0dXJuIG5ldyBXb3JrZXIoJ2Rpc3QvbGlzdC1tYXBzLXdvcmtlci5qcycpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBydW5Xb3JrZXIobWVzc2FnZTogb2JqZWN0LCB1c2luZz86IFdvcmtlcik6IFByb21pc2U8YW55PiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2U8YW55PihyZXNvbHZlID0+IHtcclxuICAgICAgICBjb25zdCB3b3JrZXIgPSB1c2luZyB8fCBuZXdXb3JrZXIoKTtcclxuICAgICAgICAobWVzc2FnZSBhcyBhbnkpLmlkID0gcmVnaXN0ZXJDYWxsYmFjayhyZXNvbHZlKTtcclxuICAgICAgICB3b3JrZXIucG9zdE1lc3NhZ2UobWVzc2FnZSk7XHJcbiAgICAgICAgd29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQ6IE1lc3NhZ2VFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gZXZlbnQuZGF0YTtcclxuICAgICAgICAgICAgaWYgKGRhdGEudHlwZSA9PT0gJ2NhbGxiYWNrJyAmJiB0eXBlb2YoZGF0YS5pZCkgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHJlZ2lzdGVyZWRDYWxsYmFja01hcC5nZXQoZGF0YS5pZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICByZWdpc3RlcmVkQ2FsbGJhY2tNYXAuZGVsZXRlKGRhdGEuaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZmFsc2UpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21wcmVzc0J1ZmZlclRvU3RyaW5nKGJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgY29uc3QgY29tcHJlc3NlZCA9IChhd2FpdCBydW5Xb3JrZXIoe1xyXG4gICAgICAgIHR5cGU6ICdjb21wcmVzcycsXHJcbiAgICAgICAgZGF0YTogbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKVxyXG4gICAgfSkpLmRhdGEgYXMgVWludDhBcnJheTtcclxuICAgIGNvbnN0IGNoYXJzID0gbmV3IEFycmF5KE1hdGguZmxvb3IoY29tcHJlc3NlZC5sZW5ndGggLyAyKSk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoYXJzLmxlbmd0aDsgaSArPSAxKSB7XHJcbiAgICAgICAgY29uc3QgY29kZSA9IChjb21wcmVzc2VkW2kgKiAyICsgMF0gJiAweGZmKSA8PCA4IHwgKGNvbXByZXNzZWRbaSAqIDIgKyAxXSAmIDB4ZmYpO1xyXG4gICAgICAgIGNoYXJzW2ldID0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcclxuICAgIH1cclxuICAgIGxldCByZXMgPSBjb21wcmVzc2VkLmxlbmd0aCAlIDIgPyAnMScgOiAnMCc7XHJcbiAgICByZXMgKz0gY2hhcnMuam9pbignJyk7XHJcbiAgICBpZiAoY29tcHJlc3NlZC5sZW5ndGggJSAyICE9PSAwKVxyXG4gICAgICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjb21wcmVzc2VkW2NvbXByZXNzZWQubGVuZ3RoIC0gMV0gJiAweGZmKSA8PCA4KTtcclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWNvbXByZXNzQnVmZmVyRnJvbVN0cmluZyhzdHI6IHN0cmluZyk6IFByb21pc2U8VWludDhBcnJheT4ge1xyXG4gICAgY29uc3QgcGFyaXR5ID0gc3RyWzBdID09PSAnMScgPyAxIDogMDtcclxuICAgIGNvbnN0IGxlbiA9IHN0ci5sZW5ndGggLSAxIC0gcGFyaXR5O1xyXG4gICAgY29uc3QgYXJyYXkgPSBuZXcgVWludDhBcnJheShsZW4gKiAyICsgcGFyaXR5KTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcclxuICAgICAgICBjb25zdCBjb2RlID0gc3RyLmNoYXJDb2RlQXQoaSArIDEpO1xyXG4gICAgICAgIGFycmF5W2kgKiAyICsgMF0gPSBjb2RlID4+IDg7XHJcbiAgICAgICAgYXJyYXlbaSAqIDIgKyAxXSA9IGNvZGUgJiAweGZmO1xyXG4gICAgfVxyXG4gICAgaWYgKHBhcml0eSAhPT0gMClcclxuICAgICAgICBhcnJheVtsZW4gKiAyXSA9IHN0ci5jaGFyQ29kZUF0KGxlbiArIDEpID4+IDg7XHJcbiAgICBjb25zdCBkZWNvbXByZXNzZWQgPSAoYXdhaXQgcnVuV29ya2VyKHtcclxuICAgICAgICB0eXBlOiAnZGVjb21wcmVzcycsXHJcbiAgICAgICAgZGF0YTogYXJyYXlcclxuICAgIH0pKS5kYXRhIGFzIFVpbnQ4QXJyYXk7XHJcbiAgICByZXR1cm4gZGVjb21wcmVzc2VkO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWxvYWRMb2NhbEZpbGUobmFtZTogTG9jYWxGaWxlTmFtZSkge1xyXG4gICAgY29uc3QgZiA9IGxvY2FsRmlsZXNbbmFtZV07XHJcbiAgICBpZiAobmFtZSA9PT0gJ29zdSEuZGInKVxyXG4gICAgICAgICQoJyNmaWx0ZXItbG9jYWwtZGF0YScpLnByb3AoJ2Rpc2FibGVkJywgZiA9PT0gdW5kZWZpbmVkKTtcclxuICAgICQobmFtZSA9PT0gJ29zdSEuZGInID8gJyNjdXJyZW50LW9zdWRiLWZpbGUnIDogJyNjdXJyZW50LXNjb3Jlc2RiLWZpbGUnKVxyXG4gICAgICAgIC50ZXh0KCFmID8gJ05vIGRhdGEnIDogZm9ybWF0RGF0ZShmLnVwbG9hZGVkRGF0ZSkpO1xyXG4gICAgaWYgKCFmKSByZXR1cm47XHJcbiAgICBpZiAobmFtZSA9PT0gJ29zdSEuZGInKSB7XHJcbiAgICAgICAgbG9hZE9zdURCKGYuZGF0YS5idWZmZXIsIGYudXBsb2FkZWREYXRlKTtcclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBsb2FkRnJvbUxvY2FsU3RvcmFnZShuYW1lOiBMb2NhbEZpbGVOYW1lKSB7XHJcbiAgICBjb25zdCBkYXRlU3RyID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oTE9DQUxTVE9SQUdFX1BSRUZJWCArIG5hbWUgKyAnL3VwbG9hZGVkLWRhdGUnKTtcclxuICAgIGlmICghZGF0ZVN0cikgcmV0dXJuO1xyXG4gICAgY29uc3QgZW5jb2RlZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKExPQ0FMU1RPUkFHRV9QUkVGSVggKyBuYW1lICsgJy9kYXRhJykhO1xyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGRlY29tcHJlc3NCdWZmZXJGcm9tU3RyaW5nKGVuY29kZWQpO1xyXG4gICAgY29uc29sZS5sb2coJ2ZpbGUgJyArIG5hbWUgKyAnIGxvYWRlZCBmcm9tIGxvY2FsU3RvcmFnZScpO1xyXG4gICAgbG9jYWxGaWxlc1tuYW1lXSA9IHtcclxuICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgIHVwbG9hZGVkRGF0ZTogbmV3IERhdGUoZGF0ZVN0cilcclxuICAgIH07XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHNldExvY2FsRmlsZShuYW1lOiBMb2NhbEZpbGVOYW1lLCBmaWxlOiBGaWxlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4ocmVzb2x2ZSA9PiB7XHJcbiAgICAgICAgY29uc3QgZnIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgIGZyLm9ubG9hZCA9IChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZmlsZSAnICsgbmFtZSArICcgbG9hZGVkJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IGZyLnJlc3VsdCBhcyBBcnJheUJ1ZmZlcjtcclxuICAgICAgICAgICAgY29uc3QgdXBsb2FkZWREYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgICAgbG9jYWxGaWxlc1tuYW1lXSA9IHtcclxuICAgICAgICAgICAgICAgIGRhdGE6IG5ldyBVaW50OEFycmF5KGJ1ZmZlciksXHJcbiAgICAgICAgICAgICAgICB1cGxvYWRlZERhdGU6IHVwbG9hZGVkRGF0ZSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmVsb2FkTG9jYWxGaWxlKG5hbWUpO1xyXG4gICAgICAgICAgICBjb21wcmVzc0J1ZmZlclRvU3RyaW5nKGJ1ZmZlcikudGhlbihkYXRhU3RyID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmaWxlICcgKyBuYW1lICsgJyBjb21wcmVzc2VkJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50ID0gbG9jYWxGaWxlc1tuYW1lXTtcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50ICYmIGN1cnJlbnQudXBsb2FkZWREYXRlLnZhbHVlT2YoKSAhPT0gdXBsb2FkZWREYXRlLnZhbHVlT2YoKSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShMT0NBTFNUT1JBR0VfUFJFRklYICsgbmFtZSArICcvZGF0YScsIGRhdGFTdHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKExPQ0FMU1RPUkFHRV9QUkVGSVggKyBuYW1lICsgJy91cGxvYWRlZC1kYXRlJywgdXBsb2FkZWREYXRlLnRvSVNPU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmaWxlICcgKyBuYW1lICsgJyBzYXZlZCB0byBsb2NhbFN0b3JhZ2UnKTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdsb2NhbFN0b3JhZ2UgZXJyb3I6ICcsIGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGZyLnJlYWRBc0FycmF5QnVmZmVyKGZpbGUpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmNsYXNzIFNlcmlhbGl6YXRpb25SZWFkZXIge1xyXG4gICAgcHJpdmF0ZSBkdjogRGF0YVZpZXc7XHJcbiAgICBwcml2YXRlIG9mZnNldDogbnVtYmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGJ1ZmZlcjogQXJyYXlCdWZmZXIpIHtcclxuICAgICAgICB0aGlzLmR2ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XHJcbiAgICAgICAgdGhpcy5vZmZzZXQgPSAwO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBza2lwKGJ5dGVzOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLm9mZnNldCArPSBieXRlcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZEludDgoKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5kdi5nZXRJbnQ4KHRoaXMub2Zmc2V0KTtcclxuICAgICAgICB0aGlzLm9mZnNldCArPSAxO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRJbnQxNigpIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmR2LmdldEludDE2KHRoaXMub2Zmc2V0LCB0cnVlKTtcclxuICAgICAgICB0aGlzLm9mZnNldCArPSAyO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRJbnQzMigpIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmR2LmdldEludDMyKHRoaXMub2Zmc2V0LCB0cnVlKTtcclxuICAgICAgICB0aGlzLm9mZnNldCArPSA0O1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRCeXRlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRJbnQ4KCkgfCAwO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkVUludDE2KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRJbnQxNigpIHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZFVJbnQzMigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWFkSW50MzIoKSB8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRCb29sZWFuKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRJbnQ4KCkgIT09IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZWFkVUxFQjEyOCgpIHtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gMDtcclxuICAgICAgICBmb3IgKGxldCBzaGlmdCA9IDA7IDsgc2hpZnQgKz0gNykge1xyXG4gICAgICAgICAgICBjb25zdCBieXRlID0gdGhpcy5kdi5nZXRVaW50OCh0aGlzLm9mZnNldCk7XHJcbiAgICAgICAgICAgIHRoaXMub2Zmc2V0ICs9IDE7XHJcbiAgICAgICAgICAgIHJlc3VsdCB8PSAoYnl0ZSAmIDB4N2YpIDw8IHNoaWZ0O1xyXG4gICAgICAgICAgICBpZiAoKGJ5dGUgJiAweDgwKSA9PT0gMClcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkVWludDhBcnJheShsZW5ndGg6IG51bWJlcikge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KHRoaXMuZHYuYnVmZmVyLCB0aGlzLm9mZnNldCwgbGVuZ3RoKTtcclxuICAgICAgICB0aGlzLm9mZnNldCArPSBsZW5ndGg7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZFN0cmluZygpIHtcclxuICAgICAgICBjb25zdCBoZWFkZXIgPSB0aGlzLnJlYWRJbnQ4KCk7XHJcbiAgICAgICAgaWYgKGhlYWRlciA9PT0gMClcclxuICAgICAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMucmVhZFVMRUIxMjgoKTtcclxuICAgICAgICBjb25zdCBhcnJheSA9IHRoaXMucmVhZFVpbnQ4QXJyYXkobGVuZ3RoKTtcclxuICAgICAgICByZXR1cm4gbmV3IFRleHREZWNvZGVyKCd1dGYtOCcpLmRlY29kZShhcnJheSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRJbnQ2NFJvdW5kZWQoKSB7XHJcbiAgICAgICAgY29uc3QgbG8gPSB0aGlzLmR2LmdldFVpbnQzMih0aGlzLm9mZnNldCwgdHJ1ZSk7XHJcbiAgICAgICAgY29uc3QgaGkgPSB0aGlzLmR2LmdldFVpbnQzMih0aGlzLm9mZnNldCArIDQsIHRydWUpO1xyXG4gICAgICAgIHRoaXMub2Zmc2V0ICs9IDg7XHJcbiAgICAgICAgcmV0dXJuIGhpICogMHgxMDAwMDAwMDAgKyBsbztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZERhdGVUaW1lKCkge1xyXG4gICAgICAgIC8vIE9GRlNFVCA9IDYyMTM1NTk2ODAwMDAwMDAwMCA9IHRpY2tzIGZyb20gMDAwMS8xLzEgdG8gMTk3MC8xLzFcclxuICAgICAgICBsZXQgbG8gPSB0aGlzLnJlYWRVSW50MzIoKTtcclxuICAgICAgICBsZXQgaGkgPSB0aGlzLnJlYWRVSW50MzIoKTtcclxuICAgICAgICBsbyAtPSAzNDQ0MjkzNjMyOyAvLyBsbyBiaXRzIG9mIE9GRlNFVFxyXG4gICAgICAgIGlmIChsbyA8IDApIHtcclxuICAgICAgICAgICAgbG8gKz0gNDI5NDk2NzI5NjsgICAvLyAyXjMyXHJcbiAgICAgICAgICAgIGhpIC09IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGhpIC09IDE0NDY3MDUwODsgIC8vIGhpIGJpdHMgb2YgT0ZGU0VUXHJcbiAgICAgICAgY29uc3QgdGlja3MgPSBoaSAqIDQyOTQ5NjcyOTYgKyBsbztcclxuICAgICAgICByZXR1cm4gbmV3IERhdGUodGlja3MgKiAxZS00KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZFNpbmdsZSgpIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmR2LmdldEZsb2F0MzIodGhpcy5vZmZzZXQsIHRydWUpO1xyXG4gICAgICAgIHRoaXMub2Zmc2V0ICs9IDQ7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZERvdWJsZSgpIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmR2LmdldEZsb2F0NjQodGhpcy5vZmZzZXQsIHRydWUpO1xyXG4gICAgICAgIHRoaXMub2Zmc2V0ICs9IDg7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZExpc3QoY2FsbGJhY2s6IChpbmRleDogbnVtYmVyKSA9PiBhbnkpIHtcclxuICAgICAgICBjb25zdCBjb3VudCA9IHRoaXMucmVhZEludDMyKCk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSArPSAxKVxyXG4gICAgICAgICAgICBjYWxsYmFjayhpKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgQmVhdG1hcEluZm8ge1xyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIHB1YmxpYyByZWFkb25seSBiZWF0bWFwSWQ6IG51bWJlcixcclxuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgbGFzdFBsYXllZDogRGF0ZSxcclxuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgcmFua0FjaGlldmVkOiBudW1iZXIpIHt9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlYWRCZWF0bWFwKHNyOiBTZXJpYWxpemF0aW9uUmVhZGVyKSB7XHJcbiAgICBjb25zdCBTaXplSW5CeXRlcyA9IHNyLnJlYWRJbnQzMigpO1xyXG5cclxuICAgIGNvbnN0IEFydGlzdCA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IEFydGlzdFVuaWNvZGUgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBUaXRsZSA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IFRpdGxlVW5pY29kZSA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IENyZWF0b3IgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBWZXJzaW9uID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgQXVkaW9GaWxlbmFtZSA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IEJlYXRtYXBDaGVja3N1bSA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IEZpbGVuYW1lID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgU3VibWlzc2lvblN0YXR1cyA9IHNyLnJlYWRCeXRlKCk7XHJcbiAgICBjb25zdCBjb3VudE5vcm1hbCA9IHNyLnJlYWRVSW50MTYoKTtcclxuICAgIGNvbnN0IGNvdW50U2xpZGVyID0gc3IucmVhZFVJbnQxNigpO1xyXG4gICAgY29uc3QgY291bnRTcGlubmVyID0gc3IucmVhZFVJbnQxNigpO1xyXG4gICAgY29uc3QgRGF0ZU1vZGlmaWVkID0gc3IucmVhZERhdGVUaW1lKCk7XHJcblxyXG4gICAgY29uc3QgRGlmZmljdWx0eUFwcHJvYWNoUmF0ZSA9IHNyLnJlYWRTaW5nbGUoKTtcclxuICAgIGNvbnN0IERpZmZpY3VsdHlDaXJjbGVTaXplID0gc3IucmVhZFNpbmdsZSgpO1xyXG4gICAgY29uc3QgRGlmZmljdWx0eUhwRHJhaW5SYXRlID0gc3IucmVhZFNpbmdsZSgpO1xyXG4gICAgY29uc3QgRGlmZmljdWx0eU92ZXJhbGwgPSBzci5yZWFkU2luZ2xlKCk7XHJcblxyXG4gICAgY29uc3QgRGlmZmljdWx0eVNsaWRlck11bHRpcGxpZXIgPSBzci5yZWFkRG91YmxlKCk7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpICs9IDEpIHtcclxuICAgICAgICBzci5yZWFkTGlzdCgoKSA9PiB7XHJcbiAgICAgICAgICAgIHNyLnJlYWRJbnQzMigpO1xyXG4gICAgICAgICAgICBzci5yZWFkSW50MTYoKTtcclxuICAgICAgICAgICAgc3IucmVhZERvdWJsZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IERyYWluTGVuZ3RoID0gc3IucmVhZEludDMyKCk7XHJcbiAgICBjb25zdCBUb3RhbExlbmd0aCA9IHNyLnJlYWRJbnQzMigpO1xyXG4gICAgY29uc3QgUHJldmlld1RpbWUgPSBzci5yZWFkSW50MzIoKTtcclxuICAgIHNyLnJlYWRMaXN0KCgpID0+IHtcclxuICAgICAgICBjb25zdCBCZWF0TGVuZ3RoID0gc3IucmVhZERvdWJsZSgpO1xyXG4gICAgICAgIGNvbnN0IE9mZnNldCA9IHNyLnJlYWREb3VibGUoKTtcclxuICAgICAgICBjb25zdCBUaW1pbmdDaGFuZ2UgPSBzci5yZWFkQm9vbGVhbigpO1xyXG4gICAgfSk7XHJcbiAgICBjb25zdCBCZWF0bWFwSWQgPSBzci5yZWFkSW50MzIoKTtcclxuICAgIGNvbnN0IEJlYXRtYXBTZXRJZCA9IHNyLnJlYWRJbnQzMigpO1xyXG4gICAgY29uc3QgQmVhdG1hcFRvcGljSWQgPSBzci5yZWFkSW50MzIoKTtcclxuICAgIGNvbnN0IFBsYXllclJhbmtPc3UgPSBzci5yZWFkQnl0ZSgpO1xyXG4gICAgY29uc3QgUGxheWVyUmFua0ZydWl0cyA9IHNyLnJlYWRCeXRlKCk7XHJcbiAgICBjb25zdCBQbGF5ZXJSYW5rVGFpa28gPSBzci5yZWFkQnl0ZSgpO1xyXG4gICAgY29uc3QgUGxheWVyUmFua01hbmlhID0gc3IucmVhZEJ5dGUoKTtcclxuICAgIGNvbnN0IFBsYXllck9mZnNldCA9IHNyLnJlYWRJbnQxNigpO1xyXG4gICAgY29uc3QgU3RhY2tMZW5pZW5jeSA9IHNyLnJlYWRTaW5nbGUoKTtcclxuICAgIGNvbnN0IFBsYXlNb2RlID0gc3IucmVhZEJ5dGUoKTtcclxuICAgIGNvbnN0IFNvdXJjZSA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IFRhZ3MgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBPbmxpbmVPZmZzZXQgPSBzci5yZWFkSW50MTYoKTtcclxuICAgIGNvbnN0IE9ubGluZURpc3BsYXlUaXRsZSA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IE5ld0ZpbGUgPSBzci5yZWFkQm9vbGVhbigpO1xyXG4gICAgY29uc3QgRGF0ZUxhc3RQbGF5ZWQgPSBzci5yZWFkRGF0ZVRpbWUoKTtcclxuICAgIGNvbnN0IEluT3N6Q29udGFpbmVyID0gc3IucmVhZEJvb2xlYW4oKTtcclxuICAgIGNvbnN0IENvbnRhaW5pbmdGb2xkZXJBYnNvbHV0ZSA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IExhc3RJbmZvVXBkYXRlID0gc3IucmVhZERhdGVUaW1lKCk7XHJcbiAgICBjb25zdCBEaXNhYmxlU2FtcGxlcyA9IHNyLnJlYWRCb29sZWFuKCk7XHJcbiAgICBjb25zdCBEaXNhYmxlU2tpbiA9IHNyLnJlYWRCb29sZWFuKCk7XHJcbiAgICBjb25zdCBEaXNhYmxlU3Rvcnlib2FyZCA9IHNyLnJlYWRCb29sZWFuKCk7XHJcbiAgICBjb25zdCBEaXNhYmxlVmlkZW8gPSBzci5yZWFkQm9vbGVhbigpO1xyXG4gICAgY29uc3QgVmlzdWFsU2V0dGluZ3NPdmVycmlkZSA9IHNyLnJlYWRCb29sZWFuKCk7XHJcblxyXG4gICAgY29uc3QgTGFzdEVkaXRUaW1lID0gc3IucmVhZEludDMyKCk7XHJcbiAgICBjb25zdCBNYW5pYVNwZWVkID0gc3IucmVhZEJ5dGUoKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IEJlYXRtYXBJbmZvKFxyXG4gICAgICAgIEJlYXRtYXBJZCxcclxuICAgICAgICBuZXcgRGF0ZShNYXRoLm1heChNSU5JTVVNX0RBVEUudmFsdWVPZigpLCBEYXRlTGFzdFBsYXllZC52YWx1ZU9mKCkpKSxcclxuICAgICAgICBQbGF5ZXJSYW5rRnJ1aXRzKTtcclxufVxyXG5cclxuY29uc3QgYmVhdG1hcEluZm9NYXAgPSBuZXcgTWFwPG51bWJlciwgQmVhdG1hcEluZm8+KCk7XHJcbmxldCBiZWF0bWFwSW5mb01hcFZlcnNpb24gPSBNSU5JTVVNX0RBVEU7XHJcblxyXG5mdW5jdGlvbiBsb2FkT3N1REIoYnVmZmVyOiBBcnJheUJ1ZmZlciwgdmVyc2lvbjogRGF0ZSkge1xyXG4gICAgYmVhdG1hcEluZm9NYXAuY2xlYXIoKTtcclxuICAgIGNvbnN0IHNyID0gbmV3IFNlcmlhbGl6YXRpb25SZWFkZXIoYnVmZmVyKTtcclxuICAgIHNyLnNraXAoNCArIDQgKyAxICsgOCk7XHJcbiAgICBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBiZWF0bWFwQ291bnQgPSBzci5yZWFkSW50MzIoKTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJlYXRtYXBDb3VudDsgaSArPSAxKSB7XHJcbiAgICAgICAgY29uc3QgYmVhdG1hcCA9IHJlYWRCZWF0bWFwKHNyKTtcclxuICAgICAgICBpZiAoYmVhdG1hcC5iZWF0bWFwSWQgPiAwKVxyXG4gICAgICAgICAgICBiZWF0bWFwSW5mb01hcC5zZXQoYmVhdG1hcC5iZWF0bWFwSWQsIGJlYXRtYXApO1xyXG4gICAgfVxyXG5cclxuICAgIGJlYXRtYXBJbmZvTWFwVmVyc2lvbiA9IHZlcnNpb247XHJcbn1cclxuXHJcbiQoKCkgPT4ge1xyXG4gICAgUHJvbWlzZS5hbGwoXHJcbiAgICAgICAgKFsnb3N1IS5kYicsICdzY29yZXMuZGInXSBhcyBMb2NhbEZpbGVOYW1lW10pXHJcbiAgICAgICAgICAgIC5tYXAobmFtZSA9PlxyXG4gICAgICAgICAgICAgICAgbG9hZEZyb21Mb2NhbFN0b3JhZ2UobmFtZSlcclxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiByZWxvYWRMb2NhbEZpbGUobmFtZSkpKSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgaWYgKGluaXRVbnNvcnRlZFRhYmxlUm93cygpKVxyXG4gICAgICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzZXRRdWVyeUFjY29yZGluZ1RvSGFzaCgpO1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCAoKSA9PiB7XHJcbiAgICAgICAgc2V0UXVlcnlBY2NvcmRpbmdUb0hhc2goKTtcclxuICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XHJcbiAgICB9KTtcclxuICAgIGNvbnN0IG9uQ2hhbmdlID0gKCkgPT4ge1xyXG4gICAgICAgIGRyYXdUYWJsZUZvckN1cnJlbnRGaWx0ZXJpbmcoKTtcclxuICAgIH07XHJcbiAgICBmb3IgKGNvbnN0IGlkIG9mIFsnZmlsdGVyLWFwcHJvdmVkLXN0YXR1cycsICdmaWx0ZXItbW9kZScsICdmaWx0ZXItZmMtbGV2ZWwnLCAnZmlsdGVyLWxvY2FsLWRhdGEnLCAnc2hvdy1mdWxsLXJlc3VsdCddKVxyXG4gICAgICAgICQoYCMke2lkfWApLm9uKCdjaGFuZ2UnLCBvbkNoYW5nZSk7XHJcbiAgICBmb3IgKGNvbnN0IGlkIG9mIFsnZmlsdGVyLXNlYXJjaC1xdWVyeSddKVxyXG4gICAgICAgICQoYCMke2lkfWApLm9uKCdpbnB1dCcsIG9uQ2hhbmdlKTtcclxuXHJcbiAgICBjb25zdCB0aExpc3QgPSAkKCcjc3VtbWFyeS10YWJsZSA+IHRoZWFkID4gdHIgPiB0aCcpO1xyXG4gICAgc29ydEtleXMuZm9yRWFjaCgoXywgaW5kZXgpID0+IHtcclxuICAgICAgICAkLmRhdGEodGhMaXN0W2luZGV4XSwgJ3RoSW5kZXgnLCBpbmRleCk7XHJcbiAgICB9KTtcclxuICAgIGNvbnN0IGxvYWREYXRhID0gKGRhdGE6IFN1bW1hcnlSb3dEYXRhW10sIGxhc3RNb2RpZmllZDogRGF0ZSkgPT4ge1xyXG4gICAgICAgICQoJyNsYXN0LXVwZGF0ZS10aW1lJylcclxuICAgICAgICAgICAgLmFwcGVuZCgkKCc8dGltZT4nKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2RhdGV0aW1lJywgbGFzdE1vZGlmaWVkLnRvSVNPU3RyaW5nKCkpXHJcbiAgICAgICAgICAgICAgICAudGV4dChsYXN0TW9kaWZpZWQudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdKSk7XHJcbiAgICAgICAgc3VtbWFyeVJvd3MgPSBkYXRhLm1hcCh4ID0+IG5ldyBTdW1tYXJ5Um93KHgpKTtcclxuICAgICAgICBpbml0VW5zb3J0ZWRUYWJsZVJvd3MoKTtcclxuICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XHJcbiAgICAgICAgJCgnI3N1bW1hcnktdGFibGUtbG9hZGVyJykuaGlkZSgpO1xyXG4gICAgfTtcclxuICAgICQuZ2V0SlNPTignZGF0YS9zdW1tYXJ5Lmpzb24nKS50aGVuKChkYXRhLCBfLCB4aHIpID0+IHtcclxuICAgICAgICBsb2FkRGF0YShkYXRhLCBuZXcgRGF0ZSh4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnKSBhcyBzdHJpbmcpKTtcclxuICAgIH0pO1xyXG4gICAgdGhMaXN0LmNsaWNrKChldmVudCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHRoID0gJChldmVudC50YXJnZXQpO1xyXG4gICAgICAgIGxldCBzaWduO1xyXG4gICAgICAgIGlmICh0aC5oYXNDbGFzcygnc29ydGVkJykpXHJcbiAgICAgICAgICAgIHNpZ24gPSB0aC5oYXNDbGFzcygnZGVzY2VuZGluZycpID8gMSA6IC0xO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc2lnbiA9IHRoLmhhc0NsYXNzKCdkZXNjLWZpcnN0JykgPyAtMSA6IDE7XHJcbiAgICAgICAgY29uc3QgdGhJbmRleCA9IHRoLmRhdGEoJ3RoSW5kZXgnKSBhcyBudW1iZXI7XHJcbiAgICAgICAgY3VycmVudFNvcnRPcmRlci5wdXNoKCh0aEluZGV4ICsgMSkgKiBzaWduKTtcclxuICAgICAgICBjdXJyZW50U29ydE9yZGVyID0gc2ltcGx5U29ydE9yZGVyKGN1cnJlbnRTb3J0T3JkZXIpO1xyXG4gICAgICAgIHNldFRhYmxlSGVhZFNvcnRpbmdNYXJrKCk7XHJcbiAgICAgICAgZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpO1xyXG4gICAgfSk7XHJcbiAgICAkKCcjZGItZmlsZS1pbnB1dCcpLmNoYW5nZShhc3luYyBldmVudCA9PiB7XHJcbiAgICAgICAgY29uc3QgZWxlbSA9IGV2ZW50LnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50O1xyXG4gICAgICAgIGlmICghZWxlbS5maWxlcykgcmV0dXJuO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbS5maWxlcy5sZW5ndGg7IGkgKz0gMSkge1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlID0gZWxlbS5maWxlc1tpXTtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGZpbGUubmFtZTtcclxuICAgICAgICAgICAgaWYgKG5hbWUuaW5kZXhPZignb3N1IS5kYicpICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgc2V0TG9jYWxGaWxlKCdvc3UhLmRiJywgZmlsZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmFtZS5pbmRleE9mKCdzY29yZXMuZGInKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHNldExvY2FsRmlsZSgnc2NvcmVzLmRiJywgZmlsZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzaG93RXJyb3JNZXNzYWdlKGBJbnZhbGlkIGZpbGUgJHtuYW1lfTogUGxlYXNlIHNlbGVjdCBvc3UhLmRiIG9yIHNjb3Jlcy5kYmApO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGluaXRVbnNvcnRlZFRhYmxlUm93cygpKVxyXG4gICAgICAgICAgICAgICAgZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbGVtLnZhbHVlID0gJyc7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG59XHJcbiJdfQ==