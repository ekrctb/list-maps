import { clamp } from "../utils.js";
import { BeatmapInfo } from "./data.js";

export interface PaginationState {
    pageStart: number;
    pageCount: number;
}

export type PaginationAction =
    | { type: "setPaginationState"; state: PaginationState }
    | { type: "setPageStart"; value: number; filteredCount: number }
    | { type: "setPageCount"; value: number };

export function selectPageEnd(
    state: PaginationState,
    filteredCount: number
): number {
    return clamp(state.pageStart + state.pageCount, 0, filteredCount);
}

export function selectCurrentPage(
    state: PaginationState,
    sortedMaps: BeatmapInfo[]
): BeatmapInfo[] {
    const { pageStart } = state;
    const pageEnd = selectPageEnd(state, sortedMaps.length);
    return sortedMaps.slice(pageStart, pageEnd);
}

export function handlePaginationAction(
    state: PaginationState,
    action: PaginationAction
): PaginationState {
    switch (action.type) {
        case "setPaginationState":
            return action.state;

        case "setPageStart": {
            const pageStart = clamp(action.value, 0, action.filteredCount);
            return { ...state, pageStart };
        }

        case "setPageCount": {
            const pageCount = action.value;
            return { ...state, pageCount };
        }
    }
}
