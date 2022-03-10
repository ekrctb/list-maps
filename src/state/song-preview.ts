export interface SongPreviewState {
    songUri: string | null;
    songVolume: number;
}

export type SongPreviewAction =
    | { type: "toggleSongPreview"; uri: string }
    | { type: "setSongVolume"; value: number };

export function handleSongPreviewAction(
    state: SongPreviewState,
    action: SongPreviewAction
): SongPreviewState {
    switch (action.type) {
        case "toggleSongPreview":
            return {
                ...state,
                songUri: state.songUri === action.uri ? null : action.uri,
            };

        case "setSongVolume":
            return { ...state, songVolume: action.value };
    }
}
