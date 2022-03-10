export enum Mods {
    NONE = 0,
    EASY = 2,
    HIDDEN = 8,
    HARD_ROCK = 16,
    DOUBLE_TIME = 64,
    HALF_TIME = 256,
    FLASHLIGHT = 1024,
}

export enum ApprovalStatus {
    RANKED = 1,
    APPROVED = 2,
    QUALIFIED = 3,
    LOVED = 4,
}

export enum RulesetId {
    OSU = 0,
    CATCH = 2,
}

export function calculateClockRate(mods: Mods): number {
    let rate = 1;
    if (mods & Mods.DOUBLE_TIME) rate *= 1.5;
    if (mods & Mods.HALF_TIME) rate *= 0.75;
    return rate;
}

export function calculateApproachRate(ar: number, mods: Mods): number {
    if (mods & Mods.HARD_ROCK) ar = Math.min(ar * 1.5, 10);
    if (mods & Mods.EASY) ar /= 2;

    const clockRate = calculateClockRate(mods);
    const preempt =
        (ar < 5 ? 1200 + (5 - ar) * 120 : 1200 - (ar - 5) * 150) / clockRate;
    return preempt > 1200 ? (1800 - preempt) / 120 : 5 + (1200 - preempt) / 150;
}

export function calculateCircleSize(cs: number, mods: Mods): number {
    if (mods & Mods.HARD_ROCK) cs = Math.min(cs * 1.3, 10);
    if (mods & Mods.EASY) cs /= 2;
    return cs;
}

// version 2020-03
export function calculatePerformancePoint(
    stars: number,
    maxCombo: number,
    ar: number,
    mods: Mods = Mods.NONE,
    combo: number = maxCombo,
    miss = 0
): number {
    let value = Math.pow(5 * Math.max(1, stars / 0.0049) - 4, 2) / 100000;

    const lengthFactor =
        0.95 +
        0.3 * Math.min(1, maxCombo / 2500) +
        0.475 * Math.max(0, Math.log10(maxCombo / 2500));
    value *= lengthFactor;

    if (maxCombo > 0) value *= Math.min(Math.pow(combo / maxCombo, 0.8), 1);

    const arFactor =
        1 +
        0.1 * Math.max(0, ar - 9) +
        0.1 * Math.max(0, ar - 10) +
        0.025 * Math.max(0, 8 - ar);
    value *= arFactor;

    value *= Math.pow(0.97, miss);

    if (mods & Mods.HIDDEN) {
        if (ar <= 10) value *= 1.05 + 0.075 * (10 - ar);
        else value *= 1.01 + 0.04 * (11 - Math.min(11, ar));
    }

    if (mods & Mods.FLASHLIGHT) value *= 1.35 * lengthFactor;

    return value;
}

export class SerializationReader {
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
            if ((byte & 0x80) === 0) return result;
        }
    }

    public readUint8Array(length: number) {
        const result = new Uint8Array(this.dv.buffer, this.offset, length);
        this.offset += length;
        return result;
    }

    public readString() {
        const header = this.readInt8();
        if (header === 0) return "";
        const length = this.readULEB128();
        const array = this.readUint8Array(length);
        return new TextDecoder("utf-8").decode(array);
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
            lo += 4294967296; // 2^32
            hi -= 1;
        }
        hi -= 144670508; // hi bits of OFFSET
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

    public readList(callback: (index: number) => void) {
        const count = this.readInt32();
        for (let i = 0; i < count; i += 1) callback(i);
    }
}
