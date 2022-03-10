import { ApprovalStatus, RulesetId } from "../osu.js";
import {
    BeatmapInfo,
    ModCombination,
    ANY_MODS,
    PerModsInfo,
    FCMods,
    LocalDataInfo,
} from "./data.js";

export interface FilterState {
    statusFilter: StatusFilter;
    rulesetFilter: RulesetFilter;
    querySource: string;
    localDataFilter: LocalDataFilter;
}

export type FilterAction =
    | { type: "setFilterState"; state: FilterState }
    | { type: "setStatusFilter"; value: StatusFilter }
    | { type: "setRulesetFilter"; value: RulesetFilter }
    | { type: "setQueryFilter"; source: string }
    | { type: "setLocalDataFilter"; value: LocalDataFilter };

export type BeatmapInfoPreficate = (info: BeatmapInfo) => boolean;
export type BeatmapInfoKeyFunc = (info: BeatmapInfo) => number;

interface QueryExpression {
    matchFuncs: BeatmapInfoPreficate[];
    normalizedSource: string;
    neededMods: ModCombination[];
}

type BeatmapInfoKeyFuncResult =
    | { ok: true; func: BeatmapInfoKeyFunc }
    | { ok: false; mods: ModCombination };

export enum StatusFilter {
    Ranked = 1,
    Loved = 2,
    Both = 3,
}

export enum RulesetFilter {
    Converted = 1,
    Specific = 2,
    Both = 3,
}

export enum LocalDataFilter {
    NoFiltering = 0,
    Unplayed = 1,
    Played = 2,
    NoData = 3,
    HasData = 4,
    HasDataUnplayed = 5,
}

const MODS_PREFIX: Record<string, ModCombination> = {
    any: ANY_MODS,
    nm: 0,
    ez: 2,
    hr: 16,
    dt: 64,
    ezdt: 66,
    hrdt: 80,
    ht: 256,
    ezht: 258,
    hrht: 272,
};

export function selectQueryExpression(
    source: string,
    getLoadedMods: (mods: ModCombination) => number | undefined
): QueryExpression {
    const matchFuncs: BeatmapInfoPreficate[] = [];
    const normalizedParts = [];
    const neededMods = new Set<ModCombination>();

    for (const part of source.split(" ")) {
        if (part.length === 0) continue;

        const binRelMatch = part.match(/^(\w+)(==?|!=|<=?|>=?)(.+)$/);
        if (binRelMatch !== null) {
            const key = binRelMatch[1].toLowerCase().replace(/-/g, "_");
            const keyFuncResult = getBeatmapInfoKeyFunc(key, getLoadedMods);

            const binRel = binRelMatch[2] === "==" ? "=" : binRelMatch[2];
            const binRelFunc = getNumberBinRelFunc(binRel);
            const number = parseFloat(binRelMatch[3]);

            if (
                keyFuncResult !== null &&
                binRelFunc !== null &&
                !Number.isNaN(number)
            ) {
                if (!keyFuncResult.ok) {
                    neededMods.add(keyFuncResult.mods);
                } else {
                    const keyFunc = keyFuncResult.func;
                    matchFuncs.push((info) =>
                        binRelFunc(keyFunc(info), number)
                    );
                }
                normalizedParts.push(`${key}${binRel}${number}`);
                continue;
            }
        }

        const text = part.toLowerCase();
        matchFuncs.push((info: BeatmapInfo) =>
            info.meta.displayStringLowerCased.includes(text)
        );
        normalizedParts.push(text);
    }

    return {
        matchFuncs,
        normalizedSource: normalizedParts.join(" "),
        neededMods: Array.from(neededMods),
    };
}

function getBeatmapInfoKeyFunc(
    key: string,
    getLoadedMods: (mods: ModCombination) => number | undefined
): BeatmapInfoKeyFuncResult | null {
    {
        const func = getModsUnrelatedFilterKeyFunc(key);
        if (func !== null) {
            return { ok: true, func };
        }
    }

    {
        const func = getPerModsFilterKeyFunc(key);
        if (func !== null) {
            return { ok: true, func: (info) => func(info.currentMods) };
        }
    }

    const prefix = Object.keys(MODS_PREFIX).find((prefix) =>
        key.startsWith(prefix + "_")
    );
    if (prefix !== undefined) {
        const mods = MODS_PREFIX[prefix];
        const func = getPerModsFilterKeyFunc(key.slice(prefix.length + 1));
        if (func !== null) {
            const modsIndex = getLoadedMods(mods);
            if (modsIndex !== undefined) {
                return {
                    ok: true,
                    func: (info) => func(info.perMods[modsIndex]),
                };
            } else {
                return { ok: false, mods };
            }
        }
    }

    return null;
}

function getNumberBinRelFunc(
    binRel: string
): ((x: number, y: number) => boolean) | null {
    switch (binRel) {
        case "=":
            return (x, y) => x === y;
        case "!=":
            return (x, y) => x !== y;
        case "<":
            return (x, y) => x < y;
        case "<=":
            return (x, y) => x <= y;
        case ">":
            return (x, y) => x > y;
        case ">=":
            return (x, y) => x >= y;
        default:
            return null;
    }
}

function getModsUnrelatedFilterKeyFunc(key: string): BeatmapInfoKeyFunc | null {
    switch (key) {
        case "status":
            return (info) => info.meta.approvalStatus;
        case "mode":
            return (info) => info.meta.rulesetId;
        case "date":
            return (info) =>
                (info.originDate.valueOf() - info.meta.approvedDate.valueOf()) /
                86400e3;
        case "has":
            return (info) => (info.localDataInfo !== null ? 1 : 0);
        case "unplayed":
            return (info) => (info.localDataInfo?.hasAnyInfo ? 0 : 1);
        case "played":
            return (info) => {
                if (info.localDataInfo === null)
                    return Number.POSITIVE_INFINITY;
                return (
                    (info.originDate.valueOf() -
                        info.localDataInfo.lastPlayedDate.valueOf()) /
                    86400e3
                );
            };
        case "rank":
            return (info) => info.localDataInfo?.rankAchived ?? 10;
    }

    return null;
}

function getPerModsFilterKeyFunc(
    key: string
): ((perModsInfo: PerModsInfo) => number) | null {
    switch (key) {
        case "stars":
            return (info) => info.stars;
        case "pp":
            return (info) => info.performancePoint;
        case "length":
            return (info) => info.hitLength;
        case "bpm":
            return (info) => info.bpm;
        case "ar":
            return (info) => info.approachRate;
        case "cs":
            return (info) => info.circleSize;
        case "fc":
            return (info) => info.fcCount;
        case "miss":
            return (info) => -info.fcCount;
        case "fcmods":
            return (info) => info.fcMods;
        case "hdfc":
            return (info) => (info.fcMods & (FCMods.HD | FCMods.HDFL) ? 1 : 0);
        case "flfc":
            return (info) => (info.fcMods & (FCMods.HD | FCMods.HDFL) ? 1 : 0);
        default:
            return null;
    }
}

function filterStatus(status: ApprovalStatus, filter: StatusFilter): boolean {
    if (status === ApprovalStatus.LOVED) return filter !== StatusFilter.Ranked;
    else return filter !== StatusFilter.Loved;
}

function filterRuleset(ruleset: RulesetId, filter: RulesetFilter): boolean {
    if (ruleset === RulesetId.OSU) return filter !== RulesetFilter.Specific;
    else return filter !== RulesetFilter.Converted;
}

function filterLocalData(
    info: LocalDataInfo | null,
    filter: LocalDataFilter
): boolean {
    switch (filter) {
        case LocalDataFilter.NoFiltering:
            return true;

        case LocalDataFilter.NoData:
            return info === null;

        case LocalDataFilter.HasData:
            return info !== null;

        case LocalDataFilter.Played:
            return info?.hasAnyInfo === true;

        case LocalDataFilter.Unplayed:
            return info?.hasAnyInfo !== true;

        case LocalDataFilter.HasDataUnplayed:
            return info?.hasAnyInfo === false;
    }
}

export function selectFilteredMaps(
    state: FilterState,
    loadedMods: Map<ModCombination, number>,
    beatmapList: BeatmapInfo[]
): BeatmapInfo[] {
    const { statusFilter, rulesetFilter, querySource, localDataFilter } = state;
    const { matchFuncs } = selectQueryExpression(querySource, (mods) =>
        loadedMods.get(mods)
    );

    return beatmapList.filter((info) => {
        if (!filterStatus(info.meta.approvalStatus, statusFilter)) return false;

        if (!filterRuleset(info.meta.rulesetId, rulesetFilter)) return false;

        for (const matchFunc of matchFuncs) {
            if (!matchFunc(info)) return false;
        }

        if (!filterLocalData(info.localDataInfo, localDataFilter)) return false;

        return true;
    });
}

export function handleFilterAction(
    state: FilterState,
    action: FilterAction
): FilterState {
    switch (action.type) {
        case "setFilterState":
            return action.state;

        case "setStatusFilter":
            return { ...state, statusFilter: action.value };

        case "setRulesetFilter":
            return { ...state, rulesetFilter: action.value };

        case "setQueryFilter":
            return { ...state, querySource: action.source };

        case "setLocalDataFilter":
            return { ...state, localDataFilter: action.value };
    }
}
