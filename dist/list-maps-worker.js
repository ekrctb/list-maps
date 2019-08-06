"use strict";
var ListMaps;
(function (ListMaps) {
    importScripts('https://cdn.jsdelivr.net/pako/1.0.3/pako.min.js');
    onmessage = (event) => {
        const data = event.data;
        if (data.type === 'compress') {
            const compressed = pako.deflate(data.data);
            postMessage({
                type: 'callback',
                id: data.id,
                data: compressed
            });
        }
        else if (data.type === 'decompress') {
            const decompressed = pako.inflate(data.data);
            postMessage({
                type: 'callback',
                id: data.id,
                data: decompressed
            });
        }
    };
})(ListMaps || (ListMaps = {}));
//# sourceMappingURL=list-maps-worker.js.map