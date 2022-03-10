import { deepEqual } from "../utils.js";
import { BeatmapInfo } from "./data.js";

export type BeatmapSortKey =
    | "date"
    | "title"
    | "stars"
    | "pp"
    | "length"
    | "bpm"
    | "combo"
    | "ar"
    | "cs"
    | "fc_count"
    | "fc_mods"
    | "local_data";
export type SortDirection = "asc" | "desc";
export type SortOrder = [BeatmapSortKey, SortDirection][];

export interface SortState {
    sortOrder: SortOrder;
}

export type SortAction =
    | { type: "setSortState"; state: SortState }
    | { type: "pushSort"; key: BeatmapSortKey; direction: SortDirection };

export const SORT_KEY_CLEAR_OTHER: Partial<Record<BeatmapSortKey, true>> = {
    date: true,
    title: true,
    stars: true,
    pp: true,
};

const DEFAULT_SORT_ORDER: SortOrder = [["date", "desc"]];

function getBeatmapSortKeyFunc(
    key: BeatmapSortKey
): (info: BeatmapInfo) => number | string {
    switch (key) {
        case "date":
            return (info) => info.meta.approvedDateString;
        case "title":
            return (info) => info.meta.displayStringLowerCased;
        case "stars":
            return (info) => info.currentMods.stars;
        case "length":
            return (info) => info.meta.hitLength;
        case "bpm":
            return (info) => info.meta.bpm;
        case "combo":
            return (info) => info.meta.maxCombo;
        case "ar":
            return (info) => info.currentMods.approachRate;
        case "cs":
            return (info) => info.currentMods.circleSize;
        case "pp":
            return (info) => info.currentMods.performancePoint;
        case "fc_count":
            return (info) => info.currentMods.fcCount;
        case "fc_mods":
            return (info) => info.currentMods.fcMods;
        case "local_data":
            return (info) =>
                info.localDataInfo?.lastPlayedDate.valueOf() ??
                Number.NEGATIVE_INFINITY;
    }
}

function sortInPlace(sortOrder: SortOrder, beatmaps: BeatmapInfo[]) {
    for (const [key, direction] of sortOrder) {
        const keyFunc = getBeatmapSortKeyFunc(key);
        const sign = direction === "asc" ? -1 : 1;
        beatmaps.sort((a, b) => {
            const fa = keyFunc(a);
            const fb = keyFunc(b);
            return fa === fb ? 0 : fa < fb ? sign : -sign;
        });
    }
}

export function sortInPlaceDefaultOrder(beatmaps: BeatmapInfo[]) {
    sortInPlace(DEFAULT_SORT_ORDER, beatmaps);
}

export function pushSortOrder(
    sortOrder: SortOrder,
    key: BeatmapSortKey,
    direction: SortDirection
): [BeatmapSortKey, SortDirection][] {
    if (SORT_KEY_CLEAR_OTHER[key]) {
        sortOrder = [];
    }
    sortOrder = [...DEFAULT_SORT_ORDER, ...sortOrder].filter(
        (k) => k[0] !== key
    );
    sortOrder.push([key, direction]);
    return sortOrder.filter((x, i) => !deepEqual(DEFAULT_SORT_ORDER[i], x));
}

export function selectLastSortKeyDir(
    state: SortState
): [BeatmapSortKey, SortDirection] | null {
    return (
        state.sortOrder[state.sortOrder.length - 1] ??
        DEFAULT_SORT_ORDER[DEFAULT_SORT_ORDER.length - 1]
    );
}

export function selectSortedMaps(
    state: SortState,
    filteredMaps: BeatmapInfo[]
): BeatmapInfo[] {
    const sortedMaps = filteredMaps.slice();
    sortInPlace(state.sortOrder, sortedMaps);
    return sortedMaps;
}

export function handleSortAction(
    state: SortState,
    action: SortAction
): SortState {
    switch (action.type) {
        case "setSortState":
            return action.state;

        case "pushSort": {
            const sortOrder = pushSortOrder(
                state.sortOrder,
                action.key,
                action.direction
            );
            return { ...state, sortOrder };
        }
    }
}
