import { Mods } from "../osu.js";
import { ModCombination } from "./data.js";

export interface ModsState {
    currentMods: ModCombination,
    fetchMods: Partial<Record<ModCombination, 'needed' | 'fetching' | 'fetched'>>,
}

export type ModsAction =
    { type: 'setCurrentMods', value: ModCombination } |
    { type: 'addNeededMods', neededMods: ModCombination[] } |
    { type: 'setFetchingMods', value: Mods } |
    { type: 'setFetchedMods', value: Mods };

export function handleModsAction(state: ModsState, action: ModsAction): ModsState {
    switch (action.type) {
        case 'setCurrentMods': {
            return {
                ...state,
                currentMods: action.value,
                fetchMods: state.fetchMods[action.value] ? state.fetchMods : {
                    ...state.fetchMods, [action.value]: 'needed'
                },
            };
        }

        case 'addNeededMods': {
            if (action.neededMods.find(mods => !state.fetchMods[mods]) == undefined) {
                return state;
            }
            const fetchMods = { ...state.fetchMods };
            for (const mods of action.neededMods) {
                fetchMods[mods] = fetchMods[mods] ?? 'needed';
            }
            return { ...state, fetchMods };
        }

        case 'setFetchingMods':
            return {
                ...state,
                fetchMods: { ...state.fetchMods, [action.value]: 'fetching' },
            };

        case 'setFetchedMods':
            return {
                ...state,
                fetchMods: { ...state.fetchMods, [action.value]: 'fetched' },
            };
    }
}
