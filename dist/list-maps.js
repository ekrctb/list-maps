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
                'status': '"upraql"[row.approved_status+1]',
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
            'fa fa-angle-double-right',
            'fa fa-fire',
            'fa fa-check',
            'fa fa-heart-o',
        ];
        unsortedTableRows = summaryRows.map(function (row) {
            return $('<tr>').append([
                [
                    $('<i>').addClass(approved_status_icons[row.approved_status]),
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
                    ]) : []
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1tYXBzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpc3QtbWFwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFVLFFBQVEsQ0FzMUJqQjtBQXQxQkQsV0FBVSxRQUFROztJQWVsQixJQUFNLFlBQVksR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqQztRQXVCSSxvQkFBNkIsSUFBb0I7WUFBcEIsU0FBSSxHQUFKLElBQUksQ0FBZ0I7WUFFekMsOEJBQW9CLEVBQ3BCLDRCQUFrQixFQUNsQixtQkFBUyxFQUNULHlCQUFlLEVBQ2YsNEJBQWtCLEVBQ2xCLDZCQUFtQixFQUNuQixvQkFBVSxFQUNWLGlCQUFPLEVBQ1AseUJBQWUsRUFDZix3QkFBYyxFQUNkLDZCQUFrQixFQUNsQiwyQkFBZ0IsRUFDaEIsMEJBQWUsRUFDZixvQkFBUyxFQUNULG9CQUFTLEVBQ1Qsb0JBQVMsRUFDVCxzQkFBVyxFQUNYLG9CQUFTLEVBQ1Qsc0JBQVcsQ0FDTjtZQUNULElBQUksQ0FBQyxpQkFBaUIsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzlELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLENBQUM7UUFDTCxpQkFBQztJQUFELENBQUMsQUFqREQsSUFpREM7SUFFRCxJQUFJLFdBQVcsR0FBaUIsRUFBRSxDQUFDO0lBQ25DLElBQUksaUJBQWlCLEdBQTBCLEVBQUUsQ0FBQztJQUNsRCxJQUFJLGdCQUFnQixHQUFhLEVBQUUsQ0FBQztJQUNwQyxJQUFJLGVBQWUsR0FBRyxHQUFHLENBQUM7SUFFMUIsSUFBSSxlQUFlLEdBQUcsRUFBRSxDQUFDO0lBQ3pCLElBQUksd0JBQXdCLEdB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LENBQUEsTUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQSxFQUE5Qix3QkFBOEI7d0JBQzlCLHFCQUFNLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEVBQUE7O3dCQUFuQyxTQUFtQyxDQUFDOzs7NkJBQzdCLENBQUEsTUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQSxFQUFoQyx3QkFBZ0M7d0JBQ3ZDLHFCQUFNLFlBQVksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLEVBQUE7O3dCQUFyQyxTQUFxQyxDQUFDOzs7d0JBRXRDLGdCQUFnQixDQUFDLGtCQUFnQixNQUFJLHlDQUFzQyxDQUFDLENBQUM7d0JBQzdFLHdCQUFTOzt3QkFFYixFQUFFLENBQUMsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDOzRCQUN4Qiw0QkFBNEIsRUFBRSxDQUFDOzs7d0JBWkEsQ0FBQyxJQUFJLENBQUMsQ0FBQTs7O3dCQWM3QyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQzs7OzthQUNuQixDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztBQUVILENBQUMsRUF0MUJTLFFBQVEsS0FBUixRQUFRLFFBczFCakIiLCJzb3VyY2VzQ29udGVudCI6WyJuYW1lc3BhY2UgTGlzdE1hcHMge1xyXG5cclxuaW50ZXJmYWNlIEpRdWVyeSB7XHJcbiAgICB0YWJsZXNvcnQoKTogdm9pZDtcclxuICAgIGRhdGEoa2V5OiAnc29ydEJ5Jywga2V5RnVuYzogKFxyXG4gICAgICAgIHRoOiBIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudCxcclxuICAgICAgICB0ZDogSFRNTFRhYmxlRGF0YUNlbGxFbGVtZW50LFxyXG4gICAgICAgIHRhYmxlc29ydDogYW55KSA9PiB2b2lkKTogdGhpcztcclxufVxyXG5cclxudHlwZSBTdW1tYXJ5Um93RGF0YSA9XHJcbltcclxuICAgIG51bWJlciwgc3RyaW5nLCBudW1iZXIsIHN0cmluZywgc3RyaW5nLCBzdHJpbmcsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsXHJcbiAgICBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlclxyXG5dO1xyXG5jb25zdCBNSU5JTVVNX0RBVEUgPSBuZXcgRGF0ZSgwKTtcclxuY2xhc3MgU3VtbWFyeVJvdyB7XHJcbiAgICBhcHByb3ZlZF9zdGF0dXM6IG51bWJlcjtcclxuICAgIGFwcHJvdmVkX2RhdGU6IHN0cmluZztcclxuICAgIG1vZGU6IG51bWJlcjtcclxuICAgIGJlYXRtYXBfaWQ6IHN0cmluZztcclxuICAgIGJlYXRtYXBfaWRfbnVtYmVyOiBudW1iZXI7XHJcbiAgICBiZWF0bWFwc2V0X2lkOiBzdHJpbmc7XHJcbiAgICBkaXNwbGF5X3N0cmluZzogc3RyaW5nO1xyXG4gICAgZGlzcGxheV9zdHJpbmdfbG93ZXI6IHN0cmluZztcclxuICAgIHN0YXJzOiBudW1iZXI7XHJcbiAgICBwcDogbnVtYmVyO1xyXG4gICAgaGl0X2xlbmd0aDogbnVtYmVyO1xyXG4gICAgbWF4X2NvbWJvOiBudW1iZXI7XHJcbiAgICBhcHByb2FjaF9yYXRlOiBudW1iZXI7XHJcbiAgICBjaXJjbGVfc2l6ZTogbnVtYmVyO1xyXG4gICAgbWluX21pc3NlczogbnVtYmVyO1xyXG4gICAgZmNOTTogbnVtYmVyO1xyXG4gICAgZmNIRDogbnVtYmVyO1xyXG4gICAgZmNIUjogbnVtYmVyO1xyXG4gICAgZmNIREhSOiBudW1iZXI7XHJcbiAgICBmY0RUOiBudW1iZXI7XHJcbiAgICBmY0hERFQ6IG51bWJlcjtcclxuICAgIGluZm86IEJlYXRtYXBJbmZvIHwgbnVsbDtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgZGF0YTogU3VtbWFyeVJvd0RhdGEpIHtcclxuICAgICAgICBbXHJcbiAgICAgICAgICAgIHRoaXMuYXBwcm92ZWRfc3RhdHVzLFxyXG4gICAgICAgICAgICB0aGlzLmFwcHJvdmVkX2RhdGUsXHJcbiAgICAgICAgICAgIHRoaXMubW9kZSxcclxuICAgICAgICAgICAgdGhpcy5iZWF0bWFwX2lkLFxyXG4gICAgICAgICAgICB0aGlzLmJlYXRtYXBzZXRfaWQsXHJcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheV9zdHJpbmcsXHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnMsXHJcbiAgICAgICAgICAgIHRoaXMucHAsXHJcbiAgICAgICAgICAgIHRoaXMuaGl0X2xlbmd0aCxcclxuICAgICAgICAgICAgdGhpcy5tYXhfY29tYm8sXHJcbiAgICAgICAgICAgIHRoaXMuYXBwcm9hY2hfcmF0ZSxcclxuICAgICAgICAgICAgdGhpcy5jaXJjbGVfc2l6ZSxcclxuICAgICAgICAgICAgdGhpcy5taW5fbWlzc2VzLFxyXG4gICAgICAgICAgICB0aGlzLmZjTk0sXHJcbiAgICAgICAgICAgIHRoaXMuZmNIRCxcclxuICAgICAgICAgICAgdGhpcy5mY0hSLFxyXG4gICAgICAgICAgICB0aGlzLmZjSERIUixcclxuICAgICAgICAgICAgdGhpcy5mY0RULFxyXG4gICAgICAgICAgICB0aGlzLmZjSEREVCxcclxuICAgICAgICBdID0gZGF0YTtcclxuICAgICAgICB0aGlzLmJlYXRtYXBfaWRfbnVtYmVyID0gcGFyc2VJbnQodGhpcy5iZWF0bWFwX2lkKTtcclxuICAgICAgICB0aGlzLmRpc3BsYXlfc3RyaW5nX2xvd2VyID0gdGhpcy5kaXNwbGF5X3N0cmluZy50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIHRoaXMuaW5mbyA9IG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbmxldCBzdW1tYXJ5Um93czogU3VtbWFyeVJvd1tdID0gW107XHJcbmxldCB1bnNvcnRlZFRhYmxlUm93czogSFRNTFRhYmxlUm93RWxlbWVudFtdID0gW107XHJcbmxldCBjdXJyZW50U29ydE9yZGVyOiBudW1iZXJbXSA9IFtdO1xyXG5sZXQgY3VycmVudEhhc2hMaW5rID0gJyMnO1xyXG5cclxubGV0IHByZXZpb3VzSW5kaWNlcyA9ICcnO1xyXG5sZXQgdW5zb3J0ZWRUYWJsZVJvd3NDaGFuZ2VkID0gZmFsc2U7XHJcbmZ1bmN0aW9uIGRyYXdUYWJsZShpbmRpY2VzOiBudW1iZXJbXSkge1xyXG4gICAgY29uc3Qgc3RyID0gaW5kaWNlcy5qb2luKCcsJyk7XHJcbiAgICBpZiAoIXVuc29ydGVkVGFibGVSb3dzQ2hhbmdlZCAmJiBwcmV2aW91c0luZGljZXMgPT09IHN0cikgcmV0dXJuO1xyXG4gICAgdW5zb3J0ZWRUYWJsZVJvd3NDaGFuZ2VkID0gZmFsc2U7XHJcbiAgICBwcmV2aW91c0luZGljZXMgPSBzdHI7XHJcbiAgICAkKCcjc3VtbWFyeS10YWJsZSA+IHRib2R5JylcclxuICAgICAgICAuZW1wdHkoKVxyXG4gICAgICAgIC5hcHBlbmQoaW5kaWNlcy5tYXAoaW5kZXggPT4gdW5zb3J0ZWRUYWJsZVJvd3NbaW5kZXhdKSk7XHJcbn1cclxuXHJcbmNsYXNzIFNlYXJjaFF1ZXJ5IHtcclxuICAgIHB1YmxpYyByZWFkb25seSBjaGVjazogKHJvdzogU3VtbWFyeVJvdykgPT4gYm9vbGVhbjtcclxuICAgIHB1YmxpYyByZWFkb25seSBub3JtYWxpemVkX3NvdXJjZTogc3RyaW5nO1xyXG4gICAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IHNvdXJjZTogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3Qga2V5X3RvX3Byb3BlcnR5X25hbWUgPSB7XHJcbiAgICAgICAgICAgICdzdGF0dXMnOiAnXCJ1cHJhcWxcIltyb3cuYXBwcm92ZWRfc3RhdHVzKzFdJyxcclxuICAgICAgICAgICAgJ21vZGUnOiAnXCJvdGNtXCJbcm93Lm1vZGVdJyxcclxuICAgICAgICAgICAgJ3N0YXJzJzogJ3Jvdy5zdGFycycsXHJcbiAgICAgICAgICAgICdwcCc6ICdyb3cucHAnLFxyXG4gICAgICAgICAgICAnbGVuZ3RoJzogJ3Jvdy5oaXRfbGVuZ3RoJyxcclxuICAgICAgICAgICAgJ2NvbWJvJzogJ3Jvdy5tYXhfY29tYm8nLFxyXG4gICAgICAgICAgICAnYXInOiAncm93LmFwcHJvYWNoX3JhdGUnLFxyXG4gICAgICAgICAgICAnY3MnOiAncm93LmNpcmNsZV9zaXplJyxcclxuICAgICAgICAgICAgJ3BsYXllZCc6IGAoIXJvdy5pbmZvP0luZmluaXR5Oigke25ldyBEYXRlKCkudmFsdWVPZigpfS1yb3cuaW5mby5sYXN0UGxheWVkLnZhbHVlT2YoKSkvJHsxZTMgKiA2MCAqIDYwICogMjR9KWAsXHJcbiAgICAgICAgICAgICd1bnBsYXllZCc6IGAocm93LmluZm8mJnJvdy5pbmZvLmxhc3RQbGF5ZWQudmFsdWVPZigpIT09JHtNSU5JTVVNX0RBVEUudmFsdWVPZigpfT8neSc6JycpYCxcclxuICAgICAgICAgICAgJ3JhbmsnOiBgKCR7SlNPTi5zdHJpbmdpZnkocmFua0FjaGlldmVkQ2xhc3MpfVshcm93LmluZm8/OTpyb3cuaW5mby5yYW5rQWNoaWV2ZWRdKS50b0xvd2VyQ2FzZSgpYFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgY29uc3QgcmVnZXhwID0gbmV3IFJlZ0V4cChgKCR7XHJcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGtleV90b19wcm9wZXJ0eV9uYW1lKS5qb2luKCd8JylcclxuICAgICAgICB9KSg8PT98Pj0/fD18IT0pKFstXFxcXHdcXFxcLl0qKWApO1xyXG4gICAgICAgIGxldCBjaGVja19mdW5jX3NvdXJjZSA9ICdyZXR1cm4gdHJ1ZSc7XHJcbiAgICAgICAgdGhpcy5ub3JtYWxpemVkX3NvdXJjZSA9ICcnO1xyXG4gICAgICAgIGZvciAoY29uc3QgdG9rZW4gb2Ygc291cmNlLnNwbGl0KCcgJykpIHtcclxuICAgICAgICAgICAgY29uc3QgdHJpbW1lZCA9IHRva2VuLnRyaW0oKTtcclxuICAgICAgICAgICAgaWYgKHRyaW1tZWQgPT09ICcnKSBjb250aW51ZTtcclxuICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSByZWdleHAuZXhlYyh0cmltbWVkKTtcclxuICAgICAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSBtYXRjaFsxXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlbCA9IG1hdGNoWzJdID09PSAnPScgPyAnPT0nIDogbWF0Y2hbMl07XHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsOiBudW1iZXIgfCBzdHJpbmcgPSBwYXJzZUZsb2F0KG1hdGNoWzNdKTtcclxuICAgICAgICAgICAgICAgIGlmIChpc05hTih2YWwpKVxyXG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IG1hdGNoWzNdLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wID0gKGtleV90b19wcm9wZXJ0eV9uYW1lIGFzIGFueSlba2V5XTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5vcm1hbGl6ZWRfc291cmNlICE9PSAnJykgdGhpcy5ub3JtYWxpemVkX3NvdXJjZSArPSAnICc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5vcm1hbGl6ZWRfc291cmNlICs9IG1hdGNoWzFdICsgbWF0Y2hbMl0gKyBtYXRjaFszXTtcclxuICAgICAgICAgICAgICAgIGNoZWNrX2Z1bmNfc291cmNlICs9IGAmJiR7cHJvcH0ke3JlbH0ke0pTT04uc3RyaW5naWZ5KHZhbCl9YDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0ciA9IHRyaW1tZWQudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVzY2FwZWQgPSBKU09OLnN0cmluZ2lmeShzdHIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubm9ybWFsaXplZF9zb3VyY2UgIT09ICcnKSB0aGlzLm5vcm1hbGl6ZWRfc291cmNlICs9ICcgJztcclxuICAgICAgICAgICAgICAgIHRoaXMubm9ybWFsaXplZF9zb3VyY2UgKz0gc3RyO1xyXG4gICAgICAgICAgICAgICAgY2hlY2tfZnVuY19zb3VyY2UgKz0gYCYmcm93LmRpc3BsYXlfc3RyaW5nX2xvd2VyLmluZGV4T2YoJHtlc2NhcGVkfSkhPT0tMWA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jaGVjayA9IG5ldyBGdW5jdGlvbigncm93JywgY2hlY2tfZnVuY19zb3VyY2UpIGFzIGFueTtcclxuICAgIH1cclxufVxyXG5cclxuY29uc3Qgc29ydEtleXMgPSBbXHJcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5hcHByb3ZlZF9kYXRlLFxyXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHguZGlzcGxheV9zdHJpbmcsXHJcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5zdGFycyxcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LnBwLFxyXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHguaGl0X2xlbmd0aCxcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4Lm1heF9jb21ibyxcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LmFwcHJvYWNoX3JhdGUsXHJcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5jaXJjbGVfc2l6ZSxcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PlxyXG4gICAgICAgIHguZmNIRERUICogMiArIHguZmNEVCAqIDFlOCArXHJcbiAgICAgICAgeC5mY0hESFIgKiAyICsgeC5mY0hSICogMWU0ICtcclxuICAgICAgICB4LmZjSEQgKiAyICsgeC5mY05NIC1cclxuICAgICAgICB4Lm1pbl9taXNzZXMsXHJcbiAgICAoeDogU3VtbWFyeVJvdykgPT4gIXguaW5mbyA/IE1JTklNVU1fREFURS52YWx1ZU9mKCkgOiB4LmluZm8ubGFzdFBsYXllZC52YWx1ZU9mKClcclxuXTtcclxuXHJcbmZ1bmN0aW9uIHN0cmluZ2lmeU9iamVjdChvYmo6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nOyB9KTogc3RyaW5nIHtcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopXHJcbiAgICAgICAgLm1hcChrID0+IGsgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQob2JqW2tdKSlcclxuICAgICAgICAuam9pbignJicpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZU9iamVjdChzdHI6IHN0cmluZykge1xyXG4gICAgY29uc3QgcmVzID0ge307XHJcbiAgICBzdHIuc3BsaXQoJyYnKS5mb3JFYWNoKHBhcnQgPT4ge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoID0gcGFydC5tYXRjaCgvKFxcdyspPSguKykvKTtcclxuICAgICAgICBpZiAobWF0Y2gpXHJcbiAgICAgICAgICAgIChyZXMgYXMgYW55KVttYXRjaFsxXV0gPSBkZWNvZGVVUklDb21wb25lbnQobWF0Y2hbMl0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCkge1xyXG4gICAgY29uc3QgZmlsdGVyX2FwcHJvdmVkX3N0YXR1cyA9IHBhcnNlSW50KCQoJyNmaWx0ZXItYXBwcm92ZWQtc3RhdHVzJykudmFsKCkgYXMgc3RyaW5nKTtcclxuICAgIGNvbnN0IGZpbHRlcl9tb2RlID0gcGFyc2VJbnQoJCgnI2ZpbHRlci1tb2RlJykudmFsKCkgYXMgc3RyaW5nKTtcclxuICAgIGNvbnN0IGZpbHRlcl9zZWFyY2hfcXVlcnkgPSBuZXcgU2VhcmNoUXVlcnkoKCQoJyNmaWx0ZXItc2VhcmNoLXF1ZXJ5JykudmFsKCkgYXMgc3RyaW5nKSk7XHJcbiAgICBjb25zdCBmaWx0ZXJfZmNfbGV2ZWwgPSBwYXJzZUludCgkKCcjZmlsdGVyLWZjLWxldmVsJykudmFsKCkgYXMgc3RyaW5nKTtcclxuICAgIGNvbnN0IGZpbHRlcl9sb2NhbF9kYXRhID0gcGFyc2VJbnQoJCgnI2ZpbHRlci1sb2NhbC1kYXRhJykudmFsKCkgYXMgc3RyaW5nKTtcclxuICAgIGNvbnN0IHNob3dfZnVsbF9yZXN1bHQgPSAkKCcjc2hvdy1mdWxsLXJlc3VsdCcpLnByb3AoJ2NoZWNrZWQnKTtcclxuXHJcbiAgICBjb25zdCBnZXRfZmNfbGV2ZWwgPSAocm93OiBTdW1tYXJ5Um93KSA9PiB7XHJcbiAgICAgICAgaWYgKHJvdy5taW5fbWlzc2VzICE9PSAwKSByZXR1cm4gMTtcclxuICAgICAgICBpZiAocm93LmZjRFQgIT09IDAgfHwgcm93LmZjSEREVCAhPT0gMCkgcmV0dXJuIDg7XHJcbiAgICAgICAgaWYgKHJvdy5mY05NID09PSAwICYmIHJvdy5mY0hEID09PSAwICYmIHJvdy5mY0hSID09PSAwICYmIHJvdy5mY0hESFIgPT09IDApIHJldHVybiAyO1xyXG4gICAgICAgIGlmIChyb3cuZmNOTSA9PT0gMCAmJiByb3cuZmNIRCA9PT0gMCkgcmV0dXJuIDM7XHJcbiAgICAgICAgaWYgKHJvdy5mY0hEID09PSAwKSByZXR1cm4gNDtcclxuICAgICAgICBpZiAocm93LmZjSFIgPT09IDAgJiYgcm93LmZjSERIUiA9PT0gMCkgcmV0dXJuIDU7XHJcbiAgICAgICAgaWYgKHJvdy5mY0hESFIgPT09IDApIHJldHVybiA2O1xyXG4gICAgICAgIHJldHVybiA3O1xyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBnZXRfbG9jYWxfZGF0YV9mbGFncyA9IChyb3c6IFN1bW1hcnlSb3cpOiBudW1iZXIgPT4ge1xyXG4gICAgICAgIGlmIChiZWF0bWFwSW5mb01hcC5zaXplID09PSAwKSByZXR1cm4gLTE7XHJcbiAgICAgICAgbGV0IGZsYWdzID0gMDtcclxuICAgICAgICBjb25zdCBpbmZvID0gYmVhdG1hcEluZm9NYXAuZ2V0KHJvdy5iZWF0bWFwX2lkX251bWJlcik7XHJcbiAgICAgICAgaWYgKCFpbmZvKSByZXR1cm4gMDtcclxuICAgICAgICBmbGFncyB8PSAyO1xyXG4gICAgICAgIGlmIChpbmZvLmxhc3RQbGF5ZWQudmFsdWVPZigpICE9PSBNSU5JTVVNX0RBVEUudmFsdWVPZigpKVxyXG4gICAgICAgICAgICBmbGFncyB8PSAxO1xyXG4gICAgICAgIHJldHVybiBmbGFncztcclxuICAgIH07XHJcblxyXG4gICAgY3VycmVudEhhc2hMaW5rID0gJyMnO1xyXG4gICAgY29uc3Qgb2JqID0ge30gYXMgeyBba2V5OiBzdHJpbmddOiBzdHJpbmc7IH07XHJcbiAgICBpZiAoZmlsdGVyX2FwcHJvdmVkX3N0YXR1cyAhPT0gMSlcclxuICAgICAgICBvYmoucyA9IGZpbHRlcl9hcHByb3ZlZF9zdGF0dXMudG9TdHJpbmcoKTtcclxuICAgIGlmIChmaWx0ZXJfbW9kZSAhPT0gMSlcclxuICAgICAgICBvYmoubSA9IGZpbHRlcl9tb2RlLnRvU3RyaW5nKCk7XHJcbiAgICBpZiAoZmlsdGVyX3NlYXJjaF9xdWVyeS5ub3JtYWxpemVkX3NvdXJjZSAhPT0gJycpXHJcbiAgICAgICAgb2JqLnEgPSBmaWx0ZXJfc2VhcmNoX3F1ZXJ5Lm5vcm1hbGl6ZWRfc291cmNlO1xyXG4gICAgaWYgKGZpbHRlcl9mY19sZXZlbCAhPT0gMClcclxuICAgICAgICBvYmoubCA9IGZpbHRlcl9mY19sZXZlbC50b1N0cmluZygpO1xyXG4gICAgaWYgKGZpbHRlcl9sb2NhbF9kYXRhICE9PSAwKVxyXG4gICAgICAgIG9iai5kID0gZmlsdGVyX2xvY2FsX2RhdGEudG9TdHJpbmcoKTtcclxuICAgIGlmIChjdXJyZW50U29ydE9yZGVyLmxlbmd0aCAhPT0gMClcclxuICAgICAgICBvYmoubyA9IGN1cnJlbnRTb3J0T3JkZXIuam9pbignLicpO1xyXG4gICAgaWYgKHNob3dfZnVsbF9yZXN1bHQpXHJcbiAgICAgICAgb2JqLmYgPSAnMSc7XHJcblxyXG4gICAgY3VycmVudEhhc2hMaW5rICs9IHN0cmluZ2lmeU9iamVjdChvYmopO1xyXG4gICAgaGlzdG9yeS5yZXBsYWNlU3RhdGUoe30sIGRvY3VtZW50LnRpdGxlLCBsb2NhdGlvbi5wYXRobmFtZSArIChjdXJyZW50SGFzaExpbmsgPT09ICcjJyA/ICcnIDogY3VycmVudEhhc2hMaW5rKSk7XHJcblxyXG4gICAgY29uc3QgaW5kaWNlcyA9IHN1bW1hcnlSb3dzLm1hcCgoXywgaW5kZXgpID0+IGluZGV4KS5maWx0ZXIoaW5kZXggPT4ge1xyXG4gICAgICAgIGNvbnN0IHJvdyA9IHN1bW1hcnlSb3dzW2luZGV4XTtcclxuXHJcbiAgICAgICAgaWYgKGZpbHRlcl9hcHByb3ZlZF9zdGF0dXMgPT09IDEgJiZcclxuICAgICAgICAgICAgKHJvdy5hcHByb3ZlZF9zdGF0dXMgIT09IDEgJiYgcm93LmFwcHJvdmVkX3N0YXR1cyAhPT0gMikpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICBpZiAoZmlsdGVyX2FwcHJvdmVkX3N0YXR1cyA9PT0gMiAmJiByb3cuYXBwcm92ZWRfc3RhdHVzICE9PSA0KVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmIChmaWx0ZXJfbW9kZSA9PT0gMSAmJiByb3cubW9kZSAhPT0gMClcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGlmIChmaWx0ZXJfbW9kZSA9PT0gMiAmJiByb3cubW9kZSAhPT0gMilcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoIWZpbHRlcl9zZWFyY2hfcXVlcnkuY2hlY2socm93KSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoZmlsdGVyX2ZjX2xldmVsICE9PSAwICYmIGdldF9mY19sZXZlbChyb3cpICE9PSBmaWx0ZXJfZmNfbGV2ZWwpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKGZpbHRlcl9sb2NhbF9kYXRhICE9PSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZsYWdzID0gZ2V0X2xvY2FsX2RhdGFfZmxhZ3Mocm93KTtcclxuICAgICAgICAgICAgc3dpdGNoIChmaWx0ZXJfbG9jYWxfZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAxOiBpZiAoKGZsYWdzICYgMSkgIT09IDApIHJldHVybiBmYWxzZTsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDI6IGlmICgoZmxhZ3MgJiAxKSA9PT0gMCkgcmV0dXJuIGZhbHNlOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgMzogaWYgKChmbGFncyAmIDIpICE9PSAwKSByZXR1cm4gZmFsc2U7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBpZiAoKGZsYWdzICYgMikgPT09IDApIHJldHVybiBmYWxzZTsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDU6IGlmICgoZmxhZ3MgJiAzKSAhPT0gMikgcmV0dXJuIGZhbHNlOyBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9KTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IG9yZCBvZiBjdXJyZW50U29ydE9yZGVyKSB7XHJcbiAgICAgICAgaWYgKG9yZCA9PT0gMCkgY29udGludWU7XHJcbiAgICAgICAgY29uc3QgcHJldkluZGV4ID0gQXJyYXkoaW5kaWNlcy5sZW5ndGgpO1xyXG4gICAgICAgIGluZGljZXMuZm9yRWFjaCgoeCwgaSkgPT4gcHJldkluZGV4W3hdID0gaSk7XHJcbiAgICAgICAgY29uc3Qgc29ydEtleSA9IHNvcnRLZXlzW01hdGguYWJzKG9yZCkgLSAxXTtcclxuICAgICAgICBjb25zdCBzaWduID0gb3JkID4gMCA/IDEgOiAtMTtcclxuICAgICAgICBpbmRpY2VzLnNvcnQoKHgsIHkpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qga3ggPSBzb3J0S2V5KHN1bW1hcnlSb3dzW3hdKTtcclxuICAgICAgICAgICAgY29uc3Qga3kgPSBzb3J0S2V5KHN1bW1hcnlSb3dzW3ldKTtcclxuICAgICAgICAgICAgcmV0dXJuIGt4IDwga3kgPyAtc2lnbiA6IGt4ID4ga3kgPyBzaWduIDogcHJldkluZGV4W3ldIC0gcHJldkluZGV4W3hdO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgICQoJyNudW0tcmVzdWx0cycpLnRleHQoaW5kaWNlcy5sZW5ndGggPT09IDEgPyAnMSBtYXAnIDogaW5kaWNlcy5sZW5ndGgudG9TdHJpbmcoKSArICcgbWFwcycpO1xyXG4gICAgY29uc3QgdHJ1bmNhdGVfbnVtID0gc2hvd19mdWxsX3Jlc3VsdCA/IEluZmluaXR5IDogMTAwO1xyXG4gICAgaWYgKGluZGljZXMubGVuZ3RoID4gdHJ1bmNhdGVfbnVtKVxyXG4gICAgICAgIGluZGljZXMubGVuZ3RoID0gdHJ1bmNhdGVfbnVtO1xyXG5cclxuICAgICQoJyNoYXNoLWxpbmstdG8tdGhlLWN1cnJlbnQtdGFibGUnKS5hdHRyKCdocmVmJywgY3VycmVudEhhc2hMaW5rKTtcclxuXHJcbiAgICBkcmF3VGFibGUoaW5kaWNlcyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbXBseVNvcnRPcmRlcihvcmRlcjogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICBjb25zdCByZXMgPSBbXTtcclxuICAgIGNvbnN0IHNlZW4gPSBBcnJheShzb3J0S2V5cy5sZW5ndGgpO1xyXG4gICAgZm9yIChsZXQgaSA9IG9yZGVyLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS0gaSkge1xyXG4gICAgICAgIGNvbnN0IHggPSBvcmRlcltpXTtcclxuICAgICAgICBpZiAoeCA9PT0gMCkgY29udGludWU7XHJcbiAgICAgICAgY29uc3Qga2V5ID0gTWF0aC5hYnMoeCkgLSAxLCBzaWduID0geCA+IDAgPyAxIDogLTE7XHJcbiAgICAgICAgaWYgKHNlZW5ba2V5XSkgY29udGludWU7XHJcbiAgICAgICAgc2VlbltrZXldID0gc2lnbjtcclxuICAgICAgICByZXMucHVzaCh4KTtcclxuICAgICAgICBpZiAoWzAsIDEsIDIsIDMsIDQsIDUsIDldLmluZGV4T2Yoa2V5KSAhPT0gLTEpIC8vIHRoZXJlIGlzIGFsbW9zdCBubyB0aWVzXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgaWYgKHJlcy5sZW5ndGggIT09IDAgJiYgcmVzW3Jlcy5sZW5ndGggLSAxXSA9PT0gLTMpXHJcbiAgICAgICAgcmVzLnBvcCgpO1xyXG4gICAgcmVzLnJldmVyc2UoKTtcclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFF1ZXJ5QWNjb3JkaW5nVG9IYXNoKCkge1xyXG4gICAgbGV0IG9iajogeyBbazogc3RyaW5nXTogc3RyaW5nOyB9O1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBvYmogPSBwYXJzZU9iamVjdChsb2NhdGlvbi5oYXNoLnN1YnN0cigxKSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgb2JqID0ge307XHJcbiAgICB9XHJcbiAgICBpZiAob2JqLnMgPT09IHVuZGVmaW5lZCkgb2JqLnMgPSAnMSc7XHJcbiAgICBpZiAob2JqLm0gPT09IHVuZGVmaW5lZCkgb2JqLm0gPSAnMSc7XHJcbiAgICBpZiAob2JqLnEgPT09IHVuZGVmaW5lZCkgb2JqLnEgPSAnJztcclxuICAgIGlmIChvYmoubCA9PT0gdW5kZWZpbmVkKSBvYmoubCA9ICcwJztcclxuICAgIGlmIChvYmoubyA9PT0gdW5kZWZpbmVkKSBvYmoubyA9ICcnO1xyXG4gICAgaWYgKG9iai5mID09PSB1bmRlZmluZWQpIG9iai5mID0gJzAnO1xyXG4gICAgaWYgKG9iai5kID09PSB1bmRlZmluZWQpIG9iai5kID0gJzAnO1xyXG4gICAgJCgnI2ZpbHRlci1hcHByb3ZlZC1zdGF0dXMnKS52YWwocGFyc2VJbnQob2JqLnMpKTtcclxuICAgICQoJyNmaWx0ZXItbW9kZScpLnZhbChwYXJzZUludChvYmoubSkpO1xyXG4gICAgJCgnI2ZpbHRlci1zZWFyY2gtcXVlcnknKS52YWwob2JqLnEpO1xyXG4gICAgJCgnI2ZpbHRlci1mYy1sZXZlbCcpLnZhbChwYXJzZUludChvYmoubCkpO1xyXG4gICAgJCgnI2ZpbHRlci1sb2NhbC1kYXRhJykudmFsKHBhcnNlSW50KG9iai5kKSk7XHJcbiAgICAkKCcjc2hvdy1mdWxsLXJlc3VsdCcpLnByb3AoJ2NoZWNrZWQnLCAhIXBhcnNlSW50KG9iai5mKSk7XHJcbiAgICBjdXJyZW50U29ydE9yZGVyID0gc2ltcGx5U29ydE9yZGVyKG9iai5vLnNwbGl0KCcuJykubWFwKHggPT4gcGFyc2VJbnQoeCkgfHwgMCkpO1xyXG4gICAgc2V0VGFibGVIZWFkU29ydGluZ01hcmsoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0VGFibGVIZWFkU29ydGluZ01hcmsoKSB7XHJcbiAgICAkKCcuc29ydGVkJykucmVtb3ZlQ2xhc3MoJ3NvcnRlZCBhc2NlbmRpbmcgZGVzY2VuZGluZycpO1xyXG4gICAgY29uc3QgeCA9IGN1cnJlbnRTb3J0T3JkZXIubGVuZ3RoID09PSAwID9cclxuICAgICAgICAtMyA6IC8vIHN0YXJzIGRlc2NcclxuICAgICAgICBjdXJyZW50U29ydE9yZGVyW2N1cnJlbnRTb3J0T3JkZXIubGVuZ3RoIC0gMV07XHJcbiAgICBjb25zdCBpbmRleCA9IE1hdGguYWJzKHgpIC0gMTtcclxuICAgICQoJCgnI3N1bW1hcnktdGFibGUgPiB0aGVhZCA+IHRyID4gdGgnKVtpbmRleF0pXHJcbiAgICAgICAgLmFkZENsYXNzKCdzb3J0ZWQnKS5hZGRDbGFzcyh4ID4gMCA/ICdhc2NlbmRpbmcnIDogJ2Rlc2NlbmRpbmcnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFkKHg6IG51bWJlcikge1xyXG4gICAgcmV0dXJuICh4IDwgMTAgPyAnMCcgOiAnJykgKyB4O1xyXG59XHJcblxyXG5mdW5jdGlvbiBmb3JtYXREYXRlKGRhdGU6IERhdGUpIHtcclxuICAgIHJldHVybiBkYXRlLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSArXHJcbiAgICAgICAgJyAnICsgcGFkKGRhdGUuZ2V0SG91cnMoKSkgK1xyXG4gICAgICAgICc6JyArIHBhZChkYXRlLmdldE1pbnV0ZXMoKSk7XHJcbn1cclxuXHJcbmNvbnN0IHJhbmtBY2hpZXZlZENsYXNzID0gW1xyXG4gICAgJ1NTSCcsICdTSCcsICdTUycsICdTJywgJ0EnLFxyXG4gICAgJ0InLCAnQycsICdEJywgJ0YnLCAnLSdcclxuXTtcclxuXHJcbmxldCBiZWF0bWFwSW5mb01hcFVzZWRWZXJzaW9uID0gTUlOSU1VTV9EQVRFO1xyXG5mdW5jdGlvbiBpbml0VW5zb3J0ZWRUYWJsZVJvd3MoKSB7XHJcbiAgICBpZiAoc3VtbWFyeVJvd3MubGVuZ3RoID09PSAwKVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICBpZiAodW5zb3J0ZWRUYWJsZVJvd3MubGVuZ3RoICE9PSAwICYmIGJlYXRtYXBJbmZvTWFwVXNlZFZlcnNpb24gPT09IGJlYXRtYXBJbmZvTWFwVmVyc2lvbilcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICBiZWF0bWFwSW5mb01hcFVzZWRWZXJzaW9uID0gYmVhdG1hcEluZm9NYXBWZXJzaW9uO1xyXG4gICAgaWYgKGJlYXRtYXBJbmZvTWFwLnNpemUgIT09IDApIHtcclxuICAgICAgICBzdW1tYXJ5Um93cy5mb3JFYWNoKHJvdyA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBiZWF0bWFwSW5mb01hcC5nZXQocm93LmJlYXRtYXBfaWRfbnVtYmVyKTtcclxuICAgICAgICAgICAgaWYgKGluZm8pXHJcbiAgICAgICAgICAgICAgICByb3cuaW5mbyA9IGluZm87XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbW9kZV9pY29ucyA9IFtcclxuICAgICAgICAnZmEgZmEtZXhjaGFuZ2UnLFxyXG4gICAgICAgICcnLFxyXG4gICAgICAgICdmYSBmYS10aW50JyxcclxuICAgICAgICAnJyxcclxuICAgIF07XHJcbiAgICBjb25zdCBhcHByb3ZlZF9zdGF0dXNfaWNvbnMgPSBbXHJcbiAgICAgICAgJ2ZhIGZhLXF1ZXN0aW9uJyxcclxuICAgICAgICAnZmEgZmEtYW5nbGUtZG91YmxlLXJpZ2h0JyxcclxuICAgICAgICAnZmEgZmEtZmlyZScsXHJcbiAgICAgICAgJ2ZhIGZhLWNoZWNrJyxcclxuICAgICAgICAnZmEgZmEtaGVhcnQtbycsXHJcbiAgICBdO1xyXG4gICAgdW5zb3J0ZWRUYWJsZVJvd3MgPSBzdW1tYXJ5Um93cy5tYXAocm93ID0+XHJcbiAgICAgICAgJCgnPHRyPicpLmFwcGVuZChbXHJcbiAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICQoJzxpPicpLmFkZENsYXNzKGFwcHJvdmVkX3N0YXR1c19pY29uc1tyb3cuYXBwcm92ZWRfc3RhdHVzXSksXHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShyb3cuYXBwcm92ZWRfZGF0ZS5zcGxpdCgnICcpWzBdKVxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAkKCc8aT4nKS5hZGRDbGFzcyhtb2RlX2ljb25zW3Jvdy5tb2RlXSksXHJcbiAgICAgICAgICAgICAgICAkKCc8YT4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYGh0dHBzOi8vb3N1LnBweS5zaC9iLyR7cm93LmJlYXRtYXBfaWR9P209MmApXHJcbiAgICAgICAgICAgICAgICAgICAgLnRleHQocm93LmRpc3BsYXlfc3RyaW5nKSxcclxuICAgICAgICAgICAgICAgIHJvdy5iZWF0bWFwX2lkX251bWJlciA+IDAgPyAkKCc8ZGl2IGNsYXNzPVwiZmxvYXQtcmlnaHRcIj4nKS5hcHBlbmQoW1xyXG4gICAgICAgICAgICAgICAgICAgICQoJzxhPjxpIGNsYXNzPVwiZmEgZmEtcGljdHVyZS1vXCI+JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9iLnBweS5zaC90aHVtYi8ke3Jvdy5iZWF0bWFwc2V0X2lkfS5qcGdgKSxcclxuICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLWRvd25sb2FkXCI+JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9vc3UucHB5LnNoL2QvJHtyb3cuYmVhdG1hcHNldF9pZH1uYCksXHJcbiAgICAgICAgICAgICAgICAgICAgJCgnPGE+PGkgY2xhc3M9XCJmYSBmYS1jbG91ZC1kb3dubG9hZFwiPicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYG9zdTovL2RsLyR7cm93LmJlYXRtYXBzZXRfaWR9YClcclxuICAgICAgICAgICAgICAgIF0pIDogW11cclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgcm93LnN0YXJzLnRvRml4ZWQoMiksXHJcbiAgICAgICAgICAgIHJvdy5wcC50b0ZpeGVkKDApLFxyXG4gICAgICAgICAgICBgJHtNYXRoLmZsb29yKHJvdy5oaXRfbGVuZ3RoIC8gNjApfToke3BhZChNYXRoLmZsb29yKHJvdy5oaXRfbGVuZ3RoICUgNjApKX1gLFxyXG4gICAgICAgICAgICByb3cubWF4X2NvbWJvLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgIHJvdy5hcHByb2FjaF9yYXRlLnRvRml4ZWQoMSksXHJcbiAgICAgICAgICAgIHJvdy5jaXJjbGVfc2l6ZS50b0ZpeGVkKDEpLFxyXG4gICAgICAgICAgICByb3cubWluX21pc3NlcyAhPT0gMCA/IChyb3cubWluX21pc3NlcyA9PT0gMSA/ICcxIG1pc3MnIDogcm93Lm1pbl9taXNzZXMgKyAnIG1pc3NlcycpIDpcclxuICAgICAgICAgICAgICAgIFtyb3cuZmNOTSwgcm93LmZjSEQsIHJvdy5mY0hSLCByb3cuZmNIREhSLCByb3cuZmNEVCwgcm93LmZjSEREVF0uam9pbignLCAnKSxcclxuICAgICAgICAgICAgYmVhdG1hcEluZm9NYXAuc2l6ZSA9PT0gMCA/IFtdIDpcclxuICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgJCgnPGkgY2xhc3M9XCJmYVwiPicpLmFkZENsYXNzKHJvdy5pbmZvID8gJ2ZhLWNoZWNrLXNxdWFyZS1vJyA6ICdmYS1zcXVhcmUtbycpLFxyXG4gICAgICAgICAgICAgICAgJCgnPHNwYW4+JykuYWRkQ2xhc3MoJ3JhbmstJyArIHJhbmtBY2hpZXZlZENsYXNzWyFyb3cuaW5mbyA/IDkgOiByb3cuaW5mby5yYW5rQWNoaWV2ZWRdKSxcclxuICAgICAgICAgICAgICAgICQoJzxzcGFuPicpLnRleHQoXHJcbiAgICAgICAgICAgICAgICAgICAgIXJvdy5pbmZvIHx8IHJvdy5pbmZvLmxhc3RQbGF5ZWQudmFsdWVPZigpID09PSBNSU5JTVVNX0RBVEUudmFsdWVPZigpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgID8gJy0tLScgOiBmb3JtYXREYXRlKHJvdy5pbmZvLmxhc3RQbGF5ZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgXS5tYXAoeCA9PiAkKCc8dGQ+JykuYXBwZW5kKHgpKSlbMF0gYXMgSFRNTFRhYmxlUm93RWxlbWVudCk7XHJcblxyXG4gICAgdW5zb3J0ZWRUYWJsZVJvd3NDaGFuZ2VkID0gdHJ1ZTtcclxuICAgIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaG93RXJyb3JNZXNzYWdlKHRleHQ6IHN0cmluZykge1xyXG4gICAgJCgnI2FsZXJ0cycpLmFwcGVuZChcclxuICAgICAgICAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtd2FybmluZyBhbGVydC1kaXNtaXNzYWJsZVwiPicpXHJcbiAgICAgICAgICAgIC50ZXh0KHRleHQpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoJzxhIGNsYXNzPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJhbGVydFwiPjxzcGFuPiZ0aW1lczsnKSk7XHJcbn1cclxuXHJcbmNvbnN0IExPQ0FMU1RPUkFHRV9QUkVGSVggPSAnbGlzdC1tYXBzLyc7XHJcbnR5cGUgTG9jYWxGaWxlTmFtZSA9ICdvc3UhLmRiJyB8ICdzY29yZXMuZGInO1xyXG5pbnRlcmZhY2UgTG9jYWxGaWxlIHtcclxuICAgIGRhdGE6IFVpbnQ4QXJyYXk7XHJcbiAgICB1cGxvYWRlZERhdGU6IERhdGU7XHJcbn1cclxuY29uc3QgbG9jYWxGaWxlczoge1xyXG4gICAgWydvc3UhLmRiJ10/OiBMb2NhbEZpbGUsXHJcbiAgICBbJ3Njb3Jlcy5kYiddPzogTG9jYWxGaWxlO1xyXG59ID0ge307XHJcblxyXG4vKlxyXG5mdW5jdGlvbiBkYXRhVVJJdG9VSW50OEFycmF5KGRhdGFVUkk6IHN0cmluZykge1xyXG4gICAgY29uc3QgYmFzZTY0ID0gZGF0YVVSSS5zcGxpdCgnLCcpWzFdO1xyXG4gICAgY29uc3Qgc3RyID0gYXRvYihiYXNlNjQpO1xyXG4gICAgY29uc3QgbGVuID0gc3RyLmxlbmd0aDtcclxuICAgIGNvbnN0IGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkobGVuKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyArKyBpKSB7XHJcbiAgICAgICAgYXJyYXlbaV0gPSBzdHIuY2hhckNvZGVBdChpKTtcclxuICAgIH1cclxuICAgIHJldHVybiBhcnJheTtcclxufVxyXG4qL1xyXG5cclxuY29uc3QgcmVnaXN0ZXJlZENhbGxiYWNrTWFwID0gbmV3IE1hcDxudW1iZXIsIChkYXRhOiBhbnkpID0+IGFueT4oKTtcclxuZnVuY3Rpb24gcmVnaXN0ZXJDYWxsYmFjayhjYWxsYmFjazogKGRhdGE6IGFueSkgPT4gYW55KTogbnVtYmVyIHtcclxuICAgIGxldCBpZDtcclxuICAgIGRvXHJcbiAgICAgICAgaWQgPSBNYXRoLnJhbmRvbSgpO1xyXG4gICAgd2hpbGUgKHJlZ2lzdGVyZWRDYWxsYmFja01hcC5oYXMoaWQpKTtcclxuICAgIHJlZ2lzdGVyZWRDYWxsYmFja01hcC5zZXQoaWQsIGNhbGxiYWNrKTtcclxuICAgIHJldHVybiBpZDtcclxufVxyXG5cclxuZnVuY3Rpb24gbmV3V29ya2VyKCk6IFdvcmtlciB7XHJcbiAgICByZXR1cm4gbmV3IFdvcmtlcignZGlzdC9saXN0LW1hcHMtd29ya2VyLmpzJyk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJ1bldvcmtlcihtZXNzYWdlOiBvYmplY3QsIHVzaW5nPzogV29ya2VyKTogUHJvbWlzZTxhbnk+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxhbnk+KHJlc29sdmUgPT4ge1xyXG4gICAgICAgIGNvbnN0IHdvcmtlciA9IHVzaW5nIHx8IG5ld1dvcmtlcigpO1xyXG4gICAgICAgIChtZXNzYWdlIGFzIGFueSkuaWQgPSByZWdpc3RlckNhbGxiYWNrKHJlc29sdmUpO1xyXG4gICAgICAgIHdvcmtlci5wb3N0TWVzc2FnZShtZXNzYWdlKTtcclxuICAgICAgICB3b3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBldmVudC5kYXRhO1xyXG4gICAgICAgICAgICBpZiAoZGF0YS50eXBlID09PSAnY2FsbGJhY2snICYmIHR5cGVvZihkYXRhLmlkKSA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gcmVnaXN0ZXJlZENhbGxiYWNrTWFwLmdldChkYXRhLmlkKTtcclxuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlZ2lzdGVyZWRDYWxsYmFja01hcC5kZWxldGUoZGF0YS5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbXByZXNzQnVmZmVyVG9TdHJpbmcoYnVmZmVyOiBBcnJheUJ1ZmZlcik6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICBjb25zdCBjb21wcmVzc2VkID0gKGF3YWl0IHJ1bldvcmtlcih7XHJcbiAgICAgICAgdHlwZTogJ2NvbXByZXNzJyxcclxuICAgICAgICBkYXRhOiBuZXcgVWludDhBcnJheShidWZmZXIpXHJcbiAgICB9KSkuZGF0YSBhcyBVaW50OEFycmF5O1xyXG4gICAgY29uc3QgY2hhcnMgPSBuZXcgQXJyYXkoTWF0aC5mbG9vcihjb21wcmVzc2VkLmxlbmd0aCAvIDIpKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hhcnMubGVuZ3RoOyBpICs9IDEpIHtcclxuICAgICAgICBjb25zdCBjb2RlID0gKGNvbXByZXNzZWRbaSAqIDIgKyAwXSAmIDB4ZmYpIDw8IDggfCAoY29tcHJlc3NlZFtpICogMiArIDFdICYgMHhmZik7XHJcbiAgICAgICAgY2hhcnNbaV0gPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpO1xyXG4gICAgfVxyXG4gICAgbGV0IHJlcyA9IGNvbXByZXNzZWQubGVuZ3RoICUgMiA/ICcxJyA6ICcwJztcclxuICAgIHJlcyArPSBjaGFycy5qb2luKCcnKTtcclxuICAgIGlmIChjb21wcmVzc2VkLmxlbmd0aCAlIDIgIT09IDApXHJcbiAgICAgICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGNvbXByZXNzZWRbY29tcHJlc3NlZC5sZW5ndGggLSAxXSAmIDB4ZmYpIDw8IDgpO1xyXG4gICAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlY29tcHJlc3NCdWZmZXJGcm9tU3RyaW5nKHN0cjogc3RyaW5nKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XHJcbiAgICBjb25zdCBwYXJpdHkgPSBzdHJbMF0gPT09ICcxJyA/IDEgOiAwO1xyXG4gICAgY29uc3QgbGVuID0gc3RyLmxlbmd0aCAtIDEgLSBwYXJpdHk7XHJcbiAgICBjb25zdCBhcnJheSA9IG5ldyBVaW50OEFycmF5KGxlbiAqIDIgKyBwYXJpdHkpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkgKz0gMSkge1xyXG4gICAgICAgIGNvbnN0IGNvZGUgPSBzdHIuY2hhckNvZGVBdChpICsgMSk7XHJcbiAgICAgICAgYXJyYXlbaSAqIDIgKyAwXSA9IGNvZGUgPj4gODtcclxuICAgICAgICBhcnJheVtpICogMiArIDFdID0gY29kZSAmIDB4ZmY7XHJcbiAgICB9XHJcbiAgICBpZiAocGFyaXR5ICE9PSAwKVxyXG4gICAgICAgIGFycmF5W2xlbiAqIDJdID0gc3RyLmNoYXJDb2RlQXQobGVuICsgMSkgPj4gODtcclxuICAgIGNvbnN0IGRlY29tcHJlc3NlZCA9IChhd2FpdCBydW5Xb3JrZXIoe1xyXG4gICAgICAgIHR5cGU6ICdkZWNvbXByZXNzJyxcclxuICAgICAgICBkYXRhOiBhcnJheVxyXG4gICAgfSkpLmRhdGEgYXMgVWludDhBcnJheTtcclxuICAgIHJldHVybiBkZWNvbXByZXNzZWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbG9hZExvY2FsRmlsZShuYW1lOiBMb2NhbEZpbGVOYW1lKSB7XHJcbiAgICBjb25zdCBmID0gbG9jYWxGaWxlc1tuYW1lXTtcclxuICAgIGlmIChuYW1lID09PSAnb3N1IS5kYicpXHJcbiAgICAgICAgJCgnI2ZpbHRlci1sb2NhbC1kYXRhJykucHJvcCgnZGlzYWJsZWQnLCBmID09PSB1bmRlZmluZWQpO1xyXG4gICAgJChuYW1lID09PSAnb3N1IS5kYicgPyAnI2N1cnJlbnQtb3N1ZGItZmlsZScgOiAnI2N1cnJlbnQtc2NvcmVzZGItZmlsZScpXHJcbiAgICAgICAgLnRleHQoIWYgPyAnTm8gZGF0YScgOiBmb3JtYXREYXRlKGYudXBsb2FkZWREYXRlKSk7XHJcbiAgICBpZiAoIWYpIHJldHVybjtcclxuICAgIGlmIChuYW1lID09PSAnb3N1IS5kYicpIHtcclxuICAgICAgICBsb2FkT3N1REIoZi5kYXRhLmJ1ZmZlciwgZi51cGxvYWRlZERhdGUpO1xyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGxvYWRGcm9tTG9jYWxTdG9yYWdlKG5hbWU6IExvY2FsRmlsZU5hbWUpIHtcclxuICAgIGNvbnN0IGRhdGVTdHIgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShMT0NBTFNUT1JBR0VfUFJFRklYICsgbmFtZSArICcvdXBsb2FkZWQtZGF0ZScpO1xyXG4gICAgaWYgKCFkYXRlU3RyKSByZXR1cm47XHJcbiAgICBjb25zdCBlbmNvZGVkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oTE9DQUxTVE9SQUdFX1BSRUZJWCArIG5hbWUgKyAnL2RhdGEnKSE7XHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZGVjb21wcmVzc0J1ZmZlckZyb21TdHJpbmcoZW5jb2RlZCk7XHJcbiAgICBjb25zb2xlLmxvZygnZmlsZSAnICsgbmFtZSArICcgbG9hZGVkIGZyb20gbG9jYWxTdG9yYWdlJyk7XHJcbiAgICBsb2NhbEZpbGVzW25hbWVdID0ge1xyXG4gICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgdXBsb2FkZWREYXRlOiBuZXcgRGF0ZShkYXRlU3RyKVxyXG4gICAgfTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2V0TG9jYWxGaWxlKG5hbWU6IExvY2FsRmlsZU5hbWUsIGZpbGU6IEZpbGUpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPihyZXNvbHZlID0+IHtcclxuICAgICAgICBjb25zdCBmciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgZnIub25sb2FkID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmaWxlICcgKyBuYW1lICsgJyBsb2FkZWQnKTtcclxuICAgICAgICAgICAgY29uc3QgYnVmZmVyID0gZnIucmVzdWx0IGFzIEFycmF5QnVmZmVyO1xyXG4gICAgICAgICAgICBjb25zdCB1cGxvYWRlZERhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICBsb2NhbEZpbGVzW25hbWVdID0ge1xyXG4gICAgICAgICAgICAgICAgZGF0YTogbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKSxcclxuICAgICAgICAgICAgICAgIHVwbG9hZGVkRGF0ZTogdXBsb2FkZWREYXRlLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZWxvYWRMb2NhbEZpbGUobmFtZSk7XHJcbiAgICAgICAgICAgIGNvbXByZXNzQnVmZmVyVG9TdHJpbmcoYnVmZmVyKS50aGVuKGRhdGFTdHIgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpbGUgJyArIG5hbWUgKyAnIGNvbXByZXNzZWQnKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSBsb2NhbEZpbGVzW25hbWVdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQgJiYgY3VycmVudC51cGxvYWRlZERhdGUudmFsdWVPZigpICE9PSB1cGxvYWRlZERhdGUudmFsdWVPZigpKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKExPQ0FMU1RPUkFHRV9QUkVGSVggKyBuYW1lICsgJy9kYXRhJywgZGF0YVN0cik7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oTE9DQUxTVE9SQUdFX1BSRUZJWCArIG5hbWUgKyAnL3VwbG9hZGVkLWRhdGUnLCB1cGxvYWRlZERhdGUudG9JU09TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpbGUgJyArIG5hbWUgKyAnIHNhdmVkIHRvIGxvY2FsU3RvcmFnZScpO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2xvY2FsU3RvcmFnZSBlcnJvcjogJywgZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgZnIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuY2xhc3MgU2VyaWFsaXphdGlvblJlYWRlciB7XHJcbiAgICBwcml2YXRlIGR2OiBEYXRhVmlldztcclxuICAgIHByaXZhdGUgb2Zmc2V0OiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYnVmZmVyOiBBcnJheUJ1ZmZlcikge1xyXG4gICAgICAgIHRoaXMuZHYgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcclxuICAgICAgICB0aGlzLm9mZnNldCA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNraXAoYnl0ZXM6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMub2Zmc2V0ICs9IGJ5dGVzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkSW50OCgpIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmR2LmdldEludDgodGhpcy5vZmZzZXQpO1xyXG4gICAgICAgIHRoaXMub2Zmc2V0ICs9IDE7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZEludDE2KCkge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0SW50MTYodGhpcy5vZmZzZXQsIHRydWUpO1xyXG4gICAgICAgIHRoaXMub2Zmc2V0ICs9IDI7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZEludDMyKCkge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0SW50MzIodGhpcy5vZmZzZXQsIHRydWUpO1xyXG4gICAgICAgIHRoaXMub2Zmc2V0ICs9IDQ7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZEJ5dGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZEludDgoKSB8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRVSW50MTYoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZEludDE2KCkgfCAwO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkVUludDMyKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRJbnQzMigpIHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZEJvb2xlYW4oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZEludDgoKSAhPT0gMDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlYWRVTEVCMTI4KCkge1xyXG4gICAgICAgIGxldCByZXN1bHQgPSAwO1xyXG4gICAgICAgIGZvciAobGV0IHNoaWZ0ID0gMDsgOyBzaGlmdCArPSA3KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ5dGUgPSB0aGlzLmR2LmdldFVpbnQ4KHRoaXMub2Zmc2V0KTtcclxuICAgICAgICAgICAgdGhpcy5vZmZzZXQgKz0gMTtcclxuICAgICAgICAgICAgcmVzdWx0IHw9IChieXRlICYgMHg3ZikgPDwgc2hpZnQ7XHJcbiAgICAgICAgICAgIGlmICgoYnl0ZSAmIDB4ODApID09PSAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRVaW50OEFycmF5KGxlbmd0aDogbnVtYmVyKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5kdi5idWZmZXIsIHRoaXMub2Zmc2V0LCBsZW5ndGgpO1xyXG4gICAgICAgIHRoaXMub2Zmc2V0ICs9IGxlbmd0aDtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkU3RyaW5nKCkge1xyXG4gICAgICAgIGNvbnN0IGhlYWRlciA9IHRoaXMucmVhZEludDgoKTtcclxuICAgICAgICBpZiAoaGVhZGVyID09PSAwKVxyXG4gICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gdGhpcy5yZWFkVUxFQjEyOCgpO1xyXG4gICAgICAgIGNvbnN0IGFycmF5ID0gdGhpcy5yZWFkVWludDhBcnJheShsZW5ndGgpO1xyXG4gICAgICAgIHJldHVybiBuZXcgVGV4dERlY29kZXIoJ3V0Zi04JykuZGVjb2RlKGFycmF5KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZEludDY0Um91bmRlZCgpIHtcclxuICAgICAgICBjb25zdCBsbyA9IHRoaXMuZHYuZ2V0VWludDMyKHRoaXMub2Zmc2V0LCB0cnVlKTtcclxuICAgICAgICBjb25zdCBoaSA9IHRoaXMuZHYuZ2V0VWludDMyKHRoaXMub2Zmc2V0ICsgNCwgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gODtcclxuICAgICAgICByZXR1cm4gaGkgKiAweDEwMDAwMDAwMCArIGxvO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkRGF0ZVRpbWUoKSB7XHJcbiAgICAgICAgLy8gT0ZGU0VUID0gNjIxMzU1OTY4MDAwMDAwMDAwID0gdGlja3MgZnJvbSAwMDAxLzEvMSB0byAxOTcwLzEvMVxyXG4gICAgICAgIGxldCBsbyA9IHRoaXMucmVhZFVJbnQzMigpO1xyXG4gICAgICAgIGxldCBoaSA9IHRoaXMucmVhZFVJbnQzMigpO1xyXG4gICAgICAgIGxvIC09IDM0NDQyOTM2MzI7IC8vIGxvIGJpdHMgb2YgT0ZGU0VUXHJcbiAgICAgICAgaWYgKGxvIDwgMCkge1xyXG4gICAgICAgICAgICBsbyArPSA0Mjk0OTY3Mjk2OyAgIC8vIDJeMzJcclxuICAgICAgICAgICAgaGkgLT0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaGkgLT0gMTQ0NjcwNTA4OyAgLy8gaGkgYml0cyBvZiBPRkZTRVRcclxuICAgICAgICBjb25zdCB0aWNrcyA9IGhpICogNDI5NDk2NzI5NiArIGxvO1xyXG4gICAgICAgIHJldHVybiBuZXcgRGF0ZSh0aWNrcyAqIDFlLTQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkU2luZ2xlKCkge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0RmxvYXQzMih0aGlzLm9mZnNldCwgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gNDtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkRG91YmxlKCkge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0RmxvYXQ2NCh0aGlzLm9mZnNldCwgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gODtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkTGlzdChjYWxsYmFjazogKGluZGV4OiBudW1iZXIpID0+IGFueSkge1xyXG4gICAgICAgIGNvbnN0IGNvdW50ID0gdGhpcy5yZWFkSW50MzIoKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpICs9IDEpXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKGkpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBCZWF0bWFwSW5mbyB7XHJcbiAgICBwdWJsaWMgY29uc3RydWN0b3IoXHJcbiAgICAgICAgcHVibGljIHJlYWRvbmx5IGJlYXRtYXBJZDogbnVtYmVyLFxyXG4gICAgICAgIHB1YmxpYyByZWFkb25seSBsYXN0UGxheWVkOiBEYXRlLFxyXG4gICAgICAgIHB1YmxpYyByZWFkb25seSByYW5rQWNoaWV2ZWQ6IG51bWJlcikge31cclxufVxyXG5cclxuZnVuY3Rpb24gcmVhZEJlYXRtYXAoc3I6IFNlcmlhbGl6YXRpb25SZWFkZXIpIHtcclxuICAgIGNvbnN0IFNpemVJbkJ5dGVzID0gc3IucmVhZEludDMyKCk7XHJcblxyXG4gICAgY29uc3QgQXJ0aXN0ID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgQXJ0aXN0VW5pY29kZSA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IFRpdGxlID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgVGl0bGVVbmljb2RlID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgQ3JlYXRvciA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IFZlcnNpb24gPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBBdWRpb0ZpbGVuYW1lID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgQmVhdG1hcENoZWNrc3VtID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgRmlsZW5hbWUgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBTdWJtaXNzaW9uU3RhdHVzID0gc3IucmVhZEJ5dGUoKTtcclxuICAgIGNvbnN0IGNvdW50Tm9ybWFsID0gc3IucmVhZFVJbnQxNigpO1xyXG4gICAgY29uc3QgY291bnRTbGlkZXIgPSBzci5yZWFkVUludDE2KCk7XHJcbiAgICBjb25zdCBjb3VudFNwaW5uZXIgPSBzci5yZWFkVUludDE2KCk7XHJcbiAgICBjb25zdCBEYXRlTW9kaWZpZWQgPSBzci5yZWFkRGF0ZVRpbWUoKTtcclxuXHJcbiAgICBjb25zdCBEaWZmaWN1bHR5QXBwcm9hY2hSYXRlID0gc3IucmVhZFNpbmdsZSgpO1xyXG4gICAgY29uc3QgRGlmZmljdWx0eUNpcmNsZVNpemUgPSBzci5yZWFkU2luZ2xlKCk7XHJcbiAgICBjb25zdCBEaWZmaWN1bHR5SHBEcmFpblJhdGUgPSBzci5yZWFkU2luZ2xlKCk7XHJcbiAgICBjb25zdCBEaWZmaWN1bHR5T3ZlcmFsbCA9IHNyLnJlYWRTaW5nbGUoKTtcclxuXHJcbiAgICBjb25zdCBEaWZmaWN1bHR5U2xpZGVyTXVsdGlwbGllciA9IHNyLnJlYWREb3VibGUoKTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkgKz0gMSkge1xyXG4gICAgICAgIHNyLnJlYWRMaXN0KCgpID0+IHtcclxuICAgICAgICAgICAgc3IucmVhZEludDMyKCk7XHJcbiAgICAgICAgICAgIHNyLnJlYWRJbnQxNigpO1xyXG4gICAgICAgICAgICBzci5yZWFkRG91YmxlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgRHJhaW5MZW5ndGggPSBzci5yZWFkSW50MzIoKTtcclxuICAgIGNvbnN0IFRvdGFsTGVuZ3RoID0gc3IucmVhZEludDMyKCk7XHJcbiAgICBjb25zdCBQcmV2aWV3VGltZSA9IHNyLnJlYWRJbnQzMigpO1xyXG4gICAgc3IucmVhZExpc3QoKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IEJlYXRMZW5ndGggPSBzci5yZWFkRG91YmxlKCk7XHJcbiAgICAgICAgY29uc3QgT2Zmc2V0ID0gc3IucmVhZERvdWJsZSgpO1xyXG4gICAgICAgIGNvbnN0IFRpbWluZ0NoYW5nZSA9IHNyLnJlYWRCb29sZWFuKCk7XHJcbiAgICB9KTtcclxuICAgIGNvbnN0IEJlYXRtYXBJZCA9IHNyLnJlYWRJbnQzMigpO1xyXG4gICAgY29uc3QgQmVhdG1hcFNldElkID0gc3IucmVhZEludDMyKCk7XHJcbiAgICBjb25zdCBCZWF0bWFwVG9waWNJZCA9IHNyLnJlYWRJbnQzMigpO1xyXG4gICAgY29uc3QgUGxheWVyUmFua09zdSA9IHNyLnJlYWRCeXRlKCk7XHJcbiAgICBjb25zdCBQbGF5ZXJSYW5rRnJ1aXRzID0gc3IucmVhZEJ5dGUoKTtcclxuICAgIGNvbnN0IFBsYXllclJhbmtUYWlrbyA9IHNyLnJlYWRCeXRlKCk7XHJcbiAgICBjb25zdCBQbGF5ZXJSYW5rTWFuaWEgPSBzci5yZWFkQnl0ZSgpO1xyXG4gICAgY29uc3QgUGxheWVyT2Zmc2V0ID0gc3IucmVhZEludDE2KCk7XHJcbiAgICBjb25zdCBTdGFja0xlbmllbmN5ID0gc3IucmVhZFNpbmdsZSgpO1xyXG4gICAgY29uc3QgUGxheU1vZGUgPSBzci5yZWFkQnl0ZSgpO1xyXG4gICAgY29uc3QgU291cmNlID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgVGFncyA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IE9ubGluZU9mZnNldCA9IHNyLnJlYWRJbnQxNigpO1xyXG4gICAgY29uc3QgT25saW5lRGlzcGxheVRpdGxlID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgTmV3RmlsZSA9IHNyLnJlYWRCb29sZWFuKCk7XHJcbiAgICBjb25zdCBEYXRlTGFzdFBsYXllZCA9IHNyLnJlYWREYXRlVGltZSgpO1xyXG4gICAgY29uc3QgSW5Pc3pDb250YWluZXIgPSBzci5yZWFkQm9vbGVhbigpO1xyXG4gICAgY29uc3QgQ29udGFpbmluZ0ZvbGRlckFic29sdXRlID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgTGFzdEluZm9VcGRhdGUgPSBzci5yZWFkRGF0ZVRpbWUoKTtcclxuICAgIGNvbnN0IERpc2FibGVTYW1wbGVzID0gc3IucmVhZEJvb2xlYW4oKTtcclxuICAgIGNvbnN0IERpc2FibGVTa2luID0gc3IucmVhZEJvb2xlYW4oKTtcclxuICAgIGNvbnN0IERpc2FibGVTdG9yeWJvYXJkID0gc3IucmVhZEJvb2xlYW4oKTtcclxuICAgIGNvbnN0IERpc2FibGVWaWRlbyA9IHNyLnJlYWRCb29sZWFuKCk7XHJcbiAgICBjb25zdCBWaXN1YWxTZXR0aW5nc092ZXJyaWRlID0gc3IucmVhZEJvb2xlYW4oKTtcclxuXHJcbiAgICBjb25zdCBMYXN0RWRpdFRpbWUgPSBzci5yZWFkSW50MzIoKTtcclxuICAgIGNvbnN0IE1hbmlhU3BlZWQgPSBzci5yZWFkQnl0ZSgpO1xyXG5cclxuICAgIHJldHVybiBuZXcgQmVhdG1hcEluZm8oXHJcbiAgICAgICAgQmVhdG1hcElkLFxyXG4gICAgICAgIG5ldyBEYXRlKE1hdGgubWF4KE1JTklNVU1fREFURS52YWx1ZU9mKCksIERhdGVMYXN0UGxheWVkLnZhbHVlT2YoKSkpLFxyXG4gICAgICAgIFBsYXllclJhbmtGcnVpdHMpO1xyXG59XHJcblxyXG5jb25zdCBiZWF0bWFwSW5mb01hcCA9IG5ldyBNYXA8bnVtYmVyLCBCZWF0bWFwSW5mbz4oKTtcclxubGV0IGJlYXRtYXBJbmZvTWFwVmVyc2lvbiA9IE1JTklNVU1fREFURTtcclxuXHJcbmZ1bmN0aW9uIGxvYWRPc3VEQihidWZmZXI6IEFycmF5QnVmZmVyLCB2ZXJzaW9uOiBEYXRlKSB7XHJcbiAgICBiZWF0bWFwSW5mb01hcC5jbGVhcigpO1xyXG4gICAgY29uc3Qgc3IgPSBuZXcgU2VyaWFsaXphdGlvblJlYWRlcihidWZmZXIpO1xyXG4gICAgc3Iuc2tpcCg0ICsgNCArIDEgKyA4KTtcclxuICAgIHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IGJlYXRtYXBDb3VudCA9IHNyLnJlYWRJbnQzMigpO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmVhdG1hcENvdW50OyBpICs9IDEpIHtcclxuICAgICAgICBjb25zdCBiZWF0bWFwID0gcmVhZEJlYXRtYXAoc3IpO1xyXG4gICAgICAgIGlmIChiZWF0bWFwLmJlYXRtYXBJZCA+IDApXHJcbiAgICAgICAgICAgIGJlYXRtYXBJbmZvTWFwLnNldChiZWF0bWFwLmJlYXRtYXBJZCwgYmVhdG1hcCk7XHJcbiAgICB9XHJcblxyXG4gICAgYmVhdG1hcEluZm9NYXBWZXJzaW9uID0gdmVyc2lvbjtcclxufVxyXG5cclxuJCgoKSA9PiB7XHJcbiAgICBQcm9taXNlLmFsbChcclxuICAgICAgICAoWydvc3UhLmRiJywgJ3Njb3Jlcy5kYiddIGFzIExvY2FsRmlsZU5hbWVbXSlcclxuICAgICAgICAgICAgLm1hcChuYW1lID0+XHJcbiAgICAgICAgICAgICAgICBsb2FkRnJvbUxvY2FsU3RvcmFnZShuYW1lKVxyXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHJlbG9hZExvY2FsRmlsZShuYW1lKSkpKS50aGVuKCgpID0+IHtcclxuICAgICAgICBpZiAoaW5pdFVuc29ydGVkVGFibGVSb3dzKCkpXHJcbiAgICAgICAgICAgIGRyYXdUYWJsZUZvckN1cnJlbnRGaWx0ZXJpbmcoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHNldFF1ZXJ5QWNjb3JkaW5nVG9IYXNoKCk7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsICgpID0+IHtcclxuICAgICAgICBzZXRRdWVyeUFjY29yZGluZ1RvSGFzaCgpO1xyXG4gICAgICAgIGRyYXdUYWJsZUZvckN1cnJlbnRGaWx0ZXJpbmcoKTtcclxuICAgIH0pO1xyXG4gICAgY29uc3Qgb25DaGFuZ2UgPSAoKSA9PiB7XHJcbiAgICAgICAgZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpO1xyXG4gICAgfTtcclxuICAgIGZvciAoY29uc3QgaWQgb2YgWydmaWx0ZXItYXBwcm92ZWQtc3RhdHVzJywgJ2ZpbHRlci1tb2RlJywgJ2ZpbHRlci1mYy1sZXZlbCcsICdmaWx0ZXItbG9jYWwtZGF0YScsICdzaG93LWZ1bGwtcmVzdWx0J10pXHJcbiAgICAgICAgJChgIyR7aWR9YCkub24oJ2NoYW5nZScsIG9uQ2hhbmdlKTtcclxuICAgIGZvciAoY29uc3QgaWQgb2YgWydmaWx0ZXItc2VhcmNoLXF1ZXJ5J10pXHJcbiAgICAgICAgJChgIyR7aWR9YCkub24oJ2lucHV0Jywgb25DaGFuZ2UpO1xyXG5cclxuICAgIGNvbnN0IHRoTGlzdCA9ICQoJyNzdW1tYXJ5LXRhYmxlID4gdGhlYWQgPiB0ciA+IHRoJyk7XHJcbiAgICBzb3J0S2V5cy5mb3JFYWNoKChfLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICQuZGF0YSh0aExpc3RbaW5kZXhdLCAndGhJbmRleCcsIGluZGV4KTtcclxuICAgIH0pO1xyXG4gICAgY29uc3QgbG9hZERhdGEgPSAoZGF0YTogU3VtbWFyeVJvd0RhdGFbXSwgbGFzdE1vZGlmaWVkOiBEYXRlKSA9PiB7XHJcbiAgICAgICAgJCgnI2xhc3QtdXBkYXRlLXRpbWUnKVxyXG4gICAgICAgICAgICAuYXBwZW5kKCQoJzx0aW1lPicpXHJcbiAgICAgICAgICAgICAgICAuYXR0cignZGF0ZXRpbWUnLCBsYXN0TW9kaWZpZWQudG9JU09TdHJpbmcoKSlcclxuICAgICAgICAgICAgICAgIC50ZXh0KGxhc3RNb2RpZmllZC50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF0pKTtcclxuICAgICAgICBzdW1tYXJ5Um93cyA9IGRhdGEubWFwKHggPT4gbmV3IFN1bW1hcnlSb3coeCkpO1xyXG4gICAgICAgIGluaXRVbnNvcnRlZFRhYmxlUm93cygpO1xyXG4gICAgICAgIGRyYXdUYWJsZUZvckN1cnJlbnRGaWx0ZXJpbmcoKTtcclxuICAgICAgICAkKCcjc3VtbWFyeS10YWJsZS1sb2FkZXInKS5oaWRlKCk7XHJcbiAgICB9O1xyXG4gICAgJC5nZXRKU09OKCdkYXRhL3N1bW1hcnkuanNvbicpLnRoZW4oKGRhdGEsIF8sIHhocikgPT4ge1xyXG4gICAgICAgIGxvYWREYXRhKGRhdGEsIG5ldyBEYXRlKHhoci5nZXRSZXNwb25zZUhlYWRlcignTGFzdC1Nb2RpZmllZCcpIGFzIHN0cmluZykpO1xyXG4gICAgfSk7XHJcbiAgICB0aExpc3QuY2xpY2soKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgY29uc3QgdGggPSAkKGV2ZW50LnRhcmdldCk7XHJcbiAgICAgICAgbGV0IHNpZ247XHJcbiAgICAgICAgaWYgKHRoLmhhc0NsYXNzKCdzb3J0ZWQnKSlcclxuICAgICAgICAgICAgc2lnbiA9IHRoLmhhc0NsYXNzKCdkZXNjZW5kaW5nJykgPyAxIDogLTE7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBzaWduID0gdGguaGFzQ2xhc3MoJ2Rlc2MtZmlyc3QnKSA/IC0xIDogMTtcclxuICAgICAgICBjb25zdCB0aEluZGV4ID0gdGguZGF0YSgndGhJbmRleCcpIGFzIG51bWJlcjtcclxuICAgICAgICBjdXJyZW50U29ydE9yZGVyLnB1c2goKHRoSW5kZXggKyAxKSAqIHNpZ24pO1xyXG4gICAgICAgIGN1cnJlbnRTb3J0T3JkZXIgPSBzaW1wbHlTb3J0T3JkZXIoY3VycmVudFNvcnRPcmRlcik7XHJcbiAgICAgICAgc2V0VGFibGVIZWFkU29ydGluZ01hcmsoKTtcclxuICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XHJcbiAgICB9KTtcclxuICAgICQoJyNkYi1maWxlLWlucHV0JykuY2hhbmdlKGFzeW5jIGV2ZW50ID0+IHtcclxuICAgICAgICBjb25zdCBlbGVtID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQ7XHJcbiAgICAgICAgaWYgKCFlbGVtLmZpbGVzKSByZXR1cm47XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbGVtLmZpbGVzLmxlbmd0aDsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBlbGVtLmZpbGVzW2ldO1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZmlsZS5uYW1lO1xyXG4gICAgICAgICAgICBpZiAobmFtZS5pbmRleE9mKCdvc3UhLmRiJykgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBzZXRMb2NhbEZpbGUoJ29zdSEuZGInLCBmaWxlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChuYW1lLmluZGV4T2YoJ3Njb3Jlcy5kYicpICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgc2V0TG9jYWxGaWxlKCdzY29yZXMuZGInLCBmaWxlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNob3dFcnJvck1lc3NhZ2UoYEludmFsaWQgZmlsZSAke25hbWV9OiBQbGVhc2Ugc2VsZWN0IG9zdSEuZGIgb3Igc2NvcmVzLmRiYCk7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaW5pdFVuc29ydGVkVGFibGVSb3dzKCkpXHJcbiAgICAgICAgICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsZW0udmFsdWUgPSAnJztcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbn1cclxuIl19