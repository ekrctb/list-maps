import {
    Mods,
    RulesetId,
    calculatePerformancePoint,
    calculateClockRate,
    calculateApproachRate,
    calculateCircleSize,
    SerializationReader,
} from "../osu.js";
import { sortInPlaceDefaultOrder } from "./sort.js";

export interface DataState {
    beatmapSummary: BeatmapSummary[];
    loadedMods: Map<ModCombination, number>;
    perMods: PerModsInfo[][];
    localData: Map<number, LocalDataInfo>;
    originDate: Date;
}

export type DataAction =
    | { type: "loadBeatmapSummary"; lines: string[] }
    | { type: "loadPerModsInfo"; mods: Mods; lines: string[] }
    | { type: "loadLocalData"; buffer: ArrayBuffer | null };

export type ModCombination = Mods | -1;

type SummaryDataLineType = [
    string, // approved_date
    number, // set_id
    number, // map_id
    number, // status
    RulesetId, // mode
    string, // title
    number, // hit_length
    number, // bpm
    number, // nm_stars
    number, // max_combo
    number, // ar
    number, // cs
    number, // total_fc
    FCMods, // total_fc_flags
    number // track_id
];

type ModsDataLineType = [
    number, // map_id
    Mods, // mods
    number, // stars
    number, // fc_count
    FCMods // fc_flags
];

export const ANY_MODS = -1 as const;

export enum FCMods {
    NONE = 1,
    HD = 2,
    FL = 4,
    HDFL = 8,
}

export const MOD_COMBINATIONS: ModCombination[] = [
    ANY_MODS,
    Mods.NONE,
    Mods.EASY,
    Mods.HARD_ROCK,
    Mods.DOUBLE_TIME,
    Mods.EASY | Mods.DOUBLE_TIME,
    Mods.HARD_ROCK | Mods.DOUBLE_TIME,
    Mods.HALF_TIME,
    Mods.EASY | Mods.HALF_TIME,
    Mods.HARD_ROCK | Mods.HALF_TIME,
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
        public readonly bpm: number,
        public readonly maxCombo: number,
        public readonly approachRate: number,
        public readonly circleSize: number,
        public readonly trackId: number
    ) {
        this.approvedDate = new Date(approvedDateString.replace(" ", "T"));
        this.displayStringLowerCased = displayString.toLowerCase();
    }
}

export class PerModsInfo {
    public readonly performancePoint: number;

    public constructor(
        public readonly beatmapId: number,
        public readonly mods: ModCombination,
        public readonly maxCombo: number,
        public readonly stars: number,
        public readonly hitLength: number,
        public readonly bpm: number,
        public readonly approachRate: number,
        public readonly circleSize: number,
        public readonly fcCount: number,
        public readonly fcMods: FCMods
    ) {
        this.performancePoint = calculatePerformancePoint(
            stars,
            maxCombo,
            approachRate,
            mods
        );
    }

    public static parse(line: string, meta: BeatmapMetadata): PerModsInfo {
        const values = JSON.parse(`[${line}]`) as ModsDataLineType;
        const beatmapId = values[0];
        const mods = values[1];
        const clockRate = calculateClockRate(mods);
        const hitLength = meta.hitLength / clockRate;
        const bpm = meta.bpm * clockRate;
        const approachRate = calculateApproachRate(meta.approachRate, mods);
        const circleSize = calculateCircleSize(meta.circleSize, mods);
        return new PerModsInfo(
            beatmapId,
            mods,
            meta.maxCombo,
            values[2],
            hitLength,
            bpm,
            approachRate,
            circleSize,
            values[3],
            values[4]
        );
    }

    public static createAny(summary: BeatmapSummary): PerModsInfo {
        const { meta } = summary;
        return new PerModsInfo(
            meta.beatmapId,
            ANY_MODS,
            meta.maxCombo,
            summary.noModStars,
            meta.hitLength,
            meta.bpm,
            meta.approachRate,
            meta.circleSize,
            summary.totalFCCount,
            summary.totalFCMods
        );
    }
}

export class LocalDataInfo {
    public readonly hasLastPlayedDate: boolean;
    public readonly hasAnyInfo: boolean;

    public constructor(
        public readonly beatmapId: number,
        public readonly isUnplayed: boolean,
        public readonly lastPlayedDate: Date,
        public readonly rankAchived: number
    ) {
        this.hasLastPlayedDate = lastPlayedDate.valueOf() >= 0;
        this.hasAnyInfo =
            !this.isUnplayed || this.hasLastPlayedDate || rankAchived !== 9;
    }

    public static readonly RANK_NAMES = [
        "SSH",
        "SH",
        "SS",
        "S",
        "A",
        "B",
        "C",
        "D",
        "F",
        "-",
    ];
}

function parseOsuStableDatabase(
    buffer: ArrayBuffer
): Map<number, LocalDataInfo> {
    const sr = new SerializationReader(buffer);
    const dbVersion = sr.readInt32();

    const readBeatmap = () => {
        const ver1 = dbVersion < 20140609;
        const ver2 = !ver1 && dbVersion < 20191106;
        const ver3 = !ver2;

        if (!ver3) sr.readInt32();

        sr.readString(); // artist name
        sr.readString(); // artist name unicode
        sr.readString(); // song title
        sr.readString(); // song title unicode
        sr.readString(); // creator name
        sr.readString(); // difficulty
        sr.readString(); // audio file name
        sr.readString(); // hash
        sr.readString(); // beatmap file name
        sr.readByte(); // ranked status
        sr.readUInt16();
        sr.readUInt16();
        sr.readUInt16();
        sr.readDateTime(); // last modified

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

        const isUnplayed = sr.readBoolean(); // is unplayed
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

        return new LocalDataInfo(
            beatmapId,
            isUnplayed,
            lastPlayed,
            osuCatchRankAchieved
        );
    };

    sr.readInt32();
    sr.readBoolean();
    sr.readDateTime();
    sr.readString();
    const beatmapCount = sr.readInt32();

    const infoMap = new Map<number, LocalDataInfo>();
    for (let i = 0; i < beatmapCount; i += 1) {
        const beatmap = readBeatmap();
        if (beatmap.beatmapId !== 0) infoMap.set(beatmap.beatmapId, beatmap);
    }

    console.log(`loaded ${beatmapCount} local beatmaps.`);
    return infoMap;
}

class BeatmapSummary {
    public constructor(
        public readonly meta: BeatmapMetadata,
        public readonly noModStars: number,
        public readonly totalFCCount: number,
        public readonly totalFCMods: FCMods
    ) {}

    public static parse(this: void, line: string): BeatmapSummary {
        const values = JSON.parse(`[${line}]`) as SummaryDataLineType;
        const meta = new BeatmapMetadata(
            values[1],
            values[2],
            values[0],
            values[3],
            values[4],
            values[5],
            values[6],
            values[7],
            values[9],
            values[10],
            values[11],
            values[14]
        );
        return new BeatmapSummary(meta, values[8], values[12], values[13]);
    }
}

export class BeatmapInfo {
    public constructor(
        public readonly meta: BeatmapMetadata,
        public readonly perMods: PerModsInfo[],
        public readonly currentMods: PerModsInfo,
        public readonly localDataInfo: LocalDataInfo | null,
        public readonly originDate: Date
    ) {}
}

export function selectHasUnloadedData(
    state: DataState,
    currentMods: ModCombination
): boolean {
    return state.loadedMods.get(currentMods) === undefined;
}

export function selectBeatmapList(
    state: DataState,
    currentMods: ModCombination
): BeatmapInfo[] {
    const modsIndex = state.loadedMods.get(currentMods);
    if (modsIndex === undefined) {
        return [];
    }
    const beatmapList = state.beatmapSummary.map(
        (summary, i) =>
            new BeatmapInfo(
                summary.meta,
                state.perMods[i],
                state.perMods[i][modsIndex],
                state.localData.get(summary.meta.beatmapId) || null,
                state.originDate
            )
    );
    sortInPlaceDefaultOrder(beatmapList);
    return beatmapList;
}

export function handleDataAction(
    state: DataState,
    action: DataAction
): DataState {
    switch (action.type) {
        case "loadBeatmapSummary": {
            const beatmapSummary = action.lines.map(BeatmapSummary.parse);
            const index = state.loadedMods.size;
            return {
                ...state,
                beatmapSummary,
                loadedMods: new Map([
                    ...state.loadedMods.entries(),
                    [ANY_MODS, index],
                ]),
                perMods: beatmapSummary.map((summary, i) => [
                    ...(state.perMods[i] || []),
                    PerModsInfo.createAny(summary),
                ]),
            };
        }

        case "loadPerModsInfo": {
            if (state.beatmapSummary.length !== action.lines.length) {
                console.error(
                    "Beatmap summary and mods info has different length"
                );
                return state;
            }
            const perMods = action.lines.map((line, i) =>
                PerModsInfo.parse(line, state.beatmapSummary[i].meta)
            );
            const index = state.loadedMods.size;
            return {
                ...state,
                loadedMods: new Map([
                    ...state.loadedMods.entries(),
                    [action.mods, index],
                ]),
                perMods: state.beatmapSummary.map((_, i) => [
                    ...(state.perMods[i] || []),
                    perMods[i],
                ]),
            };
        }

        case "loadLocalData": {
            return {
                ...state,
                localData: action.buffer
                    ? parseOsuStableDatabase(action.buffer)
                    : new Map<number, LocalDataInfo>(),
            };
        }
    }
}
