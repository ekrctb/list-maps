
enum FCMods {
    NONE = 1,
    HD = 2,
    FL = 4,
    HDFL = 8,
}

const DIFFICULTY_MODS: Mods[] = [
    0, 2, 16, 64, 66, 80, 256, 258, 272
];

class BeatmapMetadata {
    public readonly approvedDate: Date;
    public readonly displayStringLowerCased: string;

    public constructor(
        public readonly beatmapSetId: number,
        public readonly beatmapId: number,
        public readonly approvedDateString: string,
        public readonly approvalStatus: number,
        public readonly rulesetId: number,
        public readonly displayString: string,
        public readonly hitLength: number,
        public readonly maxCombo: number,
        public readonly approachRate: number,
        public readonly circleSize: number,
    ) {
        this.approvedDate = new Date(approvedDateString.replace(' ', 'T'));
        this.displayStringLowerCased = displayString.toLowerCase();
    }
}

class PerModsInfo {
    public readonly performancePoint: number;

    public constructor(
        public readonly beatmapId: number,
        public readonly mods: Mods,
        public readonly maxCombo: number,
        public readonly stars: number,
        public readonly hitLength: number,
        public readonly approachRate: number,
        public readonly circleSize: number,
        public readonly fcCount: number,
        public readonly fcMods: FCMods,
    ) {
        this.performancePoint = calculatePerformancePoint(stars, maxCombo, approachRate, mods);
    }

    public static parse(line: string, getBeatmapMetadata: (id: number) => BeatmapMetadata): PerModsInfo {
        const values = JSON.parse(`[${line}]`) as any[];
        const beatmapId = values[0] as number;
        const meta = getBeatmapMetadata(beatmapId);
        const mods = values[1] as Mods;
        const hitLength = meta.hitLength / calculateClockRate(mods);
        const approachRate = calculateApproachRate(meta.approachRate, mods);
        const circleSize = calculateCircleSize(meta.circleSize, mods);
        return new PerModsInfo(
            beatmapId, mods,
            meta.maxCombo, values[2],
            hitLength, approachRate, circleSize,
            values[3], values[4]);
    }
}

class BeatmapInfo {
    public readonly perMods: Map<Mods, PerModsInfo>;
    public readonly anyMods: PerModsInfo;
    public currentMods: PerModsInfo;
    public localDataInfo: LocalDataInfo | null = null;

    public constructor(
        public readonly meta: BeatmapMetadata,
        noModStars: number,
        public readonly totalFCCount: number,
        public readonly totalFCMods: FCMods,
    ) {
        this.perMods = new Map();
        this.anyMods = new PerModsInfo(
            meta.beatmapId, Mods.NONE,
            meta.maxCombo, noModStars,
            meta.hitLength, meta.approachRate, meta.circleSize,
            totalFCCount, totalFCMods);
        this.currentMods = this.anyMods;
    }

    public static parse(line: string): BeatmapInfo {
        const values = JSON.parse(`[${line}]`) as any[];
        const meta = new BeatmapMetadata(
            values[1], values[2], values[0],
            values[3], values[4], values[5],
            values[6], values[8],
            values[9], values[10]);
        return new BeatmapInfo(meta, values[7], values[11], values[12]);
    }
}
