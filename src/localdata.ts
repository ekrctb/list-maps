interface LocalDataFileChange {
    kind: 'localdata',
    file: File | null,
}

class SerializationReader {
    private dv: DataView;
    private offset: number;

    constructor(buffer: ArrayBuffer) {
        this.dv = new DataView(buffer);
        this.offset = 0;
    }

    public skip(bytes: number) {
        this.offset += bytes;
    }

    public readInt8() {
        const result = this.dv.getInt8(this.offset);
        this.offset += 1;
        return result;
    }

    public readInt16() {
        const result = this.dv.getInt16(this.offset, true);
        this.offset += 2;
        return result;
    }

    public readInt32() {
        const result = this.dv.getInt32(this.offset, true);
        this.offset += 4;
        return result;
    }

    public readByte() {
        return this.readInt8() | 0;
    }

    public readUInt16() {
        return this.readInt16() | 0;
    }

    public readUInt32() {
        return this.readInt32() | 0;
    }

    public readBoolean() {
        return this.readInt8() !== 0;
    }

    private readULEB128() {
        let result = 0;
        for (let shift = 0; ; shift += 7) {
            const byte = this.dv.getUint8(this.offset);
            this.offset += 1;
            result |= (byte & 0x7f) << shift;
            if ((byte & 0x80) === 0)
                return result;
        }
    }

    public readUint8Array(length: number) {
        const result = new Uint8Array(this.dv.buffer, this.offset, length);
        this.offset += length;
        return result;
    }

    public readString() {
        const header = this.readInt8();
        if (header === 0)
            return '';
        const length = this.readULEB128();
        const array = this.readUint8Array(length);
        return new TextDecoder('utf-8').decode(array);
    }

    public readInt64Rounded() {
        const lo = this.dv.getUint32(this.offset, true);
        const hi = this.dv.getUint32(this.offset + 4, true);
        this.offset += 8;
        return hi * 0x100000000 + lo;
    }

    public readDateTime() {
        // OFFSET = 621355968000000000 = ticks from 0001/1/1 to 1970/1/1
        let lo = this.readUInt32();
        let hi = this.readUInt32();
        lo -= 3444293632; // lo bits of OFFSET
        if (lo < 0) {
            lo += 4294967296;   // 2^32
            hi -= 1;
        }
        hi -= 144670508;  // hi bits of OFFSET
        const ticks = hi * 4294967296 + lo;
        return new Date(ticks * 1e-4);
    }

    public readSingle() {
        const result = this.dv.getFloat32(this.offset, true);
        this.offset += 4;
        return result;
    }

    public readDouble() {
        const result = this.dv.getFloat64(this.offset, true);
        this.offset += 8;
        return result;
    }

    public readList(callback: (index: number) => any) {
        const count = this.readInt32();
        for (let i = 0; i < count; i += 1)
            callback(i);
    }
}

class LocalDataInfo {
    public readonly hasLastPlayedDate: boolean;
    public readonly hasAnyInfo: boolean;

    public constructor(
        public readonly beatmapId: number,
        public readonly isUnplayed: boolean,
        public readonly lastPlayedDate: Date,
        public readonly rankAchived: number,
    ) {
        this.hasLastPlayedDate = lastPlayedDate.valueOf() >= 0;
        this.hasAnyInfo = !this.isUnplayed || this.hasLastPlayedDate || rankAchived !== 9;
    }

    public static readonly RANK_NAMES = [
        'SSH', 'SH', 'SS', 'S', 'A',
        'B', 'C', 'D', 'F', '-'
    ];
}

class StableDatabase {
    public readonly infoMap: Map<number, LocalDataInfo> = new Map();

    public clear() {
        this.infoMap.clear();
    }

    public load(buffer: ArrayBuffer) {
        const sr = new SerializationReader(buffer);
        const dbVersion = sr.readInt32();

        sr.readInt32();
        sr.readBoolean();
        sr.readDateTime();
        sr.readString();
        const beatmapCount = sr.readInt32();

        for (let i = 0; i < beatmapCount; i += 1) {
            let beatmap = this.readBeatmap(sr, dbVersion);
            if (beatmap.beatmapId !== 0)
                this.infoMap.set(beatmap.beatmapId, beatmap);
        }

        console.log(`loaded ${beatmapCount} local beatmaps.`);
    }

    private readBeatmap(sr: SerializationReader, dbVersion: number): LocalDataInfo {
        const ver1 = dbVersion < 20140609;
        const ver2 = !ver1 && dbVersion < 20191106;
        const ver3 = !ver2;

        if (!ver3) sr.readInt32();

        sr.readString();    // artist name
        sr.readString();    // artist name unicode
        sr.readString();    // song title
        sr.readString();    // song title unicode
        sr.readString();    // creator name
        sr.readString();    // difficulty
        sr.readString();    // audio file name
        sr.readString();    // hash
        sr.readString();    // beatmap file name
        sr.readByte();      // ranked status
        sr.readUInt16();
        sr.readUInt16();
        sr.readUInt16();
        sr.readDateTime();  // last modified

        sr.readSingle();
        sr.readSingle();
        sr.readSingle();
        sr.readSingle();

        sr.readDouble();

        if (!ver1) {
            for (let i = 0; i < 4; i += 1) {
                sr.readList(() => {
                    sr.readInt32();
                    sr.readInt16();
                    sr.readDouble();
                });
            }
        }

        sr.readInt32();
        sr.readInt32();
        sr.readInt32();

        // timing points
        sr.readList(() => {
            sr.readDouble();
            sr.readDouble();
            sr.readBoolean();
        });

        const beatmapId = sr.readInt32(); // beatmap id
        sr.readInt32(); // beatmap set id
        sr.readInt32(); // thread id

        // Note: wiki has wrong information
        sr.readByte();
        const osuCatchRankAchieved = sr.readByte();
        sr.readByte();
        sr.readByte();

        sr.readInt16();
        sr.readSingle();
        sr.readByte();

        sr.readString();
        sr.readString();

        sr.readInt16();
        sr.readString();

        const isUnplayed = sr.readBoolean();   // is unplayed
        const lastPlayed = sr.readDateTime();

        sr.readBoolean();
        sr.readString();
        sr.readDateTime();

        sr.readBoolean();
        sr.readBoolean();
        sr.readBoolean();
        sr.readBoolean();
        sr.readBoolean();

        if (ver1) sr.readInt16();

        sr.readInt32();
        sr.readByte();

        return new LocalDataInfo(beatmapId, isUnplayed, lastPlayed, osuCatchRankAchieved);
    }
}

class LocalDataTab {
    public readonly stableDatabase = new StableDatabase();

    public constructor(private readonly eventSink: EventSink<LocalDataFileChange>) { }

    public initialize(element: Element) {
        const fileInput = element.children[0].children[0].children[1];
        assertElement<HTMLInputElement>(fileInput, 'input');

        this.onFileChange(fileInput);
    }

    public renderTo(element: Element) {
        const column = element.children[0].children[0];
        const fileInput = column.children[1];
        assertElement<HTMLInputElement>(fileInput, 'input');

        if (fileInput.onchange === null) {
            fileInput.onchange = () => this.onFileChange(fileInput);;
            this.eventSink.registerStopCallback(() => fileInput.onchange = null);
        }
    }

    private onFileChange(fileInput: HTMLInputElement) {
        const file = Array.from(fileInput.files!).find(file => file.name.includes('osu!.db')) ?? null;
        this.eventSink.trigger({ kind: 'localdata', file });
    }
}
