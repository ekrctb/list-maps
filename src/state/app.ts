import { DataAction, ModCombination } from "./data.js";
import { FilterAction, FilterState } from "./filter.js";
import { ModsAction } from "./mods.js";
import { PaginationState, PaginationAction } from "./pagination.js";
import { SongPreviewAction } from "./song-preview.js";
import { SortState, SortAction } from "./sort.js";

export interface SetAppStateAction {
    type: 'setAppState',
    currentMods: ModCombination,
    filter: FilterState,
    sort: SortState,
    pagination: PaginationState,
}

export type AppAction =
    SetAppStateAction |
    ModsAction |
    DataAction |
    FilterAction |
    SortAction |
    PaginationAction |
    SongPreviewAction;
