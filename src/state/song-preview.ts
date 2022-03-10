export interface SongPreviewState {
    songUri: string | null;
    songKey: string | null;
    songVolume: number;
}

export type SongPreviewAction =
    | { type: "toggleSongPreview"; uri: string; key: string }
    | { type: "setSongVolume"; value: number };

export function handleSongPreviewAction(
    state: SongPreviewState,
    action: SongPreviewAction
): SongPreviewState {
    switch (action.type) {
        case "toggleSongPreview":
            if (state.songKey === action.key) {
                return {
                    ...state,
                    songUri: null,
                    songKey: null,
                };
            } else {
                return {
                    ...state,
                    songUri: action.uri,
                    songKey: action.key,
                };
            }

        case "setSongVolume":
            return { ...state, songVolume: action.value };
    }
}
