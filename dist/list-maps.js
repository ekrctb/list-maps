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
            this.approved_status = data[0], this.approved_date_string = data[1], this.mode = data[2], this.beatmap_id = data[3], this.beatmapset_id = data[4], this.display_string = data[5], this.stars = data[6], this.pp = data[7], this.hit_length = data[8], this.max_combo = data[9], this.approach_rate = data[10], this.circle_size = data[11], this.min_misses = data[12], this.fcNM = data[13], this.fcHD = data[14], this.fcHR = data[15], this.fcHDHR = data[16], this.fcDT = data[17], this.fcHDDT = data[18];
            this.beatmap_id_number = parseInt(this.beatmap_id);
            this.approved_date = new Date(this.approved_date_string.replace(' ', 'T') + '+08:00');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1tYXBzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpc3QtbWFwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFVLFFBQVEsQ0EyMUJqQjtBQTMxQkQsV0FBVSxRQUFROztJQWVsQixJQUFNLFlBQVksR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqQztRQXdCSSxvQkFBNkIsSUFBb0I7WUFBcEIsU0FBSSxHQUFKLElBQUksQ0FBZ0I7WUFFekMsOEJBQW9CLEVBQ3BCLG1DQUF5QixFQUN6QixtQkFBUyxFQUNULHlCQUFlLEVBQ2YsNEJBQWtCLEVBQ2xCLDZCQUFtQixFQUNuQixvQkFBVSxFQUNWLGlCQUFPLEVBQ1AseUJBQWUsRUFDZix3QkFBYyxFQUNkLDZCQUFrQixFQUNsQiwyQkFBZ0IsRUFDaEIsMEJBQWUsRUFDZixvQkFBUyxFQUNULG9CQUFTLEVBQ1Qsb0JBQVMsRUFDVCxzQkFBVyxFQUNYLG9CQUFTLEVBQ1Qsc0JBQVcsQ0FDTjtZQUNULElBQUksQ0FBQyxpQkFBaUIsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUM7WUFDdEYsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDOUQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDckIsQ0FBQztRQUNMLGlCQUFDO0lBQUQsQ0FBQyxBQW5ERCxJQW1EQztJQUVELElBQUksV0FBVyxHQUFpQixFQUFFLENBQUM7SUFDbkMsSUFBSSxpQkFBaUIsR0FBMEIsRUFBRSxDQUFDO0lBQ2xELElBQUksZ0JBQWdCLEdBQWEsRUFBRSxDQUFDO0lBQ3BDLElBQUksZUFBZSxHQUFHLEdBQUcsQ0FBQztJQUUxQixJQUFJLGVBQWUsR0FBRyxFQUFFLENBQUM7SUFDekIsSUFBSSx3QkFBd0IsR0FBRyxLQUFLLENBQUM7SUFDckMsbUJBQW1CLE9BQWlCO1FBQ2hDLElBQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsRUFBRSxDQUFDLENBQUMsQ0FBQyx3QkFBd0IsSUFBSSxlQUFlLEtBQUssR0FBRyxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBQ2pFLHdCQUF3QixHQUFHLEtBQUssQ0FBQztRQUNqQyxlQUFlLEdBQUcsR0FBRyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQzthQUN0QixLQUFLLEVBQUU7YUFDUCxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFBLEtBQUssSUFBSSxPQUFBLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxFQUF4QixDQUF3QixDQUFDLENBQUMsQ0FBQztJQUNoRSxDQUFDO0lBRUQ7UUFHSSxxQkFBNEIsTUFBYztZQUFkLFdBQU0sR0FBTixNQUFNLENBQVE7WUFDdEMsSUFBTSxvQkFBb0IsR0FBRztnQkFDekIsUUFBUSxFQUFFLGtDQUFrQztnQkFDNUMsTUFBTSxFQUFFLGtCQUFrQjtnQkFDMUIsT0FBTyxFQUFFLFdBQVc7Z0JBQ3BCLElBQUksRUFBRSxRQUFRO2dCQUNkLFFBQVEsRUFBRSxnQkFBZ0I7Z0JBQzFCLE9BQU8sRUFBRSxlQUFlO2dCQUN4QixJQUFJLEVBQUUsbUJBQW1CO2dCQUN6QixJQUFJLEVBQUUsaUJBQWlCO2dCQUN2QixRQUFRLEVBQUUsMEJBQXdCLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLHdDQUFtQyxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLE1BQUc7Z0JBQzlHLFVBQVUsRUFBRSxnREFBOEMsWUFBWSxDQUFDLE9BQU8sRUFBRSxhQUFVO2dCQUMxRixNQUFNLEVBQUUsTUFBSSxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxzQ0FBaUMsR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBSTtnQkFDckYsTUFBTSxFQUFFLE1BQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyx1REFBb0Q7YUFDcEcsQ0FBQztZQUNGLElBQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQ3RCLE1BQU0sQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGdDQUNsQixDQUFDLENBQUM7WUFDL0IsSUFBSSxpQkFBaUIsR0FBRyxhQUFhLENBQUM7WUFDdEMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztZQUM1QixHQUFHLENBQUMsQ0FBZ0IsVUFBaUIsRUFBakIsS0FBQSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFqQixjQUFpQixFQUFqQixJQUFpQjtnQkFBaEMsSUFBTSxLQUFLLFNBQUE7Z0JBQ1osSUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUM3QixFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUFDLFFBQVEsQ0FBQztnQkFDN0IsSUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDUixJQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3JCLElBQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMvQyxJQUFJLEdBQUcsR0FBb0IsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNoRCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ1gsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDakMsSUFBTSxJQUFJLEdBQUksb0JBQTRCLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2hELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxFQUFFLENBQUM7d0JBQUMsSUFBSSxDQUFDLGlCQUFpQixJQUFJLEdBQUcsQ0FBQztvQkFDakUsSUFBSSxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN6RCxpQkFBaUIsSUFBSSxPQUFLLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUcsQ0FBQztnQkFDakUsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDSixJQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2xDLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3BDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxFQUFFLENBQUM7d0JBQUMsSUFBSSxDQUFDLGlCQUFpQixJQUFJLEdBQUcsQ0FBQztvQkFDakUsSUFBSSxDQUFDLGlCQUFpQixJQUFJLEdBQUcsQ0FBQztvQkFDOUIsaUJBQWlCLElBQUksd0NBQXNDLE9BQU8sV0FBUSxDQUFDO2dCQUMvRSxDQUFDO2FBQ0o7WUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssRUFBRSxpQkFBaUIsQ0FBUSxDQUFDO1FBQy9ELENBQUM7UUFDTCxrQkFBQztJQUFELENBQUMsQUEvQ0QsSUErQ0M7SUFFRCxJQUFNLFFBQVEsR0FBRztRQUNiLFVBQUMsQ0FBYSxJQUFLLE9BQUEsQ0FBQyxDQUFDLG9CQUFvQixFQUF0QixDQUFzQjtRQUN6QyxVQUFDLENBQWEsSUFBSyxPQUFBLENBQUMsQ0FBQyxjQUFjLEVBQWhCLENBQWdCO1FBQ25DLFVBQUMsQ0FBYSxJQUFLLE9BQUEsQ0FBQyxDQUFDLEtBQUssRUFBUCxDQUFPO1FBQzFCLFVBQUMsQ0FBYSxJQUFLLE9BQUEsQ0FBQyxDQUFDLEVBQUUsRUFBSixDQUFJO1FBQ3ZCLFVBQUMsQ0FBYSxJQUFLLE9BQUEsQ0FBQyxDQUFDLFVBQVUsRUFBWixDQUFZO1FBQy9CLFVBQUMsQ0FBYSxJQUFLLE9BQUEsQ0FBQyxDQUFDLFNBQVMsRUFBWCxDQUFXO1FBQzlCLFVBQUMsQ0FBYSxJQUFLLE9BQUEsQ0FBQyxDQUFDLGFBQWEsRUFBZixDQUFlO1FBQ2xDLFVBQUMsQ0FBYSxJQUFLLE9BQUEsQ0FBQyxDQUFDLFdBQVcsRUFBYixDQUFhO1FBQ2hDLFVBQUMsQ0FBYTtZQUNWLE9BQUEsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxHQUFHO2dCQUMzQixDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLEdBQUc7Z0JBQzNCLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJO2dCQUNuQixDQUFDLENBQUMsVUFBVTtRQUhaLENBR1k7UUFDaEIsVUFBQyxDQUFhLElBQUssT0FBQSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQTlELENBQThEO0tBQ3BGLENBQUM7SUFFRix5QkFBeUIsR0FBK0I7UUFDcEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO2FBQ2xCLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsR0FBRyxHQUFHLEdBQUcsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQXBDLENBQW9DLENBQUM7YUFDOUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLENBQUM7SUFFRCxxQkFBcUIsR0FBVztRQUM1QixJQUFNLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDZixHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLElBQUk7WUFDdkIsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN2QyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUM7Z0JBQ0wsR0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlELENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxDQUFDLEdBQUcsQ0FBQztJQUNmLENBQUM7SUFFRDtRQUNJLElBQU0sc0JBQXNCLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLEdBQUcsRUFBWSxDQUFDLENBQUM7UUFDdEYsSUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLEVBQVksQ0FBQyxDQUFDO1FBQ2hFLElBQU0sbUJBQW1CLEdBQUcsSUFBSSxXQUFXLENBQUUsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsR0FBRyxFQUFhLENBQUMsQ0FBQztRQUN6RixJQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsR0FBRyxFQUFZLENBQUMsQ0FBQztRQUN4RSxJQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxHQUFHLEVBQVksQ0FBQyxDQUFDO1FBQzVFLElBQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRWhFLElBQU0sWUFBWSxHQUFHLFVBQUMsR0FBZTtZQUNqQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQztnQkFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ25DLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO2dCQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDakQsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7Z0JBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNyRixFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQztnQkFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQy9DLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDO2dCQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDN0IsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7Z0JBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNqRCxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztnQkFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDYixDQUFDLENBQUM7UUFFRixJQUFNLG9CQUFvQixHQUFHLFVBQUMsR0FBZTtZQUN6QyxFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQztnQkFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ2QsSUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUN2RCxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLEtBQUssSUFBSSxDQUFDLENBQUM7WUFDWCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxLQUFLLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDckQsS0FBSyxJQUFJLENBQUMsQ0FBQztZQUNmLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDakIsQ0FBQyxDQUFDO1FBRUYsZUFBZSxHQUFHLEdBQUcsQ0FBQztRQUN0QixJQUFNLEdBQUcsR0FBRyxFQUFnQyxDQUFDO1FBQzdDLEVBQUUsQ0FBQyxDQUFDLHNCQUFzQixLQUFLLENBQUMsQ0FBQztZQUM3QixHQUFHLENBQUMsQ0FBQyxHQUFHLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsS0FBSyxDQUFDLENBQUM7WUFDbEIsR0FBRyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbkMsRUFBRSxDQUFDLENBQUMsbUJBQW1CLENBQUMsaUJBQWlCLEtBQUssRUFBRSxDQUFDO1lBQzdDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsbUJBQW1CLENBQUMsaUJBQWlCLENBQUM7UUFDbEQsRUFBRSxDQUFDLENBQUMsZUFBZSxLQUFLLENBQUMsQ0FBQztZQUN0QixHQUFHLENBQUMsQ0FBQyxHQUFHLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN2QyxFQUFFLENBQUMsQ0FBQyxpQkFBaUIsS0FBSyxDQUFDLENBQUM7WUFDeEIsR0FBRyxDQUFDLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN6QyxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO1lBQzlCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDO1lBQ2pCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBRWhCLGVBQWUsSUFBSSxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDeEMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsUUFBUSxHQUFHLENBQUMsZUFBZSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBRS9HLElBQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBQyxDQUFDLEVBQUUsS0FBSyxJQUFLLE9BQUEsS0FBSyxFQUFMLENBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFBLEtBQUs7WUFDN0QsSUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRS9CLEVBQUUsQ0FBQyxDQUFDLHNCQUFzQixLQUFLLENBQUM7Z0JBQzVCLENBQUMsR0FBRyxDQUFDLGVBQWUsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLGVBQWUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDekQsTUFBTSxDQUFDLEtBQUssQ0FBQztZQUNqQixFQUFFLENBQUMsQ0FBQyxzQkFBc0IsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLGVBQWUsS0FBSyxDQUFDLENBQUM7Z0JBQzFELE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFFakIsRUFBRSxDQUFDLENBQUMsV0FBVyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQztnQkFDcEMsTUFBTSxDQUFDLEtBQUssQ0FBQztZQUNqQixFQUFFLENBQUMsQ0FBQyxXQUFXLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDO2dCQUNwQyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBRWpCLEVBQUUsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBRWpCLEVBQUUsQ0FBQyxDQUFDLGVBQWUsS0FBSyxDQUFDLElBQUksWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLGVBQWUsQ0FBQztnQkFDL0QsTUFBTSxDQUFDLEtBQUssQ0FBQztZQUVqQixFQUFFLENBQUMsQ0FBQyxpQkFBaUIsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixJQUFNLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEMsTUFBTSxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO29CQUN4QixLQUFLLENBQUM7d0JBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7d0JBQUMsS0FBSyxDQUFDO29CQUNuRCxLQUFLLENBQUM7d0JBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7d0JBQUMsS0FBSyxDQUFDO29CQUNuRCxLQUFLLENBQUM7d0JBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7d0JBQUMsS0FBSyxDQUFDO29CQUNuRCxLQUFLLENBQUM7d0JBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7d0JBQUMsS0FBSyxDQUFDO29CQUNuRCxLQUFLLENBQUM7d0JBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7d0JBQUMsS0FBSyxDQUFDO2dCQUN2RCxDQUFDO1lBQ0wsQ0FBQztZQUVELE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQyxDQUFDLENBQUM7Z0NBRVEsR0FBRztZQUNWLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7a0NBQVU7WUFDeEIsSUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSyxPQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQWhCLENBQWdCLENBQUMsQ0FBQztZQUM1QyxJQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM1QyxJQUFNLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlCLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLEVBQUUsQ0FBQztnQkFDZCxJQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLElBQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUUsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBWEQsR0FBRyxDQUFDLENBQWMsVUFBZ0IsRUFBaEIscUNBQWdCLEVBQWhCLDhCQUFnQixFQUFoQixJQUFnQjtZQUE3QixJQUFNLEdBQUcseUJBQUE7b0JBQUgsR0FBRztTQVdiO1FBRUQsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDO1FBQzdGLElBQU0sWUFBWSxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztRQUN2RCxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQztZQUM5QixPQUFPLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQztRQUVsQyxDQUFDLENBQUMsaUNBQWlDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBRW5FLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBRUQseUJBQXlCLEtBQWU7UUFDcEMsSUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ2YsSUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNwQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUcsQ0FBQyxFQUFFLENBQUM7WUFDMUMsSUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25CLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQUMsUUFBUSxDQUFDO1lBQ3RCLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25ELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFBQyxRQUFRLENBQUM7WUFDeEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztZQUNqQixHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ1osRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQzFDLEtBQUssQ0FBQztRQUNkLENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMvQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDZCxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDZCxNQUFNLENBQUMsR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUVEO1FBQ0ksSUFBSSxHQUE2QixDQUFDO1FBQ2xDLElBQUksQ0FBQztZQUNELEdBQUcsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNULEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDYixDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUM7WUFBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUNyQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQztZQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQ3JDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDO1lBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDcEMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUM7WUFBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUNyQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQztZQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3BDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDO1lBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDckMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUM7WUFBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUNyQyxDQUFDLENBQUMseUJBQXlCLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRCxnQkFBZ0IsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBaEIsQ0FBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDaEYsdUJBQXVCLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBRUQ7UUFDSSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFDeEQsSUFBTSxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhO1lBQ2xCLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNsRCxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQyxDQUFDLGtDQUFrQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDMUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFFRCxhQUFhLENBQVM7UUFDbEIsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVELG9CQUFvQixJQUFVO1FBQzFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQyxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMxQixHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFRCxJQUFNLGlCQUFpQixHQUFHO1FBQ3RCLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHO1FBQzNCLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHO0tBQzFCLENBQUM7SUFFRixJQUFJLHlCQUF5QixHQUFHLFlBQVksQ0FBQztJQUM3QztRQUNJLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFFakIsRUFBRSxDQUFDLENBQUMsaUJBQWlCLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSx5QkFBeUIsS0FBSyxxQkFBcUIsQ0FBQztZQUN0RixNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ2pCLHlCQUF5QixHQUFHLHFCQUFxQixDQUFDO1FBQ2xELEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixXQUFXLENBQUMsT0FBTyxDQUFDLFVBQUEsR0FBRztnQkFDbkIsSUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztnQkFDdkQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUNMLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUVELElBQU0sVUFBVSxHQUFHO1lBQ2YsZ0JBQWdCO1lBQ2hCLEVBQUU7WUFDRixZQUFZO1lBQ1osRUFBRTtTQUNMLENBQUM7UUFDRixJQUFNLHFCQUFxQixHQUFHO1lBQzFCLGdCQUFnQjtZQUNoQixnQkFBZ0I7WUFDaEIsZ0JBQWdCO1lBQ2hCLDBCQUEwQjtZQUMxQixZQUFZO1lBQ1osYUFBYTtZQUNiLGVBQWU7U0FDbEIsQ0FBQztRQUNGLGlCQUFpQixHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBQSxHQUFHO1lBQ25DLE9BQUEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQztnQkFDYjtvQkFDSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ2pFLFFBQVEsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDbEU7Z0JBQ0Q7b0JBQ0ksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN2QyxDQUFDLENBQUMsS0FBSyxDQUFDO3lCQUNILElBQUksQ0FBQyxNQUFNLEVBQUUsMEJBQXdCLEdBQUcsQ0FBQyxVQUFVLFNBQU0sQ0FBQzt5QkFDMUQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUM7b0JBQzdCLEdBQUcsQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLE1BQU0sQ0FBQzt3QkFDOUQsQ0FBQyxDQUFDLGdDQUFnQyxDQUFDOzZCQUM5QixJQUFJLENBQUMsTUFBTSxFQUFFLDRCQUEwQixHQUFHLENBQUMsYUFBYSxTQUFNLENBQUM7d0JBQ3BFLENBQUMsQ0FBQywrQkFBK0IsQ0FBQzs2QkFDN0IsSUFBSSxDQUFDLE1BQU0sRUFBRSwwQkFBd0IsR0FBRyxDQUFDLGFBQWEsTUFBRyxDQUFDO3dCQUMvRCxDQUFDLENBQUMscUNBQXFDLENBQUM7NkJBQ25DLElBQUksQ0FBQyxNQUFNLEVBQUUsY0FBWSxHQUFHLENBQUMsYUFBZSxDQUFDO3FCQUNyRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtpQkFDWDtnQkFDRCxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDZCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDLFNBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsQ0FBRztnQkFDNUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUU7Z0JBQ3hCLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDNUIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixHQUFHLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZGLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUMvRSxjQUFjLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzVCO3dCQUNJLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO3dCQUM1RSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQzt3QkFDeEYsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FDWixDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLEtBQUssWUFBWSxDQUFDLE9BQU8sRUFBRTs0QkFDakUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQzVDO3FCQUNSO2FBQ0osQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFuQixDQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQXdCO1FBcEMxRCxDQW9DMEQsQ0FBQyxDQUFDO1FBRWhFLHdCQUF3QixHQUFHLElBQUksQ0FBQztRQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCwwQkFBMEIsSUFBWTtRQUNsQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUNmLENBQUMsQ0FBQyxxREFBcUQsQ0FBQzthQUNuRCxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQ1YsTUFBTSxDQUFDLHFEQUFxRCxDQUFDLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBRUQsSUFBTSxtQkFBbUIsR0FBRyxZQUFZLENBQUM7SUFNekMsSUFBTSxVQUFVLEdBR1osRUFBRSxDQUFDO0lBRVA7Ozs7Ozs7Ozs7O01BV0U7SUFFRixJQUFNLHFCQUFxQixHQUFHLElBQUksR0FBRyxFQUE4QixDQUFDO0lBQ3BFLDBCQUEwQixRQUE0QjtRQUNsRCxJQUFJLEVBQUUsQ0FBQztRQUNQO1lBQ0ksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztlQUNoQixxQkFBcUIsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7UUFDdEMscUJBQXFCLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN4QyxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ2QsQ0FBQztJQUVEO1FBQ0ksTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLDBCQUEwQixDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVELG1CQUF5QixPQUFlLEVBQUUsS0FBYzs7O2dCQUNwRCxzQkFBTyxJQUFJLE9BQU8sQ0FBTSxVQUFBLE9BQU87d0JBQzNCLElBQU0sTUFBTSxHQUFHLEtBQUssSUFBSSxTQUFTLEVBQUUsQ0FBQzt3QkFDbkMsT0FBZSxDQUFDLEVBQUUsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDNUIsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxVQUFDLEtBQW1COzRCQUNuRCxJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDOzRCQUN4QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFVBQVUsSUFBSSxPQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0NBQzNELElBQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Z0NBQ3BELEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7b0NBQ1gscUJBQXFCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztvQ0FDdEMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2dDQUNuQixDQUFDOzRCQUNMLENBQUM7d0JBQ0wsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUNkLENBQUMsQ0FBQyxFQUFDOzs7S0FDTjtJQUVELGdDQUE2QyxNQUFtQjs7Ozs7NEJBQ3hDLHFCQUFNLFNBQVMsQ0FBQzs0QkFDaEMsSUFBSSxFQUFFLFVBQVU7NEJBQ2hCLElBQUksRUFBRSxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUM7eUJBQy9CLENBQUMsRUFBQTs7d0JBSEksVUFBVSxHQUFHLENBQUMsU0FHbEIsQ0FBQyxDQUFDLElBQWtCO3dCQUNoQixLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzNELEdBQUcsQ0FBQyxDQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDOzRCQUNqQyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQzs0QkFDbEYsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ3pDLENBQUM7d0JBQ0csR0FBRyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQzt3QkFDNUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQ3RCLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQzs0QkFDNUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDaEYsc0JBQU8sR0FBRyxFQUFDOzs7O0tBQ2Q7SUFmcUIsK0JBQXNCLHlCQWUzQyxDQUFBO0lBRUQsb0NBQWlELEdBQVc7Ozs7Ozt3QkFDbEQsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNoQyxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDO3dCQUM5QixLQUFLLEdBQUcsSUFBSSxVQUFVLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQzt3QkFDL0MsR0FBRyxDQUFDLENBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzs0QkFDeEIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDOzRCQUNuQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDOzRCQUM3QixLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDO3dCQUNuQyxDQUFDO3dCQUNELEVBQUUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7NEJBQ2IsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQzVCLHFCQUFNLFNBQVMsQ0FBQztnQ0FDbEMsSUFBSSxFQUFFLFlBQVk7Z0NBQ2xCLElBQUksRUFBRSxLQUFLOzZCQUNkLENBQUMsRUFBQTs7d0JBSEksWUFBWSxHQUFHLENBQUMsU0FHcEIsQ0FBQyxDQUFDLElBQWtCO3dCQUN0QixzQkFBTyxZQUFZLEVBQUM7Ozs7S0FDdkI7SUFoQnFCLG1DQUEwQiw2QkFnQi9DLENBQUE7SUFFRCx5QkFBeUIsSUFBbUI7UUFDeEMsSUFBTSxDQUFDLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNCLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUM7WUFDbkIsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLEtBQUssU0FBUyxDQUFDLENBQUM7UUFDOUQsQ0FBQyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQzthQUNuRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBQ2YsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDckIsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7UUFFUixDQUFDO0lBQ0wsQ0FBQztJQUVELDhCQUFvQyxJQUFtQjs7Ozs7O3dCQUM3QyxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQzt3QkFDcEYsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7NEJBQUMsTUFBTSxnQkFBQzt3QkFDZixPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLEdBQUcsT0FBTyxDQUFFLENBQUM7d0JBQy9ELHFCQUFNLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxFQUFBOzt3QkFBaEQsSUFBSSxHQUFHLFNBQXlDO3dCQUN0RCxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLEdBQUcsMkJBQTJCLENBQUMsQ0FBQzt3QkFDMUQsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHOzRCQUNmLElBQUksRUFBRSxJQUFJOzRCQUNWLFlBQVksRUFBRSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUM7eUJBQ2xDLENBQUM7Ozs7O0tBQ0w7SUFFRCxzQkFBNEIsSUFBbUIsRUFBRSxJQUFVOzs7Z0JBQ3ZELHNCQUFPLElBQUksT0FBTyxDQUFPLFVBQUEsT0FBTzt3QkFDNUIsSUFBTSxFQUFFLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQzt3QkFDNUIsRUFBRSxDQUFDLE1BQU0sR0FBRyxVQUFDLEtBQUs7NEJBQ2QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLFNBQVMsQ0FBQyxDQUFDOzRCQUN4QyxJQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsTUFBcUIsQ0FBQzs0QkFDeEMsSUFBTSxZQUFZLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQzs0QkFDaEMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHO2dDQUNmLElBQUksRUFBRSxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUM7Z0NBQzVCLFlBQVksRUFBRSxZQUFZOzZCQUM3QixDQUFDOzRCQUNGLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDdEIsc0JBQXNCLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsT0FBTztnQ0FDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLGFBQWEsQ0FBQyxDQUFDO2dDQUM1QyxJQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Z0NBQ2pDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxLQUFLLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQ0FBQyxNQUFNLENBQUM7Z0NBQ2pGLElBQUksQ0FBQztvQ0FDRCxZQUFZLENBQUMsT0FBTyxDQUFDLG1CQUFtQixHQUFHLElBQUksR0FBRyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7b0NBQ3BFLFlBQVksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxHQUFHLGdCQUFnQixFQUFFLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO29DQUNoRyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLEdBQUcsd0JBQXdCLENBQUMsQ0FBQztnQ0FDM0QsQ0FBQztnQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29DQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0NBQzdDLENBQUM7NEJBQ0wsQ0FBQyxDQUFDLENBQUM7NEJBQ0gsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNyQixDQUFDLENBQUM7d0JBQ0YsRUFBRSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO29CQUMvQixDQUFDLENBQUMsRUFBQzs7O0tBQ047SUFFRDtRQUlJLDZCQUFZLE1BQW1CO1lBQzNCLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDcEIsQ0FBQztRQUVNLGtDQUFJLEdBQVgsVUFBWSxLQUFhO1lBQ3JCLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDO1FBQ3pCLENBQUM7UUFFTSxzQ0FBUSxHQUFmO1lBQ0ksSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO1lBQ2pCLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDbEIsQ0FBQztRQUVNLHVDQUFTLEdBQWhCO1lBQ0ksSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztZQUNqQixNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ2xCLENBQUM7UUFFTSx1Q0FBUyxHQUFoQjtZQUNJLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7WUFDakIsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUNsQixDQUFDO1FBRU0sc0NBQVEsR0FBZjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFTSx3Q0FBVSxHQUFqQjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFFTSx3Q0FBVSxHQUFqQjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFFTSx5Q0FBVyxHQUFsQjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFTyx5Q0FBVyxHQUFuQjtZQUNJLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNmLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsR0FBSSxLQUFLLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQy9CLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDM0MsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7Z0JBQ2pCLE1BQU0sSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUM7Z0JBQ2pDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDcEIsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUN0QixDQUFDO1FBQ0wsQ0FBQztRQUVNLDRDQUFjLEdBQXJCLFVBQXNCLE1BQWM7WUFDaEMsSUFBTSxNQUFNLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNuRSxJQUFJLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQztZQUN0QixNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ2xCLENBQUM7UUFFTSx3Q0FBVSxHQUFqQjtZQUNJLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMvQixFQUFFLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO2dCQUNiLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDZCxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbEMsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFTSw4Q0FBZ0IsR0FBdkI7WUFDSSxJQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hELElBQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3BELElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO1lBQ2pCLE1BQU0sQ0FBQyxFQUFFLEdBQUcsV0FBVyxHQUFHLEVBQUUsQ0FBQztRQUNqQyxDQUFDO1FBRU0sMENBQVksR0FBbkI7WUFDSSxnRUFBZ0U7WUFDaEUsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQzNCLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUMzQixFQUFFLElBQUksVUFBVSxDQUFDLENBQUMsb0JBQW9CO1lBQ3RDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNULEVBQUUsSUFBSSxVQUFVLENBQUMsQ0FBRyxPQUFPO2dCQUMzQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ1osQ0FBQztZQUNELEVBQUUsSUFBSSxTQUFTLENBQUMsQ0FBRSxvQkFBb0I7WUFDdEMsSUFBTSxLQUFLLEdBQUcsRUFBRSxHQUFHLFVBQVUsR0FBRyxFQUFFLENBQUM7WUFDbkMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRU0sd0NBQVUsR0FBakI7WUFDSSxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO1lBQ2pCLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDbEIsQ0FBQztRQUVNLHdDQUFVLEdBQWpCO1lBQ0ksSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyRCxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztZQUNqQixNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ2xCLENBQUM7UUFFTSxzQ0FBUSxHQUFmLFVBQWdCLFFBQWdDO1lBQzVDLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUMvQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQztnQkFDN0IsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLENBQUM7UUFDTCwwQkFBQztJQUFELENBQUMsQUEvR0QsSUErR0M7SUFFRDtRQUNJLHFCQUNvQixTQUFpQixFQUNqQixVQUFnQixFQUNoQixZQUFvQjtZQUZwQixjQUFTLEdBQVQsU0FBUyxDQUFRO1lBQ2pCLGVBQVUsR0FBVixVQUFVLENBQU07WUFDaEIsaUJBQVksR0FBWixZQUFZLENBQVE7UUFBRyxDQUFDO1FBQ2hELGtCQUFDO0lBQUQsQ0FBQyxBQUxELElBS0M7SUFFRCxxQkFBcUIsRUFBdUI7UUFDeEMsSUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBRW5DLElBQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMvQixJQUFNLGFBQWEsR0FBRyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDdEMsSUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQzlCLElBQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNyQyxJQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDaEMsSUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2hDLElBQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN0QyxJQUFNLGVBQWUsR0FBRyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDeEMsSUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2pDLElBQU0sZ0JBQWdCLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3ZDLElBQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNwQyxJQUFNLFdBQVcsR0FBRyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDcEMsSUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3JDLElBQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUV2QyxJQUFNLHNCQUFzQixHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMvQyxJQUFNLG9CQUFvQixHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUM3QyxJQUFNLHFCQUFxQixHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUM5QyxJQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUUxQyxJQUFNLDBCQUEwQixHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUVuRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDNUIsRUFBRSxDQUFDLFFBQVEsQ0FBQztnQkFDUixFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2YsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNmLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNwQixDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7UUFFRCxJQUFNLFdBQVcsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDbkMsSUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ25DLElBQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNuQyxFQUFFLENBQUMsUUFBUSxDQUFDO1lBQ1IsSUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ25DLElBQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUMvQixJQUFNLFlBQVksR0FBRyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDMUMsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFNLFNBQVMsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDakMsSUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ3BDLElBQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN0QyxJQUFNLGFBQWEsR0FBRyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDcEMsSUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDdkMsSUFBTSxlQUFlLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3RDLElBQU0sZUFBZSxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN0QyxJQUFNLFlBQVksR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDcEMsSUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3RDLElBQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMvQixJQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDL0IsSUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQzdCLElBQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNwQyxJQUFNLGtCQUFrQixHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMzQyxJQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDakMsSUFBTSxjQUFjLEdBQUcsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3pDLElBQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN4QyxJQUFNLHdCQUF3QixHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNqRCxJQUFNLGNBQWMsR0FBRyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDekMsSUFBTSxjQUFjLEdBQUcsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3hDLElBQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNyQyxJQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUMzQyxJQUFNLFlBQVksR0FBRyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDdEMsSUFBTSxzQkFBc0IsR0FBRyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFaEQsSUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ3BDLElBQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUVqQyxNQUFNLENBQUMsSUFBSSxXQUFXLENBQ2xCLFNBQVMsRUFDVCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsRUFBRSxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUNwRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCxJQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQztJQUN0RCxJQUFJLHFCQUFxQixHQUFHLFlBQVksQ0FBQztJQUV6QyxtQkFBbUIsTUFBbUIsRUFBRSxPQUFhO1FBQ2pELGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2QixJQUFNLEVBQUUsR0FBRyxJQUFJLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDdkIsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2hCLElBQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUVwQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDdkMsSUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2hDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO2dCQUN0QixjQUFjLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVELHFCQUFxQixHQUFHLE9BQU8sQ0FBQztJQUNwQyxDQUFDO0lBRUQsQ0FBQyxDQUFDO1FBQ0UsT0FBTyxDQUFDLEdBQUcsQ0FDTixDQUFDLFNBQVMsRUFBRSxXQUFXLENBQXFCO2FBQ3hDLEdBQUcsQ0FBQyxVQUFBLElBQUk7WUFDTCxPQUFBLG9CQUFvQixDQUFDLElBQUksQ0FBQztpQkFDckIsSUFBSSxDQUFDLGNBQU0sT0FBQSxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQXJCLENBQXFCLENBQUM7UUFEdEMsQ0FDc0MsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ3RELEVBQUUsQ0FBQyxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQ3hCLDRCQUE0QixFQUFFLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCx1QkFBdUIsRUFBRSxDQUFDO1FBQzFCLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUU7WUFDbEMsdUJBQXVCLEVBQUUsQ0FBQztZQUMxQiw0QkFBNEIsRUFBRSxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBTSxRQUFRLEdBQUc7WUFDYiw0QkFBNEIsRUFBRSxDQUFDO1FBQ25DLENBQUMsQ0FBQztRQUNGLEdBQUcsQ0FBQyxDQUFhLFVBQXFHLEVBQXJHLE1BQUMsd0JBQXdCLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixFQUFFLG1CQUFtQixFQUFFLGtCQUFrQixDQUFDLEVBQXJHLGNBQXFHLEVBQXJHLElBQXFHO1lBQWpILElBQU0sRUFBRSxTQUFBO1lBQ1QsQ0FBQyxDQUFDLE1BQUksRUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUFBO1FBQ3ZDLEdBQUcsQ0FBQyxDQUFhLFVBQXVCLEVBQXZCLE1BQUMscUJBQXFCLENBQUMsRUFBdkIsY0FBdUIsRUFBdkIsSUFBdUI7WUFBbkMsSUFBTSxFQUFFLFNBQUE7WUFDVCxDQUFDLENBQUMsTUFBSSxFQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQUE7UUFFdEMsSUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7UUFDckQsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFDLENBQUMsRUFBRSxLQUFLO1lBQ3RCLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQztRQUNILElBQU0sUUFBUSxHQUFHLFVBQUMsSUFBc0IsRUFBRSxZQUFrQjtZQUN4RCxDQUFDLENBQUMsbUJBQW1CLENBQUM7aUJBQ2pCLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO2lCQUNkLElBQUksQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDO2lCQUM1QyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekQsV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBakIsQ0FBaUIsQ0FBQyxDQUFDO1lBQy9DLHFCQUFxQixFQUFFLENBQUM7WUFDeEIsNEJBQTRCLEVBQUUsQ0FBQztZQUMvQixDQUFDLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN0QyxDQUFDLENBQUM7UUFDRixDQUFDLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHO1lBQzdDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLGVBQWUsQ0FBVyxDQUFDLENBQUMsQ0FBQztRQUMvRSxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBQyxLQUFLO1lBQ2YsSUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMzQixJQUFJLElBQUksQ0FBQztZQUNULEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3RCLElBQUksR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlDLElBQUk7Z0JBQ0EsSUFBSSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUMsSUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQVcsQ0FBQztZQUM3QyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDNUMsZ0JBQWdCLEdBQUcsZUFBZSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDckQsdUJBQXVCLEVBQUUsQ0FBQztZQUMxQiw0QkFBNEIsRUFBRSxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsTUFBTSxDQUFDLFVBQU0sS0FBSzs7Ozs7d0JBQzVCLElBQUksR0FBRyxLQUFLLENBQUMsTUFBMEIsQ0FBQzt3QkFDOUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDOzRCQUFDLE1BQU0sZ0JBQUM7d0JBQ2YsQ0FBQyxHQUFHLENBQUM7Ozs2QkFBRSxDQUFBLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQTt3QkFDM0IsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3JCLFNBQU8sSUFBSSxDQUFDLElBQUksQ0FBQzs2QkFDbkIsQ0FBQSxNQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBLEVBQTlCLHdCQUE4Qjt3QkFDOUIscUJBQU0sWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsRUFBQTs7d0JBQW5DLFNBQW1DLENBQUM7Ozs2QkFDN0IsQ0FBQSxNQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBLEVBQWhDLHdCQUFnQzt3QkFDdkMscUJBQU0sWUFBWSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsRUFBQTs7d0JBQXJDLFNBQXFDLENBQUM7Ozt3QkFFdEMsZ0JBQWdCLENBQUMsa0JBQWdCLE1BQUkseUNBQXNDLENBQUMsQ0FBQzt3QkFDN0Usd0JBQVM7O3dCQUViLEVBQUUsQ0FBQyxDQUFDLHFCQUFxQixFQUFFLENBQUM7NEJBQ3hCLDRCQUE0QixFQUFFLENBQUM7Ozt3QkFaQSxDQUFDLElBQUksQ0FBQyxDQUFBOzs7d0JBYzdDLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDOzs7O2FBQ25CLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQyxDQUFDO0FBRUgsQ0FBQyxFQTMxQlMsUUFBUSxLQUFSLFFBQVEsUUEyMUJqQiIsInNvdXJjZXNDb250ZW50IjpbIm5hbWVzcGFjZSBMaXN0TWFwcyB7XHJcblxyXG5pbnRlcmZhY2UgSlF1ZXJ5IHtcclxuICAgIHRhYmxlc29ydCgpOiB2b2lkO1xyXG4gICAgZGF0YShrZXk6ICdzb3J0QnknLCBrZXlGdW5jOiAoXHJcbiAgICAgICAgdGg6IEhUTUxUYWJsZUhlYWRlckNlbGxFbGVtZW50LFxyXG4gICAgICAgIHRkOiBIVE1MVGFibGVEYXRhQ2VsbEVsZW1lbnQsXHJcbiAgICAgICAgdGFibGVzb3J0OiBhbnkpID0+IHZvaWQpOiB0aGlzO1xyXG59XHJcblxyXG50eXBlIFN1bW1hcnlSb3dEYXRhID1cclxuW1xyXG4gICAgbnVtYmVyLCBzdHJpbmcsIG51bWJlciwgc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgbnVtYmVyLCBudW1iZXIsIG51bWJlcixcclxuICAgIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyXHJcbl07XHJcbmNvbnN0IE1JTklNVU1fREFURSA9IG5ldyBEYXRlKDApO1xyXG5jbGFzcyBTdW1tYXJ5Um93IHtcclxuICAgIGFwcHJvdmVkX3N0YXR1czogbnVtYmVyO1xyXG4gICAgYXBwcm92ZWRfZGF0ZV9zdHJpbmc6IHN0cmluZztcclxuICAgIGFwcHJvdmVkX2RhdGU6IERhdGU7XHJcbiAgICBtb2RlOiBudW1iZXI7XHJcbiAgICBiZWF0bWFwX2lkOiBzdHJpbmc7XHJcbiAgICBiZWF0bWFwX2lkX251bWJlcjogbnVtYmVyO1xyXG4gICAgYmVhdG1hcHNldF9pZDogc3RyaW5nO1xyXG4gICAgZGlzcGxheV9zdHJpbmc6IHN0cmluZztcclxuICAgIGRpc3BsYXlfc3RyaW5nX2xvd2VyOiBzdHJpbmc7XHJcbiAgICBzdGFyczogbnVtYmVyO1xyXG4gICAgcHA6IG51bWJlcjtcclxuICAgIGhpdF9sZW5ndGg6IG51bWJlcjtcclxuICAgIG1heF9jb21ibzogbnVtYmVyO1xyXG4gICAgYXBwcm9hY2hfcmF0ZTogbnVtYmVyO1xyXG4gICAgY2lyY2xlX3NpemU6IG51bWJlcjtcclxuICAgIG1pbl9taXNzZXM6IG51bWJlcjtcclxuICAgIGZjTk06IG51bWJlcjtcclxuICAgIGZjSEQ6IG51bWJlcjtcclxuICAgIGZjSFI6IG51bWJlcjtcclxuICAgIGZjSERIUjogbnVtYmVyO1xyXG4gICAgZmNEVDogbnVtYmVyO1xyXG4gICAgZmNIRERUOiBudW1iZXI7XHJcbiAgICBpbmZvOiBCZWF0bWFwSW5mbyB8IG51bGw7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGRhdGE6IFN1bW1hcnlSb3dEYXRhKSB7XHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgICB0aGlzLmFwcHJvdmVkX3N0YXR1cyxcclxuICAgICAgICAgICAgdGhpcy5hcHByb3ZlZF9kYXRlX3N0cmluZyxcclxuICAgICAgICAgICAgdGhpcy5tb2RlLFxyXG4gICAgICAgICAgICB0aGlzLmJlYXRtYXBfaWQsXHJcbiAgICAgICAgICAgIHRoaXMuYmVhdG1hcHNldF9pZCxcclxuICAgICAgICAgICAgdGhpcy5kaXNwbGF5X3N0cmluZyxcclxuICAgICAgICAgICAgdGhpcy5zdGFycyxcclxuICAgICAgICAgICAgdGhpcy5wcCxcclxuICAgICAgICAgICAgdGhpcy5oaXRfbGVuZ3RoLFxyXG4gICAgICAgICAgICB0aGlzLm1heF9jb21ibyxcclxuICAgICAgICAgICAgdGhpcy5hcHByb2FjaF9yYXRlLFxyXG4gICAgICAgICAgICB0aGlzLmNpcmNsZV9zaXplLFxyXG4gICAgICAgICAgICB0aGlzLm1pbl9taXNzZXMsXHJcbiAgICAgICAgICAgIHRoaXMuZmNOTSxcclxuICAgICAgICAgICAgdGhpcy5mY0hELFxyXG4gICAgICAgICAgICB0aGlzLmZjSFIsXHJcbiAgICAgICAgICAgIHRoaXMuZmNIREhSLFxyXG4gICAgICAgICAgICB0aGlzLmZjRFQsXHJcbiAgICAgICAgICAgIHRoaXMuZmNIRERULFxyXG4gICAgICAgIF0gPSBkYXRhO1xyXG4gICAgICAgIHRoaXMuYmVhdG1hcF9pZF9udW1iZXIgPSBwYXJzZUludCh0aGlzLmJlYXRtYXBfaWQpO1xyXG4gICAgICAgIHRoaXMuYXBwcm92ZWRfZGF0ZSA9IG5ldyBEYXRlKHRoaXMuYXBwcm92ZWRfZGF0ZV9zdHJpbmcucmVwbGFjZSgnICcsICdUJykgKyAnKzA4OjAwJyk7XHJcbiAgICAgICAgdGhpcy5kaXNwbGF5X3N0cmluZ19sb3dlciA9IHRoaXMuZGlzcGxheV9zdHJpbmcudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICB0aGlzLmluZm8gPSBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG5sZXQgc3VtbWFyeVJvd3M6IFN1bW1hcnlSb3dbXSA9IFtdO1xyXG5sZXQgdW5zb3J0ZWRUYWJsZVJvd3M6IEhUTUxUYWJsZVJvd0VsZW1lbnRbXSA9IFtdO1xyXG5sZXQgY3VycmVudFNvcnRPcmRlcjogbnVtYmVyW10gPSBbXTtcclxubGV0IGN1cnJlbnRIYXNoTGluayA9ICcjJztcclxuXHJcbmxldCBwcmV2aW91c0luZGljZXMgPSAnJztcclxubGV0IHVuc29ydGVkVGFibGVSb3dzQ2hhbmdlZCA9IGZhbHNlO1xyXG5mdW5jdGlvbiBkcmF3VGFibGUoaW5kaWNlczogbnVtYmVyW10pIHtcclxuICAgIGNvbnN0IHN0ciA9IGluZGljZXMuam9pbignLCcpO1xyXG4gICAgaWYgKCF1bnNvcnRlZFRhYmxlUm93c0NoYW5nZWQgJiYgcHJldmlvdXNJbmRpY2VzID09PSBzdHIpIHJldHVybjtcclxuICAgIHVuc29ydGVkVGFibGVSb3dzQ2hhbmdlZCA9IGZhbHNlO1xyXG4gICAgcHJldmlvdXNJbmRpY2VzID0gc3RyO1xyXG4gICAgJCgnI3N1bW1hcnktdGFibGUgPiB0Ym9keScpXHJcbiAgICAgICAgLmVtcHR5KClcclxuICAgICAgICAuYXBwZW5kKGluZGljZXMubWFwKGluZGV4ID0+IHVuc29ydGVkVGFibGVSb3dzW2luZGV4XSkpO1xyXG59XHJcblxyXG5jbGFzcyBTZWFyY2hRdWVyeSB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY2hlY2s6IChyb3c6IFN1bW1hcnlSb3cpID0+IGJvb2xlYW47XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbm9ybWFsaXplZF9zb3VyY2U6IHN0cmluZztcclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBzb3VyY2U6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IGtleV90b19wcm9wZXJ0eV9uYW1lID0ge1xyXG4gICAgICAgICAgICAnc3RhdHVzJzogJ1wicHBwcmFxbFwiW3Jvdy5hcHByb3ZlZF9zdGF0dXMrMl0nLFxyXG4gICAgICAgICAgICAnbW9kZSc6ICdcIm90Y21cIltyb3cubW9kZV0nLFxyXG4gICAgICAgICAgICAnc3RhcnMnOiAncm93LnN0YXJzJyxcclxuICAgICAgICAgICAgJ3BwJzogJ3Jvdy5wcCcsXHJcbiAgICAgICAgICAgICdsZW5ndGgnOiAncm93LmhpdF9sZW5ndGgnLFxyXG4gICAgICAgICAgICAnY29tYm8nOiAncm93Lm1heF9jb21ibycsXHJcbiAgICAgICAgICAgICdhcic6ICdyb3cuYXBwcm9hY2hfcmF0ZScsXHJcbiAgICAgICAgICAgICdjcyc6ICdyb3cuY2lyY2xlX3NpemUnLFxyXG4gICAgICAgICAgICAncGxheWVkJzogYCghcm93LmluZm8/SW5maW5pdHk6KCR7bmV3IERhdGUoKS52YWx1ZU9mKCl9LXJvdy5pbmZvLmxhc3RQbGF5ZWQudmFsdWVPZigpKS8kezFlMyAqIDYwICogNjAgKiAyNH0pYCxcclxuICAgICAgICAgICAgJ3VucGxheWVkJzogYChyb3cuaW5mbyYmcm93LmluZm8ubGFzdFBsYXllZC52YWx1ZU9mKCkhPT0ke01JTklNVU1fREFURS52YWx1ZU9mKCl9Pyd5JzonJylgLFxyXG4gICAgICAgICAgICAnZGF0ZSc6IGAoJHtuZXcgRGF0ZSgpLnZhbHVlT2YoKX0tcm93LmFwcHJvdmVkX2RhdGUudmFsdWVPZigpKS8kezFlMyAqIDYwICogNjAgKiAyNH1gLFxyXG4gICAgICAgICAgICAncmFuayc6IGAoJHtKU09OLnN0cmluZ2lmeShyYW5rQWNoaWV2ZWRDbGFzcyl9WyFyb3cuaW5mbz85OnJvdy5pbmZvLnJhbmtBY2hpZXZlZF0pLnRvTG93ZXJDYXNlKClgXHJcbiAgICAgICAgfTtcclxuICAgICAgICBjb25zdCByZWdleHAgPSBuZXcgUmVnRXhwKGAoJHtcclxuICAgICAgICAgICAgT2JqZWN0LmtleXMoa2V5X3RvX3Byb3BlcnR5X25hbWUpLmpvaW4oJ3wnKVxyXG4gICAgICAgIH0pKDw9P3w+PT98PXwhPSkoWy1cXFxcd1xcXFwuXSopYCk7XHJcbiAgICAgICAgbGV0IGNoZWNrX2Z1bmNfc291cmNlID0gJ3JldHVybiB0cnVlJztcclxuICAgICAgICB0aGlzLm5vcm1hbGl6ZWRfc291cmNlID0gJyc7XHJcbiAgICAgICAgZm9yIChjb25zdCB0b2tlbiBvZiBzb3VyY2Uuc3BsaXQoJyAnKSkge1xyXG4gICAgICAgICAgICBjb25zdCB0cmltbWVkID0gdG9rZW4udHJpbSgpO1xyXG4gICAgICAgICAgICBpZiAodHJpbW1lZCA9PT0gJycpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBjb25zdCBtYXRjaCA9IHJlZ2V4cC5leGVjKHRyaW1tZWQpO1xyXG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IG1hdGNoWzFdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVsID0gbWF0Y2hbMl0gPT09ICc9JyA/ICc9PScgOiBtYXRjaFsyXTtcclxuICAgICAgICAgICAgICAgIGxldCB2YWw6IG51bWJlciB8IHN0cmluZyA9IHBhcnNlRmxvYXQobWF0Y2hbM10pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzTmFOKHZhbCkpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gbWF0Y2hbM10udG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3AgPSAoa2V5X3RvX3Byb3BlcnR5X25hbWUgYXMgYW55KVtrZXldO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubm9ybWFsaXplZF9zb3VyY2UgIT09ICcnKSB0aGlzLm5vcm1hbGl6ZWRfc291cmNlICs9ICcgJztcclxuICAgICAgICAgICAgICAgIHRoaXMubm9ybWFsaXplZF9zb3VyY2UgKz0gbWF0Y2hbMV0gKyBtYXRjaFsyXSArIG1hdGNoWzNdO1xyXG4gICAgICAgICAgICAgICAgY2hlY2tfZnVuY19zb3VyY2UgKz0gYCYmJHtwcm9wfSR7cmVsfSR7SlNPTi5zdHJpbmdpZnkodmFsKX1gO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RyID0gdHJpbW1lZC50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZXNjYXBlZCA9IEpTT04uc3RyaW5naWZ5KHN0cik7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ub3JtYWxpemVkX3NvdXJjZSAhPT0gJycpIHRoaXMubm9ybWFsaXplZF9zb3VyY2UgKz0gJyAnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ub3JtYWxpemVkX3NvdXJjZSArPSBzdHI7XHJcbiAgICAgICAgICAgICAgICBjaGVja19mdW5jX3NvdXJjZSArPSBgJiZyb3cuZGlzcGxheV9zdHJpbmdfbG93ZXIuaW5kZXhPZigke2VzY2FwZWR9KSE9PS0xYDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNoZWNrID0gbmV3IEZ1bmN0aW9uKCdyb3cnLCBjaGVja19mdW5jX3NvdXJjZSkgYXMgYW55O1xyXG4gICAgfVxyXG59XHJcblxyXG5jb25zdCBzb3J0S2V5cyA9IFtcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LmFwcHJvdmVkX2RhdGVfc3RyaW5nLFxyXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHguZGlzcGxheV9zdHJpbmcsXHJcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5zdGFycyxcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LnBwLFxyXG4gICAgKHg6IFN1bW1hcnlSb3cpID0+IHguaGl0X2xlbmd0aCxcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4Lm1heF9jb21ibyxcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PiB4LmFwcHJvYWNoX3JhdGUsXHJcbiAgICAoeDogU3VtbWFyeVJvdykgPT4geC5jaXJjbGVfc2l6ZSxcclxuICAgICh4OiBTdW1tYXJ5Um93KSA9PlxyXG4gICAgICAgIHguZmNIRERUICogMiArIHguZmNEVCAqIDFlOCArXHJcbiAgICAgICAgeC5mY0hESFIgKiAyICsgeC5mY0hSICogMWU0ICtcclxuICAgICAgICB4LmZjSEQgKiAyICsgeC5mY05NIC1cclxuICAgICAgICB4Lm1pbl9taXNzZXMsXHJcbiAgICAoeDogU3VtbWFyeVJvdykgPT4gIXguaW5mbyA/IE1JTklNVU1fREFURS52YWx1ZU9mKCkgOiB4LmluZm8ubGFzdFBsYXllZC52YWx1ZU9mKClcclxuXTtcclxuXHJcbmZ1bmN0aW9uIHN0cmluZ2lmeU9iamVjdChvYmo6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nOyB9KTogc3RyaW5nIHtcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopXHJcbiAgICAgICAgLm1hcChrID0+IGsgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQob2JqW2tdKSlcclxuICAgICAgICAuam9pbignJicpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZU9iamVjdChzdHI6IHN0cmluZykge1xyXG4gICAgY29uc3QgcmVzID0ge307XHJcbiAgICBzdHIuc3BsaXQoJyYnKS5mb3JFYWNoKHBhcnQgPT4ge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoID0gcGFydC5tYXRjaCgvKFxcdyspPSguKykvKTtcclxuICAgICAgICBpZiAobWF0Y2gpXHJcbiAgICAgICAgICAgIChyZXMgYXMgYW55KVttYXRjaFsxXV0gPSBkZWNvZGVVUklDb21wb25lbnQobWF0Y2hbMl0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCkge1xyXG4gICAgY29uc3QgZmlsdGVyX2FwcHJvdmVkX3N0YXR1cyA9IHBhcnNlSW50KCQoJyNmaWx0ZXItYXBwcm92ZWQtc3RhdHVzJykudmFsKCkgYXMgc3RyaW5nKTtcclxuICAgIGNvbnN0IGZpbHRlcl9tb2RlID0gcGFyc2VJbnQoJCgnI2ZpbHRlci1tb2RlJykudmFsKCkgYXMgc3RyaW5nKTtcclxuICAgIGNvbnN0IGZpbHRlcl9zZWFyY2hfcXVlcnkgPSBuZXcgU2VhcmNoUXVlcnkoKCQoJyNmaWx0ZXItc2VhcmNoLXF1ZXJ5JykudmFsKCkgYXMgc3RyaW5nKSk7XHJcbiAgICBjb25zdCBmaWx0ZXJfZmNfbGV2ZWwgPSBwYXJzZUludCgkKCcjZmlsdGVyLWZjLWxldmVsJykudmFsKCkgYXMgc3RyaW5nKTtcclxuICAgIGNvbnN0IGZpbHRlcl9sb2NhbF9kYXRhID0gcGFyc2VJbnQoJCgnI2ZpbHRlci1sb2NhbC1kYXRhJykudmFsKCkgYXMgc3RyaW5nKTtcclxuICAgIGNvbnN0IHNob3dfZnVsbF9yZXN1bHQgPSAkKCcjc2hvdy1mdWxsLXJlc3VsdCcpLnByb3AoJ2NoZWNrZWQnKTtcclxuXHJcbiAgICBjb25zdCBnZXRfZmNfbGV2ZWwgPSAocm93OiBTdW1tYXJ5Um93KSA9PiB7XHJcbiAgICAgICAgaWYgKHJvdy5taW5fbWlzc2VzICE9PSAwKSByZXR1cm4gMTtcclxuICAgICAgICBpZiAocm93LmZjRFQgIT09IDAgfHwgcm93LmZjSEREVCAhPT0gMCkgcmV0dXJuIDg7XHJcbiAgICAgICAgaWYgKHJvdy5mY05NID09PSAwICYmIHJvdy5mY0hEID09PSAwICYmIHJvdy5mY0hSID09PSAwICYmIHJvdy5mY0hESFIgPT09IDApIHJldHVybiAyO1xyXG4gICAgICAgIGlmIChyb3cuZmNOTSA9PT0gMCAmJiByb3cuZmNIRCA9PT0gMCkgcmV0dXJuIDM7XHJcbiAgICAgICAgaWYgKHJvdy5mY0hEID09PSAwKSByZXR1cm4gNDtcclxuICAgICAgICBpZiAocm93LmZjSFIgPT09IDAgJiYgcm93LmZjSERIUiA9PT0gMCkgcmV0dXJuIDU7XHJcbiAgICAgICAgaWYgKHJvdy5mY0hESFIgPT09IDApIHJldHVybiA2O1xyXG4gICAgICAgIHJldHVybiA3O1xyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBnZXRfbG9jYWxfZGF0YV9mbGFncyA9IChyb3c6IFN1bW1hcnlSb3cpOiBudW1iZXIgPT4ge1xyXG4gICAgICAgIGlmIChiZWF0bWFwSW5mb01hcC5zaXplID09PSAwKSByZXR1cm4gLTE7XHJcbiAgICAgICAgbGV0IGZsYWdzID0gMDtcclxuICAgICAgICBjb25zdCBpbmZvID0gYmVhdG1hcEluZm9NYXAuZ2V0KHJvdy5iZWF0bWFwX2lkX251bWJlcik7XHJcbiAgICAgICAgaWYgKCFpbmZvKSByZXR1cm4gMDtcclxuICAgICAgICBmbGFncyB8PSAyO1xyXG4gICAgICAgIGlmIChpbmZvLmxhc3RQbGF5ZWQudmFsdWVPZigpICE9PSBNSU5JTVVNX0RBVEUudmFsdWVPZigpKVxyXG4gICAgICAgICAgICBmbGFncyB8PSAxO1xyXG4gICAgICAgIHJldHVybiBmbGFncztcclxuICAgIH07XHJcblxyXG4gICAgY3VycmVudEhhc2hMaW5rID0gJyMnO1xyXG4gICAgY29uc3Qgb2JqID0ge30gYXMgeyBba2V5OiBzdHJpbmddOiBzdHJpbmc7IH07XHJcbiAgICBpZiAoZmlsdGVyX2FwcHJvdmVkX3N0YXR1cyAhPT0gMSlcclxuICAgICAgICBvYmoucyA9IGZpbHRlcl9hcHByb3ZlZF9zdGF0dXMudG9TdHJpbmcoKTtcclxuICAgIGlmIChmaWx0ZXJfbW9kZSAhPT0gMylcclxuICAgICAgICBvYmoubSA9IGZpbHRlcl9tb2RlLnRvU3RyaW5nKCk7XHJcbiAgICBpZiAoZmlsdGVyX3NlYXJjaF9xdWVyeS5ub3JtYWxpemVkX3NvdXJjZSAhPT0gJycpXHJcbiAgICAgICAgb2JqLnEgPSBmaWx0ZXJfc2VhcmNoX3F1ZXJ5Lm5vcm1hbGl6ZWRfc291cmNlO1xyXG4gICAgaWYgKGZpbHRlcl9mY19sZXZlbCAhPT0gMClcclxuICAgICAgICBvYmoubCA9IGZpbHRlcl9mY19sZXZlbC50b1N0cmluZygpO1xyXG4gICAgaWYgKGZpbHRlcl9sb2NhbF9kYXRhICE9PSAwKVxyXG4gICAgICAgIG9iai5kID0gZmlsdGVyX2xvY2FsX2RhdGEudG9TdHJpbmcoKTtcclxuICAgIGlmIChjdXJyZW50U29ydE9yZGVyLmxlbmd0aCAhPT0gMClcclxuICAgICAgICBvYmoubyA9IGN1cnJlbnRTb3J0T3JkZXIuam9pbignLicpO1xyXG4gICAgaWYgKHNob3dfZnVsbF9yZXN1bHQpXHJcbiAgICAgICAgb2JqLmYgPSAnMSc7XHJcblxyXG4gICAgY3VycmVudEhhc2hMaW5rICs9IHN0cmluZ2lmeU9iamVjdChvYmopO1xyXG4gICAgaGlzdG9yeS5yZXBsYWNlU3RhdGUoe30sIGRvY3VtZW50LnRpdGxlLCBsb2NhdGlvbi5wYXRobmFtZSArIChjdXJyZW50SGFzaExpbmsgPT09ICcjJyA/ICcnIDogY3VycmVudEhhc2hMaW5rKSk7XHJcblxyXG4gICAgY29uc3QgaW5kaWNlcyA9IHN1bW1hcnlSb3dzLm1hcCgoXywgaW5kZXgpID0+IGluZGV4KS5maWx0ZXIoaW5kZXggPT4ge1xyXG4gICAgICAgIGNvbnN0IHJvdyA9IHN1bW1hcnlSb3dzW2luZGV4XTtcclxuXHJcbiAgICAgICAgaWYgKGZpbHRlcl9hcHByb3ZlZF9zdGF0dXMgPT09IDEgJiZcclxuICAgICAgICAgICAgKHJvdy5hcHByb3ZlZF9zdGF0dXMgIT09IDEgJiYgcm93LmFwcHJvdmVkX3N0YXR1cyAhPT0gMikpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICBpZiAoZmlsdGVyX2FwcHJvdmVkX3N0YXR1cyA9PT0gMiAmJiByb3cuYXBwcm92ZWRfc3RhdHVzICE9PSA0KVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmIChmaWx0ZXJfbW9kZSA9PT0gMSAmJiByb3cubW9kZSAhPT0gMClcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGlmIChmaWx0ZXJfbW9kZSA9PT0gMiAmJiByb3cubW9kZSAhPT0gMilcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoIWZpbHRlcl9zZWFyY2hfcXVlcnkuY2hlY2socm93KSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoZmlsdGVyX2ZjX2xldmVsICE9PSAwICYmIGdldF9mY19sZXZlbChyb3cpICE9PSBmaWx0ZXJfZmNfbGV2ZWwpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKGZpbHRlcl9sb2NhbF9kYXRhICE9PSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZsYWdzID0gZ2V0X2xvY2FsX2RhdGFfZmxhZ3Mocm93KTtcclxuICAgICAgICAgICAgc3dpdGNoIChmaWx0ZXJfbG9jYWxfZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAxOiBpZiAoKGZsYWdzICYgMSkgIT09IDApIHJldHVybiBmYWxzZTsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDI6IGlmICgoZmxhZ3MgJiAxKSA9PT0gMCkgcmV0dXJuIGZhbHNlOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgMzogaWYgKChmbGFncyAmIDIpICE9PSAwKSByZXR1cm4gZmFsc2U7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBpZiAoKGZsYWdzICYgMikgPT09IDApIHJldHVybiBmYWxzZTsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDU6IGlmICgoZmxhZ3MgJiAzKSAhPT0gMikgcmV0dXJuIGZhbHNlOyBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9KTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IG9yZCBvZiBjdXJyZW50U29ydE9yZGVyKSB7XHJcbiAgICAgICAgaWYgKG9yZCA9PT0gMCkgY29udGludWU7XHJcbiAgICAgICAgY29uc3QgcHJldkluZGV4ID0gQXJyYXkoaW5kaWNlcy5sZW5ndGgpO1xyXG4gICAgICAgIGluZGljZXMuZm9yRWFjaCgoeCwgaSkgPT4gcHJldkluZGV4W3hdID0gaSk7XHJcbiAgICAgICAgY29uc3Qgc29ydEtleSA9IHNvcnRLZXlzW01hdGguYWJzKG9yZCkgLSAxXTtcclxuICAgICAgICBjb25zdCBzaWduID0gb3JkID4gMCA/IDEgOiAtMTtcclxuICAgICAgICBpbmRpY2VzLnNvcnQoKHgsIHkpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qga3ggPSBzb3J0S2V5KHN1bW1hcnlSb3dzW3hdKTtcclxuICAgICAgICAgICAgY29uc3Qga3kgPSBzb3J0S2V5KHN1bW1hcnlSb3dzW3ldKTtcclxuICAgICAgICAgICAgcmV0dXJuIGt4IDwga3kgPyAtc2lnbiA6IGt4ID4ga3kgPyBzaWduIDogcHJldkluZGV4W3ldIC0gcHJldkluZGV4W3hdO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgICQoJyNudW0tcmVzdWx0cycpLnRleHQoaW5kaWNlcy5sZW5ndGggPT09IDEgPyAnMSBtYXAnIDogaW5kaWNlcy5sZW5ndGgudG9TdHJpbmcoKSArICcgbWFwcycpO1xyXG4gICAgY29uc3QgdHJ1bmNhdGVfbnVtID0gc2hvd19mdWxsX3Jlc3VsdCA/IEluZmluaXR5IDogMTAwO1xyXG4gICAgaWYgKGluZGljZXMubGVuZ3RoID4gdHJ1bmNhdGVfbnVtKVxyXG4gICAgICAgIGluZGljZXMubGVuZ3RoID0gdHJ1bmNhdGVfbnVtO1xyXG5cclxuICAgICQoJyNoYXNoLWxpbmstdG8tdGhlLWN1cnJlbnQtdGFibGUnKS5hdHRyKCdocmVmJywgY3VycmVudEhhc2hMaW5rKTtcclxuXHJcbiAgICBkcmF3VGFibGUoaW5kaWNlcyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbXBseVNvcnRPcmRlcihvcmRlcjogbnVtYmVyW10pOiBudW1iZXJbXSB7XHJcbiAgICBjb25zdCByZXMgPSBbXTtcclxuICAgIGNvbnN0IHNlZW4gPSBBcnJheShzb3J0S2V5cy5sZW5ndGgpO1xyXG4gICAgZm9yIChsZXQgaSA9IG9yZGVyLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS0gaSkge1xyXG4gICAgICAgIGNvbnN0IHggPSBvcmRlcltpXTtcclxuICAgICAgICBpZiAoeCA9PT0gMCkgY29udGludWU7XHJcbiAgICAgICAgY29uc3Qga2V5ID0gTWF0aC5hYnMoeCkgLSAxLCBzaWduID0geCA+IDAgPyAxIDogLTE7XHJcbiAgICAgICAgaWYgKHNlZW5ba2V5XSkgY29udGludWU7XHJcbiAgICAgICAgc2VlbltrZXldID0gc2lnbjtcclxuICAgICAgICByZXMucHVzaCh4KTtcclxuICAgICAgICBpZiAoWzAsIDEsIDIsIDMsIDQsIDUsIDldLmluZGV4T2Yoa2V5KSAhPT0gLTEpIC8vIHRoZXJlIGlzIGFsbW9zdCBubyB0aWVzXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgaWYgKHJlcy5sZW5ndGggIT09IDAgJiYgcmVzW3Jlcy5sZW5ndGggLSAxXSA9PT0gLTMpXHJcbiAgICAgICAgcmVzLnBvcCgpO1xyXG4gICAgcmVzLnJldmVyc2UoKTtcclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFF1ZXJ5QWNjb3JkaW5nVG9IYXNoKCkge1xyXG4gICAgbGV0IG9iajogeyBbazogc3RyaW5nXTogc3RyaW5nOyB9O1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBvYmogPSBwYXJzZU9iamVjdChsb2NhdGlvbi5oYXNoLnN1YnN0cigxKSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgb2JqID0ge307XHJcbiAgICB9XHJcbiAgICBpZiAob2JqLnMgPT09IHVuZGVmaW5lZCkgb2JqLnMgPSAnMSc7XHJcbiAgICBpZiAob2JqLm0gPT09IHVuZGVmaW5lZCkgb2JqLm0gPSAnMyc7XHJcbiAgICBpZiAob2JqLnEgPT09IHVuZGVmaW5lZCkgb2JqLnEgPSAnJztcclxuICAgIGlmIChvYmoubCA9PT0gdW5kZWZpbmVkKSBvYmoubCA9ICcwJztcclxuICAgIGlmIChvYmoubyA9PT0gdW5kZWZpbmVkKSBvYmoubyA9ICcnO1xyXG4gICAgaWYgKG9iai5mID09PSB1bmRlZmluZWQpIG9iai5mID0gJzAnO1xyXG4gICAgaWYgKG9iai5kID09PSB1bmRlZmluZWQpIG9iai5kID0gJzAnO1xyXG4gICAgJCgnI2ZpbHRlci1hcHByb3ZlZC1zdGF0dXMnKS52YWwocGFyc2VJbnQob2JqLnMpKTtcclxuICAgICQoJyNmaWx0ZXItbW9kZScpLnZhbChwYXJzZUludChvYmoubSkpO1xyXG4gICAgJCgnI2ZpbHRlci1zZWFyY2gtcXVlcnknKS52YWwob2JqLnEpO1xyXG4gICAgJCgnI2ZpbHRlci1mYy1sZXZlbCcpLnZhbChwYXJzZUludChvYmoubCkpO1xyXG4gICAgJCgnI2ZpbHRlci1sb2NhbC1kYXRhJykudmFsKHBhcnNlSW50KG9iai5kKSk7XHJcbiAgICAkKCcjc2hvdy1mdWxsLXJlc3VsdCcpLnByb3AoJ2NoZWNrZWQnLCAhIXBhcnNlSW50KG9iai5mKSk7XHJcbiAgICBjdXJyZW50U29ydE9yZGVyID0gc2ltcGx5U29ydE9yZGVyKG9iai5vLnNwbGl0KCcuJykubWFwKHggPT4gcGFyc2VJbnQoeCkgfHwgMCkpO1xyXG4gICAgc2V0VGFibGVIZWFkU29ydGluZ01hcmsoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0VGFibGVIZWFkU29ydGluZ01hcmsoKSB7XHJcbiAgICAkKCcuc29ydGVkJykucmVtb3ZlQ2xhc3MoJ3NvcnRlZCBhc2NlbmRpbmcgZGVzY2VuZGluZycpO1xyXG4gICAgY29uc3QgeCA9IGN1cnJlbnRTb3J0T3JkZXIubGVuZ3RoID09PSAwID9cclxuICAgICAgICAtMyA6IC8vIHN0YXJzIGRlc2NcclxuICAgICAgICBjdXJyZW50U29ydE9yZGVyW2N1cnJlbnRTb3J0T3JkZXIubGVuZ3RoIC0gMV07XHJcbiAgICBjb25zdCBpbmRleCA9IE1hdGguYWJzKHgpIC0gMTtcclxuICAgICQoJCgnI3N1bW1hcnktdGFibGUgPiB0aGVhZCA+IHRyID4gdGgnKVtpbmRleF0pXHJcbiAgICAgICAgLmFkZENsYXNzKCdzb3J0ZWQnKS5hZGRDbGFzcyh4ID4gMCA/ICdhc2NlbmRpbmcnIDogJ2Rlc2NlbmRpbmcnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFkKHg6IG51bWJlcikge1xyXG4gICAgcmV0dXJuICh4IDwgMTAgPyAnMCcgOiAnJykgKyB4O1xyXG59XHJcblxyXG5mdW5jdGlvbiBmb3JtYXREYXRlKGRhdGU6IERhdGUpIHtcclxuICAgIHJldHVybiBkYXRlLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSArXHJcbiAgICAgICAgJyAnICsgcGFkKGRhdGUuZ2V0SG91cnMoKSkgK1xyXG4gICAgICAgICc6JyArIHBhZChkYXRlLmdldE1pbnV0ZXMoKSk7XHJcbn1cclxuXHJcbmNvbnN0IHJhbmtBY2hpZXZlZENsYXNzID0gW1xyXG4gICAgJ1NTSCcsICdTSCcsICdTUycsICdTJywgJ0EnLFxyXG4gICAgJ0InLCAnQycsICdEJywgJ0YnLCAnLSdcclxuXTtcclxuXHJcbmxldCBiZWF0bWFwSW5mb01hcFVzZWRWZXJzaW9uID0gTUlOSU1VTV9EQVRFO1xyXG5mdW5jdGlvbiBpbml0VW5zb3J0ZWRUYWJsZVJvd3MoKSB7XHJcbiAgICBpZiAoc3VtbWFyeVJvd3MubGVuZ3RoID09PSAwKVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICBpZiAodW5zb3J0ZWRUYWJsZVJvd3MubGVuZ3RoICE9PSAwICYmIGJlYXRtYXBJbmZvTWFwVXNlZFZlcnNpb24gPT09IGJlYXRtYXBJbmZvTWFwVmVyc2lvbilcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICBiZWF0bWFwSW5mb01hcFVzZWRWZXJzaW9uID0gYmVhdG1hcEluZm9NYXBWZXJzaW9uO1xyXG4gICAgaWYgKGJlYXRtYXBJbmZvTWFwLnNpemUgIT09IDApIHtcclxuICAgICAgICBzdW1tYXJ5Um93cy5mb3JFYWNoKHJvdyA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBiZWF0bWFwSW5mb01hcC5nZXQocm93LmJlYXRtYXBfaWRfbnVtYmVyKTtcclxuICAgICAgICAgICAgaWYgKGluZm8pXHJcbiAgICAgICAgICAgICAgICByb3cuaW5mbyA9IGluZm87XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbW9kZV9pY29ucyA9IFtcclxuICAgICAgICAnZmEgZmEtZXhjaGFuZ2UnLFxyXG4gICAgICAgICcnLFxyXG4gICAgICAgICdmYSBmYS10aW50JyxcclxuICAgICAgICAnJyxcclxuICAgIF07XHJcbiAgICBjb25zdCBhcHByb3ZlZF9zdGF0dXNfaWNvbnMgPSBbXHJcbiAgICAgICAgJ2ZhIGZhLXF1ZXN0aW9uJyxcclxuICAgICAgICAnZmEgZmEtcXVlc3Rpb24nLFxyXG4gICAgICAgICdmYSBmYS1xdWVzdGlvbicsXHJcbiAgICAgICAgJ2ZhIGZhLWFuZ2xlLWRvdWJsZS1yaWdodCcsXHJcbiAgICAgICAgJ2ZhIGZhLWZpcmUnLFxyXG4gICAgICAgICdmYSBmYS1jaGVjaycsXHJcbiAgICAgICAgJ2ZhIGZhLWhlYXJ0LW8nLFxyXG4gICAgXTtcclxuICAgIHVuc29ydGVkVGFibGVSb3dzID0gc3VtbWFyeVJvd3MubWFwKHJvdyA9PlxyXG4gICAgICAgICQoJzx0cj4nKS5hcHBlbmQoW1xyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAkKCc8aT4nKS5hZGRDbGFzcyhhcHByb3ZlZF9zdGF0dXNfaWNvbnNbcm93LmFwcHJvdmVkX3N0YXR1cyArIDJdKSxcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHJvdy5hcHByb3ZlZF9kYXRlX3N0cmluZy5zcGxpdCgnICcpWzBdKVxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAkKCc8aT4nKS5hZGRDbGFzcyhtb2RlX2ljb25zW3Jvdy5tb2RlXSksXHJcbiAgICAgICAgICAgICAgICAkKCc8YT4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYGh0dHBzOi8vb3N1LnBweS5zaC9iLyR7cm93LmJlYXRtYXBfaWR9P209MmApXHJcbiAgICAgICAgICAgICAgICAgICAgLnRleHQocm93LmRpc3BsYXlfc3RyaW5nKSxcclxuICAgICAgICAgICAgICAgIHJvdy5iZWF0bWFwX2lkX251bWJlciA+IDAgPyAkKCc8ZGl2IGNsYXNzPVwiZmxvYXQtcmlnaHRcIj4nKS5hcHBlbmQoW1xyXG4gICAgICAgICAgICAgICAgICAgICQoJzxhPjxpIGNsYXNzPVwiZmEgZmEtcGljdHVyZS1vXCI+JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9iLnBweS5zaC90aHVtYi8ke3Jvdy5iZWF0bWFwc2V0X2lkfS5qcGdgKSxcclxuICAgICAgICAgICAgICAgICAgICAkKCc8YT48aSBjbGFzcz1cImZhIGZhLWRvd25sb2FkXCI+JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCBgaHR0cHM6Ly9vc3UucHB5LnNoL2QvJHtyb3cuYmVhdG1hcHNldF9pZH1uYCksXHJcbiAgICAgICAgICAgICAgICAgICAgJCgnPGE+PGkgY2xhc3M9XCJmYSBmYS1jbG91ZC1kb3dubG9hZFwiPicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgYG9zdTovL2RsLyR7cm93LmJlYXRtYXBzZXRfaWR9YClcclxuICAgICAgICAgICAgICAgIF0pIDogJCgpXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIHJvdy5zdGFycy50b0ZpeGVkKDIpLFxyXG4gICAgICAgICAgICByb3cucHAudG9GaXhlZCgwKSxcclxuICAgICAgICAgICAgYCR7TWF0aC5mbG9vcihyb3cuaGl0X2xlbmd0aCAvIDYwKX06JHtwYWQoTWF0aC5mbG9vcihyb3cuaGl0X2xlbmd0aCAlIDYwKSl9YCxcclxuICAgICAgICAgICAgcm93Lm1heF9jb21iby50b1N0cmluZygpLFxyXG4gICAgICAgICAgICByb3cuYXBwcm9hY2hfcmF0ZS50b0ZpeGVkKDEpLFxyXG4gICAgICAgICAgICByb3cuY2lyY2xlX3NpemUudG9GaXhlZCgxKSxcclxuICAgICAgICAgICAgcm93Lm1pbl9taXNzZXMgIT09IDAgPyAocm93Lm1pbl9taXNzZXMgPT09IDEgPyAnMSBtaXNzJyA6IHJvdy5taW5fbWlzc2VzICsgJyBtaXNzZXMnKSA6XHJcbiAgICAgICAgICAgIFtyb3cuZmNOTSwgcm93LmZjSEQsIHJvdy5mY0hSLCByb3cuZmNIREhSLCByb3cuZmNEVCwgcm93LmZjSEREVF0uam9pbignLCAnKSxcclxuICAgICAgICBiZWF0bWFwSW5mb01hcC5zaXplID09PSAwID8gW10gOlxyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAkKCc8aSBjbGFzcz1cImZhXCI+JykuYWRkQ2xhc3Mocm93LmluZm8gPyAnZmEtY2hlY2stc3F1YXJlLW8nIDogJ2ZhLXNxdWFyZS1vJyksXHJcbiAgICAgICAgICAgICAgICAkKCc8c3Bhbj4nKS5hZGRDbGFzcygncmFuay0nICsgcmFua0FjaGlldmVkQ2xhc3NbIXJvdy5pbmZvID8gOSA6IHJvdy5pbmZvLnJhbmtBY2hpZXZlZF0pLFxyXG4gICAgICAgICAgICAgICAgJCgnPHNwYW4+JykudGV4dChcclxuICAgICAgICAgICAgICAgICAgICAhcm93LmluZm8gfHwgcm93LmluZm8ubGFzdFBsYXllZC52YWx1ZU9mKCkgPT09IE1JTklNVU1fREFURS52YWx1ZU9mKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgPyAnLS0tJyA6IGZvcm1hdERhdGUocm93LmluZm8ubGFzdFBsYXllZClcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICBdLm1hcCh4ID0+ICQoJzx0ZD4nKS5hcHBlbmQoeCkpKVswXSBhcyBIVE1MVGFibGVSb3dFbGVtZW50KTtcclxuXHJcbiAgICB1bnNvcnRlZFRhYmxlUm93c0NoYW5nZWQgPSB0cnVlO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3dFcnJvck1lc3NhZ2UodGV4dDogc3RyaW5nKSB7XHJcbiAgICAkKCcjYWxlcnRzJykuYXBwZW5kKFxyXG4gICAgICAgICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC13YXJuaW5nIGFsZXJ0LWRpc21pc3NhYmxlXCI+JylcclxuICAgICAgICAgICAgLnRleHQodGV4dClcclxuICAgICAgICAgICAgLmFwcGVuZCgnPGEgY2xhc3M9XCJjbG9zZVwiIGRhdGEtZGlzbWlzcz1cImFsZXJ0XCI+PHNwYW4+JnRpbWVzOycpKTtcclxufVxyXG5cclxuY29uc3QgTE9DQUxTVE9SQUdFX1BSRUZJWCA9ICdsaXN0LW1hcHMvJztcclxudHlwZSBMb2NhbEZpbGVOYW1lID0gJ29zdSEuZGInIHwgJ3Njb3Jlcy5kYic7XHJcbmludGVyZmFjZSBMb2NhbEZpbGUge1xyXG4gICAgZGF0YTogVWludDhBcnJheTtcclxuICAgIHVwbG9hZGVkRGF0ZTogRGF0ZTtcclxufVxyXG5jb25zdCBsb2NhbEZpbGVzOiB7XHJcbiAgICBbJ29zdSEuZGInXT86IExvY2FsRmlsZSxcclxuICAgIFsnc2NvcmVzLmRiJ10/OiBMb2NhbEZpbGU7XHJcbn0gPSB7fTtcclxuXHJcbi8qXHJcbmZ1bmN0aW9uIGRhdGFVUkl0b1VJbnQ4QXJyYXkoZGF0YVVSSTogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBiYXNlNjQgPSBkYXRhVVJJLnNwbGl0KCcsJylbMV07XHJcbiAgICBjb25zdCBzdHIgPSBhdG9iKGJhc2U2NCk7XHJcbiAgICBjb25zdCBsZW4gPSBzdHIubGVuZ3RoO1xyXG4gICAgY29uc3QgYXJyYXkgPSBuZXcgVWludDhBcnJheShsZW4pO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47ICsrIGkpIHtcclxuICAgICAgICBhcnJheVtpXSA9IHN0ci5jaGFyQ29kZUF0KGkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFycmF5O1xyXG59XHJcbiovXHJcblxyXG5jb25zdCByZWdpc3RlcmVkQ2FsbGJhY2tNYXAgPSBuZXcgTWFwPG51bWJlciwgKGRhdGE6IGFueSkgPT4gYW55PigpO1xyXG5mdW5jdGlvbiByZWdpc3RlckNhbGxiYWNrKGNhbGxiYWNrOiAoZGF0YTogYW55KSA9PiBhbnkpOiBudW1iZXIge1xyXG4gICAgbGV0IGlkO1xyXG4gICAgZG9cclxuICAgICAgICBpZCA9IE1hdGgucmFuZG9tKCk7XHJcbiAgICB3aGlsZSAocmVnaXN0ZXJlZENhbGxiYWNrTWFwLmhhcyhpZCkpO1xyXG4gICAgcmVnaXN0ZXJlZENhbGxiYWNrTWFwLnNldChpZCwgY2FsbGJhY2spO1xyXG4gICAgcmV0dXJuIGlkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBuZXdXb3JrZXIoKTogV29ya2VyIHtcclxuICAgIHJldHVybiBuZXcgV29ya2VyKCdkaXN0L2xpc3QtbWFwcy13b3JrZXIuanMnKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcnVuV29ya2VyKG1lc3NhZ2U6IG9iamVjdCwgdXNpbmc/OiBXb3JrZXIpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueT4ocmVzb2x2ZSA9PiB7XHJcbiAgICAgICAgY29uc3Qgd29ya2VyID0gdXNpbmcgfHwgbmV3V29ya2VyKCk7XHJcbiAgICAgICAgKG1lc3NhZ2UgYXMgYW55KS5pZCA9IHJlZ2lzdGVyQ2FsbGJhY2socmVzb2x2ZSk7XHJcbiAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKG1lc3NhZ2UpO1xyXG4gICAgICAgIHdvcmtlci5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGV2ZW50LmRhdGE7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLnR5cGUgPT09ICdjYWxsYmFjaycgJiYgdHlwZW9mKGRhdGEuaWQpID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSByZWdpc3RlcmVkQ2FsbGJhY2tNYXAuZ2V0KGRhdGEuaWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVnaXN0ZXJlZENhbGxiYWNrTWFwLmRlbGV0ZShkYXRhLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIGZhbHNlKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tcHJlc3NCdWZmZXJUb1N0cmluZyhidWZmZXI6IEFycmF5QnVmZmVyKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIGNvbnN0IGNvbXByZXNzZWQgPSAoYXdhaXQgcnVuV29ya2VyKHtcclxuICAgICAgICB0eXBlOiAnY29tcHJlc3MnLFxyXG4gICAgICAgIGRhdGE6IG5ldyBVaW50OEFycmF5KGJ1ZmZlcilcclxuICAgIH0pKS5kYXRhIGFzIFVpbnQ4QXJyYXk7XHJcbiAgICBjb25zdCBjaGFycyA9IG5ldyBBcnJheShNYXRoLmZsb29yKGNvbXByZXNzZWQubGVuZ3RoIC8gMikpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGFycy5sZW5ndGg7IGkgKz0gMSkge1xyXG4gICAgICAgIGNvbnN0IGNvZGUgPSAoY29tcHJlc3NlZFtpICogMiArIDBdICYgMHhmZikgPDwgOCB8IChjb21wcmVzc2VkW2kgKiAyICsgMV0gJiAweGZmKTtcclxuICAgICAgICBjaGFyc1tpXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XHJcbiAgICB9XHJcbiAgICBsZXQgcmVzID0gY29tcHJlc3NlZC5sZW5ndGggJSAyID8gJzEnIDogJzAnO1xyXG4gICAgcmVzICs9IGNoYXJzLmpvaW4oJycpO1xyXG4gICAgaWYgKGNvbXByZXNzZWQubGVuZ3RoICUgMiAhPT0gMClcclxuICAgICAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoY29tcHJlc3NlZFtjb21wcmVzc2VkLmxlbmd0aCAtIDFdICYgMHhmZikgPDwgOCk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVjb21wcmVzc0J1ZmZlckZyb21TdHJpbmcoc3RyOiBzdHJpbmcpOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcclxuICAgIGNvbnN0IHBhcml0eSA9IHN0clswXSA9PT0gJzEnID8gMSA6IDA7XHJcbiAgICBjb25zdCBsZW4gPSBzdHIubGVuZ3RoIC0gMSAtIHBhcml0eTtcclxuICAgIGNvbnN0IGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkobGVuICogMiArIHBhcml0eSk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XHJcbiAgICAgICAgY29uc3QgY29kZSA9IHN0ci5jaGFyQ29kZUF0KGkgKyAxKTtcclxuICAgICAgICBhcnJheVtpICogMiArIDBdID0gY29kZSA+PiA4O1xyXG4gICAgICAgIGFycmF5W2kgKiAyICsgMV0gPSBjb2RlICYgMHhmZjtcclxuICAgIH1cclxuICAgIGlmIChwYXJpdHkgIT09IDApXHJcbiAgICAgICAgYXJyYXlbbGVuICogMl0gPSBzdHIuY2hhckNvZGVBdChsZW4gKyAxKSA+PiA4O1xyXG4gICAgY29uc3QgZGVjb21wcmVzc2VkID0gKGF3YWl0IHJ1bldvcmtlcih7XHJcbiAgICAgICAgdHlwZTogJ2RlY29tcHJlc3MnLFxyXG4gICAgICAgIGRhdGE6IGFycmF5XHJcbiAgICB9KSkuZGF0YSBhcyBVaW50OEFycmF5O1xyXG4gICAgcmV0dXJuIGRlY29tcHJlc3NlZDtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVsb2FkTG9jYWxGaWxlKG5hbWU6IExvY2FsRmlsZU5hbWUpIHtcclxuICAgIGNvbnN0IGYgPSBsb2NhbEZpbGVzW25hbWVdO1xyXG4gICAgaWYgKG5hbWUgPT09ICdvc3UhLmRiJylcclxuICAgICAgICAkKCcjZmlsdGVyLWxvY2FsLWRhdGEnKS5wcm9wKCdkaXNhYmxlZCcsIGYgPT09IHVuZGVmaW5lZCk7XHJcbiAgICAkKG5hbWUgPT09ICdvc3UhLmRiJyA/ICcjY3VycmVudC1vc3VkYi1maWxlJyA6ICcjY3VycmVudC1zY29yZXNkYi1maWxlJylcclxuICAgICAgICAudGV4dCghZiA/ICdObyBkYXRhJyA6IGZvcm1hdERhdGUoZi51cGxvYWRlZERhdGUpKTtcclxuICAgIGlmICghZikgcmV0dXJuO1xyXG4gICAgaWYgKG5hbWUgPT09ICdvc3UhLmRiJykge1xyXG4gICAgICAgIGxvYWRPc3VEQihmLmRhdGEuYnVmZmVyLCBmLnVwbG9hZGVkRGF0ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gbG9hZEZyb21Mb2NhbFN0b3JhZ2UobmFtZTogTG9jYWxGaWxlTmFtZSkge1xyXG4gICAgY29uc3QgZGF0ZVN0ciA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKExPQ0FMU1RPUkFHRV9QUkVGSVggKyBuYW1lICsgJy91cGxvYWRlZC1kYXRlJyk7XHJcbiAgICBpZiAoIWRhdGVTdHIpIHJldHVybjtcclxuICAgIGNvbnN0IGVuY29kZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShMT0NBTFNUT1JBR0VfUFJFRklYICsgbmFtZSArICcvZGF0YScpITtcclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBkZWNvbXByZXNzQnVmZmVyRnJvbVN0cmluZyhlbmNvZGVkKTtcclxuICAgIGNvbnNvbGUubG9nKCdmaWxlICcgKyBuYW1lICsgJyBsb2FkZWQgZnJvbSBsb2NhbFN0b3JhZ2UnKTtcclxuICAgIGxvY2FsRmlsZXNbbmFtZV0gPSB7XHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICB1cGxvYWRlZERhdGU6IG5ldyBEYXRlKGRhdGVTdHIpXHJcbiAgICB9O1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzZXRMb2NhbEZpbGUobmFtZTogTG9jYWxGaWxlTmFtZSwgZmlsZTogRmlsZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4ge1xyXG4gICAgICAgIGNvbnN0IGZyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICBmci5vbmxvYWQgPSAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpbGUgJyArIG5hbWUgKyAnIGxvYWRlZCcpO1xyXG4gICAgICAgICAgICBjb25zdCBidWZmZXIgPSBmci5yZXN1bHQgYXMgQXJyYXlCdWZmZXI7XHJcbiAgICAgICAgICAgIGNvbnN0IHVwbG9hZGVkRGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgICAgIGxvY2FsRmlsZXNbbmFtZV0gPSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhOiBuZXcgVWludDhBcnJheShidWZmZXIpLFxyXG4gICAgICAgICAgICAgICAgdXBsb2FkZWREYXRlOiB1cGxvYWRlZERhdGUsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJlbG9hZExvY2FsRmlsZShuYW1lKTtcclxuICAgICAgICAgICAgY29tcHJlc3NCdWZmZXJUb1N0cmluZyhidWZmZXIpLnRoZW4oZGF0YVN0ciA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZmlsZSAnICsgbmFtZSArICcgY29tcHJlc3NlZCcpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudCA9IGxvY2FsRmlsZXNbbmFtZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudCAmJiBjdXJyZW50LnVwbG9hZGVkRGF0ZS52YWx1ZU9mKCkgIT09IHVwbG9hZGVkRGF0ZS52YWx1ZU9mKCkpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oTE9DQUxTVE9SQUdFX1BSRUZJWCArIG5hbWUgKyAnL2RhdGEnLCBkYXRhU3RyKTtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShMT0NBTFNUT1JBR0VfUFJFRklYICsgbmFtZSArICcvdXBsb2FkZWQtZGF0ZScsIHVwbG9hZGVkRGF0ZS50b0lTT1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZmlsZSAnICsgbmFtZSArICcgc2F2ZWQgdG8gbG9jYWxTdG9yYWdlJyk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignbG9jYWxTdG9yYWdlIGVycm9yOiAnLCBlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBmci5yZWFkQXNBcnJheUJ1ZmZlcihmaWxlKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5jbGFzcyBTZXJpYWxpemF0aW9uUmVhZGVyIHtcclxuICAgIHByaXZhdGUgZHY6IERhdGFWaWV3O1xyXG4gICAgcHJpdmF0ZSBvZmZzZXQ6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihidWZmZXI6IEFycmF5QnVmZmVyKSB7XHJcbiAgICAgICAgdGhpcy5kdiA9IG5ldyBEYXRhVmlldyhidWZmZXIpO1xyXG4gICAgICAgIHRoaXMub2Zmc2V0ID0gMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2tpcChieXRlczogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gYnl0ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRJbnQ4KCkge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZHYuZ2V0SW50OCh0aGlzLm9mZnNldCk7XHJcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gMTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkSW50MTYoKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5kdi5nZXRJbnQxNih0aGlzLm9mZnNldCwgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gMjtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkSW50MzIoKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5kdi5nZXRJbnQzMih0aGlzLm9mZnNldCwgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gNDtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkQnl0ZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWFkSW50OCgpIHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZFVJbnQxNigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWFkSW50MTYoKSB8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRVSW50MzIoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZEludDMyKCkgfCAwO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkQm9vbGVhbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWFkSW50OCgpICE9PSAwO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVhZFVMRUIxMjgoKSB7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IDA7XHJcbiAgICAgICAgZm9yIChsZXQgc2hpZnQgPSAwOyA7IHNoaWZ0ICs9IDcpIHtcclxuICAgICAgICAgICAgY29uc3QgYnl0ZSA9IHRoaXMuZHYuZ2V0VWludDgodGhpcy5vZmZzZXQpO1xyXG4gICAgICAgICAgICB0aGlzLm9mZnNldCArPSAxO1xyXG4gICAgICAgICAgICByZXN1bHQgfD0gKGJ5dGUgJiAweDdmKSA8PCBzaGlmdDtcclxuICAgICAgICAgICAgaWYgKChieXRlICYgMHg4MCkgPT09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZFVpbnQ4QXJyYXkobGVuZ3RoOiBudW1iZXIpIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh0aGlzLmR2LmJ1ZmZlciwgdGhpcy5vZmZzZXQsIGxlbmd0aCk7XHJcbiAgICAgICAgdGhpcy5vZmZzZXQgKz0gbGVuZ3RoO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRTdHJpbmcoKSB7XHJcbiAgICAgICAgY29uc3QgaGVhZGVyID0gdGhpcy5yZWFkSW50OCgpO1xyXG4gICAgICAgIGlmIChoZWFkZXIgPT09IDApXHJcbiAgICAgICAgICAgIHJldHVybiAnJztcclxuICAgICAgICBjb25zdCBsZW5ndGggPSB0aGlzLnJlYWRVTEVCMTI4KCk7XHJcbiAgICAgICAgY29uc3QgYXJyYXkgPSB0aGlzLnJlYWRVaW50OEFycmF5KGxlbmd0aCk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBUZXh0RGVjb2RlcigndXRmLTgnKS5kZWNvZGUoYXJyYXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkSW50NjRSb3VuZGVkKCkge1xyXG4gICAgICAgIGNvbnN0IGxvID0gdGhpcy5kdi5nZXRVaW50MzIodGhpcy5vZmZzZXQsIHRydWUpO1xyXG4gICAgICAgIGNvbnN0IGhpID0gdGhpcy5kdi5nZXRVaW50MzIodGhpcy5vZmZzZXQgKyA0LCB0cnVlKTtcclxuICAgICAgICB0aGlzLm9mZnNldCArPSA4O1xyXG4gICAgICAgIHJldHVybiBoaSAqIDB4MTAwMDAwMDAwICsgbG87XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWREYXRlVGltZSgpIHtcclxuICAgICAgICAvLyBPRkZTRVQgPSA2MjEzNTU5NjgwMDAwMDAwMDAgPSB0aWNrcyBmcm9tIDAwMDEvMS8xIHRvIDE5NzAvMS8xXHJcbiAgICAgICAgbGV0IGxvID0gdGhpcy5yZWFkVUludDMyKCk7XHJcbiAgICAgICAgbGV0IGhpID0gdGhpcy5yZWFkVUludDMyKCk7XHJcbiAgICAgICAgbG8gLT0gMzQ0NDI5MzYzMjsgLy8gbG8gYml0cyBvZiBPRkZTRVRcclxuICAgICAgICBpZiAobG8gPCAwKSB7XHJcbiAgICAgICAgICAgIGxvICs9IDQyOTQ5NjcyOTY7ICAgLy8gMl4zMlxyXG4gICAgICAgICAgICBoaSAtPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBoaSAtPSAxNDQ2NzA1MDg7ICAvLyBoaSBiaXRzIG9mIE9GRlNFVFxyXG4gICAgICAgIGNvbnN0IHRpY2tzID0gaGkgKiA0Mjk0OTY3Mjk2ICsgbG87XHJcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKHRpY2tzICogMWUtNCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRTaW5nbGUoKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5kdi5nZXRGbG9hdDMyKHRoaXMub2Zmc2V0LCB0cnVlKTtcclxuICAgICAgICB0aGlzLm9mZnNldCArPSA0O1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWREb3VibGUoKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5kdi5nZXRGbG9hdDY0KHRoaXMub2Zmc2V0LCB0cnVlKTtcclxuICAgICAgICB0aGlzLm9mZnNldCArPSA4O1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRMaXN0KGNhbGxiYWNrOiAoaW5kZXg6IG51bWJlcikgPT4gYW55KSB7XHJcbiAgICAgICAgY29uc3QgY291bnQgPSB0aGlzLnJlYWRJbnQzMigpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkgKz0gMSlcclxuICAgICAgICAgICAgY2FsbGJhY2soaSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEJlYXRtYXBJbmZvIHtcclxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmVhdG1hcElkOiBudW1iZXIsXHJcbiAgICAgICAgcHVibGljIHJlYWRvbmx5IGxhc3RQbGF5ZWQ6IERhdGUsXHJcbiAgICAgICAgcHVibGljIHJlYWRvbmx5IHJhbmtBY2hpZXZlZDogbnVtYmVyKSB7fVxyXG59XHJcblxyXG5mdW5jdGlvbiByZWFkQmVhdG1hcChzcjogU2VyaWFsaXphdGlvblJlYWRlcikge1xyXG4gICAgY29uc3QgU2l6ZUluQnl0ZXMgPSBzci5yZWFkSW50MzIoKTtcclxuXHJcbiAgICBjb25zdCBBcnRpc3QgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBBcnRpc3RVbmljb2RlID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgVGl0bGUgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBUaXRsZVVuaWNvZGUgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBDcmVhdG9yID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgVmVyc2lvbiA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IEF1ZGlvRmlsZW5hbWUgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBCZWF0bWFwQ2hlY2tzdW0gPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBGaWxlbmFtZSA9IHNyLnJlYWRTdHJpbmcoKTtcclxuICAgIGNvbnN0IFN1Ym1pc3Npb25TdGF0dXMgPSBzci5yZWFkQnl0ZSgpO1xyXG4gICAgY29uc3QgY291bnROb3JtYWwgPSBzci5yZWFkVUludDE2KCk7XHJcbiAgICBjb25zdCBjb3VudFNsaWRlciA9IHNyLnJlYWRVSW50MTYoKTtcclxuICAgIGNvbnN0IGNvdW50U3Bpbm5lciA9IHNyLnJlYWRVSW50MTYoKTtcclxuICAgIGNvbnN0IERhdGVNb2RpZmllZCA9IHNyLnJlYWREYXRlVGltZSgpO1xyXG5cclxuICAgIGNvbnN0IERpZmZpY3VsdHlBcHByb2FjaFJhdGUgPSBzci5yZWFkU2luZ2xlKCk7XHJcbiAgICBjb25zdCBEaWZmaWN1bHR5Q2lyY2xlU2l6ZSA9IHNyLnJlYWRTaW5nbGUoKTtcclxuICAgIGNvbnN0IERpZmZpY3VsdHlIcERyYWluUmF0ZSA9IHNyLnJlYWRTaW5nbGUoKTtcclxuICAgIGNvbnN0IERpZmZpY3VsdHlPdmVyYWxsID0gc3IucmVhZFNpbmdsZSgpO1xyXG5cclxuICAgIGNvbnN0IERpZmZpY3VsdHlTbGlkZXJNdWx0aXBsaWVyID0gc3IucmVhZERvdWJsZSgpO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSArPSAxKSB7XHJcbiAgICAgICAgc3IucmVhZExpc3QoKCkgPT4ge1xyXG4gICAgICAgICAgICBzci5yZWFkSW50MzIoKTtcclxuICAgICAgICAgICAgc3IucmVhZEludDE2KCk7XHJcbiAgICAgICAgICAgIHNyLnJlYWREb3VibGUoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBEcmFpbkxlbmd0aCA9IHNyLnJlYWRJbnQzMigpO1xyXG4gICAgY29uc3QgVG90YWxMZW5ndGggPSBzci5yZWFkSW50MzIoKTtcclxuICAgIGNvbnN0IFByZXZpZXdUaW1lID0gc3IucmVhZEludDMyKCk7XHJcbiAgICBzci5yZWFkTGlzdCgoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgQmVhdExlbmd0aCA9IHNyLnJlYWREb3VibGUoKTtcclxuICAgICAgICBjb25zdCBPZmZzZXQgPSBzci5yZWFkRG91YmxlKCk7XHJcbiAgICAgICAgY29uc3QgVGltaW5nQ2hhbmdlID0gc3IucmVhZEJvb2xlYW4oKTtcclxuICAgIH0pO1xyXG4gICAgY29uc3QgQmVhdG1hcElkID0gc3IucmVhZEludDMyKCk7XHJcbiAgICBjb25zdCBCZWF0bWFwU2V0SWQgPSBzci5yZWFkSW50MzIoKTtcclxuICAgIGNvbnN0IEJlYXRtYXBUb3BpY0lkID0gc3IucmVhZEludDMyKCk7XHJcbiAgICBjb25zdCBQbGF5ZXJSYW5rT3N1ID0gc3IucmVhZEJ5dGUoKTtcclxuICAgIGNvbnN0IFBsYXllclJhbmtGcnVpdHMgPSBzci5yZWFkQnl0ZSgpO1xyXG4gICAgY29uc3QgUGxheWVyUmFua1RhaWtvID0gc3IucmVhZEJ5dGUoKTtcclxuICAgIGNvbnN0IFBsYXllclJhbmtNYW5pYSA9IHNyLnJlYWRCeXRlKCk7XHJcbiAgICBjb25zdCBQbGF5ZXJPZmZzZXQgPSBzci5yZWFkSW50MTYoKTtcclxuICAgIGNvbnN0IFN0YWNrTGVuaWVuY3kgPSBzci5yZWFkU2luZ2xlKCk7XHJcbiAgICBjb25zdCBQbGF5TW9kZSA9IHNyLnJlYWRCeXRlKCk7XHJcbiAgICBjb25zdCBTb3VyY2UgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBUYWdzID0gc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgT25saW5lT2Zmc2V0ID0gc3IucmVhZEludDE2KCk7XHJcbiAgICBjb25zdCBPbmxpbmVEaXNwbGF5VGl0bGUgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBOZXdGaWxlID0gc3IucmVhZEJvb2xlYW4oKTtcclxuICAgIGNvbnN0IERhdGVMYXN0UGxheWVkID0gc3IucmVhZERhdGVUaW1lKCk7XHJcbiAgICBjb25zdCBJbk9zekNvbnRhaW5lciA9IHNyLnJlYWRCb29sZWFuKCk7XHJcbiAgICBjb25zdCBDb250YWluaW5nRm9sZGVyQWJzb2x1dGUgPSBzci5yZWFkU3RyaW5nKCk7XHJcbiAgICBjb25zdCBMYXN0SW5mb1VwZGF0ZSA9IHNyLnJlYWREYXRlVGltZSgpO1xyXG4gICAgY29uc3QgRGlzYWJsZVNhbXBsZXMgPSBzci5yZWFkQm9vbGVhbigpO1xyXG4gICAgY29uc3QgRGlzYWJsZVNraW4gPSBzci5yZWFkQm9vbGVhbigpO1xyXG4gICAgY29uc3QgRGlzYWJsZVN0b3J5Ym9hcmQgPSBzci5yZWFkQm9vbGVhbigpO1xyXG4gICAgY29uc3QgRGlzYWJsZVZpZGVvID0gc3IucmVhZEJvb2xlYW4oKTtcclxuICAgIGNvbnN0IFZpc3VhbFNldHRpbmdzT3ZlcnJpZGUgPSBzci5yZWFkQm9vbGVhbigpO1xyXG5cclxuICAgIGNvbnN0IExhc3RFZGl0VGltZSA9IHNyLnJlYWRJbnQzMigpO1xyXG4gICAgY29uc3QgTWFuaWFTcGVlZCA9IHNyLnJlYWRCeXRlKCk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBCZWF0bWFwSW5mbyhcclxuICAgICAgICBCZWF0bWFwSWQsXHJcbiAgICAgICAgbmV3IERhdGUoTWF0aC5tYXgoTUlOSU1VTV9EQVRFLnZhbHVlT2YoKSwgRGF0ZUxhc3RQbGF5ZWQudmFsdWVPZigpKSksXHJcbiAgICAgICAgUGxheWVyUmFua0ZydWl0cyk7XHJcbn1cclxuXHJcbmNvbnN0IGJlYXRtYXBJbmZvTWFwID0gbmV3IE1hcDxudW1iZXIsIEJlYXRtYXBJbmZvPigpO1xyXG5sZXQgYmVhdG1hcEluZm9NYXBWZXJzaW9uID0gTUlOSU1VTV9EQVRFO1xyXG5cclxuZnVuY3Rpb24gbG9hZE9zdURCKGJ1ZmZlcjogQXJyYXlCdWZmZXIsIHZlcnNpb246IERhdGUpIHtcclxuICAgIGJlYXRtYXBJbmZvTWFwLmNsZWFyKCk7XHJcbiAgICBjb25zdCBzciA9IG5ldyBTZXJpYWxpemF0aW9uUmVhZGVyKGJ1ZmZlcik7XHJcbiAgICBzci5za2lwKDQgKyA0ICsgMSArIDgpO1xyXG4gICAgc3IucmVhZFN0cmluZygpO1xyXG4gICAgY29uc3QgYmVhdG1hcENvdW50ID0gc3IucmVhZEludDMyKCk7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiZWF0bWFwQ291bnQ7IGkgKz0gMSkge1xyXG4gICAgICAgIGNvbnN0IGJlYXRtYXAgPSByZWFkQmVhdG1hcChzcik7XHJcbiAgICAgICAgaWYgKGJlYXRtYXAuYmVhdG1hcElkID4gMClcclxuICAgICAgICAgICAgYmVhdG1hcEluZm9NYXAuc2V0KGJlYXRtYXAuYmVhdG1hcElkLCBiZWF0bWFwKTtcclxuICAgIH1cclxuXHJcbiAgICBiZWF0bWFwSW5mb01hcFZlcnNpb24gPSB2ZXJzaW9uO1xyXG59XHJcblxyXG4kKCgpID0+IHtcclxuICAgIFByb21pc2UuYWxsKFxyXG4gICAgICAgIChbJ29zdSEuZGInLCAnc2NvcmVzLmRiJ10gYXMgTG9jYWxGaWxlTmFtZVtdKVxyXG4gICAgICAgICAgICAubWFwKG5hbWUgPT5cclxuICAgICAgICAgICAgICAgIGxvYWRGcm9tTG9jYWxTdG9yYWdlKG5hbWUpXHJcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gcmVsb2FkTG9jYWxGaWxlKG5hbWUpKSkpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIGlmIChpbml0VW5zb3J0ZWRUYWJsZVJvd3MoKSlcclxuICAgICAgICAgICAgZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc2V0UXVlcnlBY2NvcmRpbmdUb0hhc2goKTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgKCkgPT4ge1xyXG4gICAgICAgIHNldFF1ZXJ5QWNjb3JkaW5nVG9IYXNoKCk7XHJcbiAgICAgICAgZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpO1xyXG4gICAgfSk7XHJcbiAgICBjb25zdCBvbkNoYW5nZSA9ICgpID0+IHtcclxuICAgICAgICBkcmF3VGFibGVGb3JDdXJyZW50RmlsdGVyaW5nKCk7XHJcbiAgICB9O1xyXG4gICAgZm9yIChjb25zdCBpZCBvZiBbJ2ZpbHRlci1hcHByb3ZlZC1zdGF0dXMnLCAnZmlsdGVyLW1vZGUnLCAnZmlsdGVyLWZjLWxldmVsJywgJ2ZpbHRlci1sb2NhbC1kYXRhJywgJ3Nob3ctZnVsbC1yZXN1bHQnXSlcclxuICAgICAgICAkKGAjJHtpZH1gKS5vbignY2hhbmdlJywgb25DaGFuZ2UpO1xyXG4gICAgZm9yIChjb25zdCBpZCBvZiBbJ2ZpbHRlci1zZWFyY2gtcXVlcnknXSlcclxuICAgICAgICAkKGAjJHtpZH1gKS5vbignaW5wdXQnLCBvbkNoYW5nZSk7XHJcblxyXG4gICAgY29uc3QgdGhMaXN0ID0gJCgnI3N1bW1hcnktdGFibGUgPiB0aGVhZCA+IHRyID4gdGgnKTtcclxuICAgIHNvcnRLZXlzLmZvckVhY2goKF8sIGluZGV4KSA9PiB7XHJcbiAgICAgICAgJC5kYXRhKHRoTGlzdFtpbmRleF0sICd0aEluZGV4JywgaW5kZXgpO1xyXG4gICAgfSk7XHJcbiAgICBjb25zdCBsb2FkRGF0YSA9IChkYXRhOiBTdW1tYXJ5Um93RGF0YVtdLCBsYXN0TW9kaWZpZWQ6IERhdGUpID0+IHtcclxuICAgICAgICAkKCcjbGFzdC11cGRhdGUtdGltZScpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoJCgnPHRpbWU+JylcclxuICAgICAgICAgICAgICAgIC5hdHRyKCdkYXRldGltZScsIGxhc3RNb2RpZmllZC50b0lTT1N0cmluZygpKVxyXG4gICAgICAgICAgICAgICAgLnRleHQobGFzdE1vZGlmaWVkLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSkpO1xyXG4gICAgICAgIHN1bW1hcnlSb3dzID0gZGF0YS5tYXAoeCA9PiBuZXcgU3VtbWFyeVJvdyh4KSk7XHJcbiAgICAgICAgaW5pdFVuc29ydGVkVGFibGVSb3dzKCk7XHJcbiAgICAgICAgZHJhd1RhYmxlRm9yQ3VycmVudEZpbHRlcmluZygpO1xyXG4gICAgICAgICQoJyNzdW1tYXJ5LXRhYmxlLWxvYWRlcicpLmhpZGUoKTtcclxuICAgIH07XHJcbiAgICAkLmdldEpTT04oJ2RhdGEvc3VtbWFyeS5qc29uJykudGhlbigoZGF0YSwgXywgeGhyKSA9PiB7XHJcbiAgICAgICAgbG9hZERhdGEoZGF0YSwgbmV3IERhdGUoeGhyLmdldFJlc3BvbnNlSGVhZGVyKCdMYXN0LU1vZGlmaWVkJykgYXMgc3RyaW5nKSk7XHJcbiAgICB9KTtcclxuICAgIHRoTGlzdC5jbGljaygoZXZlbnQpID0+IHtcclxuICAgICAgICBjb25zdCB0aCA9ICQoZXZlbnQudGFyZ2V0KTtcclxuICAgICAgICBsZXQgc2lnbjtcclxuICAgICAgICBpZiAodGguaGFzQ2xhc3MoJ3NvcnRlZCcpKVxyXG4gICAgICAgICAgICBzaWduID0gdGguaGFzQ2xhc3MoJ2Rlc2NlbmRpbmcnKSA/IDEgOiAtMTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHNpZ24gPSB0aC5oYXNDbGFzcygnZGVzYy1maXJzdCcpID8gLTEgOiAxO1xyXG4gICAgICAgIGNvbnN0IHRoSW5kZXggPSB0aC5kYXRhKCd0aEluZGV4JykgYXMgbnVtYmVyO1xyXG4gICAgICAgIGN1cnJlbnRTb3J0T3JkZXIucHVzaCgodGhJbmRleCArIDEpICogc2lnbik7XHJcbiAgICAgICAgY3VycmVudFNvcnRPcmRlciA9IHNpbXBseVNvcnRPcmRlcihjdXJyZW50U29ydE9yZGVyKTtcclxuICAgICAgICBzZXRUYWJsZUhlYWRTb3J0aW5nTWFyaygpO1xyXG4gICAgICAgIGRyYXdUYWJsZUZvckN1cnJlbnRGaWx0ZXJpbmcoKTtcclxuICAgIH0pO1xyXG4gICAgJCgnI2RiLWZpbGUtaW5wdXQnKS5jaGFuZ2UoYXN5bmMgZXZlbnQgPT4ge1xyXG4gICAgICAgIGNvbnN0IGVsZW0gPSBldmVudC50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudDtcclxuICAgICAgICBpZiAoIWVsZW0uZmlsZXMpIHJldHVybjtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsZW0uZmlsZXMubGVuZ3RoOyBpICs9IDEpIHtcclxuICAgICAgICAgICAgY29uc3QgZmlsZSA9IGVsZW0uZmlsZXNbaV07XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBmaWxlLm5hbWU7XHJcbiAgICAgICAgICAgIGlmIChuYW1lLmluZGV4T2YoJ29zdSEuZGInKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHNldExvY2FsRmlsZSgnb3N1IS5kYicsIGZpbGUpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUuaW5kZXhPZignc2NvcmVzLmRiJykgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBzZXRMb2NhbEZpbGUoJ3Njb3Jlcy5kYicsIGZpbGUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2hvd0Vycm9yTWVzc2FnZShgSW52YWxpZCBmaWxlICR7bmFtZX06IFBsZWFzZSBzZWxlY3Qgb3N1IS5kYiBvciBzY29yZXMuZGJgKTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpbml0VW5zb3J0ZWRUYWJsZVJvd3MoKSlcclxuICAgICAgICAgICAgICAgIGRyYXdUYWJsZUZvckN1cnJlbnRGaWx0ZXJpbmcoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxlbS52YWx1ZSA9ICcnO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxufVxyXG4iXX0=