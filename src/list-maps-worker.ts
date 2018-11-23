
declare function importScripts(_: any): any;
declare function postMessage(_: any): any;

namespace ListMaps {

importScripts('https://cdn.jsdelivr.net/pako/1.0.3/pako.min.js');

onmessage = (event: MessageEvent) => {
    const data = event.data;
    if (data.type === 'compress') {
        const compressed = pako.deflate(data.data);
        postMessage({
            type: 'callback',
            id: data.id,
            data: compressed
        });
    } else if (data.type === 'decompress') {
        const decompressed = pako.inflate(data.data);
        postMessage({
            type: 'callback',
            id: data.id,
            data: decompressed
        });
    }
};

}
