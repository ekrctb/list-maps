interface SongPreviewState {
    songUri: string | null,
    songVolume: number,
}

type SongPreviewAction =
    { type: 'toggleSongPreview', uri: string } |
    { type: 'setSongVolume', value: number };

const SongPreview = (props: {
    songPreview: SongPreviewState,
    dispatch: React.Dispatch<SongPreviewAction>,
}) => {
    const { songPreview: { songUri, songVolume }, dispatch } = props;

    const audioRef = React.useRef<HTMLAudioElement>(null);

    React.useEffect(() => {
        const audio = audioRef.current!;
        audio.volume = songVolume;
    }, [songVolume]);

    React.useEffect(() => {
        const audio = audioRef.current!;
        if (songUri !== null) {
            audio.src = songUri;
            audio.currentTime = 0;
            audio.play();
        } else {
            audio.removeAttribute('src');
            audio.pause();
        }
    }, [songUri]);

    const handleVolumeChange = () => {
        const audio = audioRef.current!;
        dispatch({ type: 'setSongVolume', value: audio.volume });
    };

    const handleEnded = () => {
        if (songUri !== null)
            dispatch({ type: 'toggleSongPreview', uri: songUri });
    };

    return <div className={classNames("music-control", !songUri && "hidden")}>
        <audio ref={audioRef} controls
            onVolumeChange={handleVolumeChange}
            onEnded={handleEnded}></audio>
    </div>;
};

function handleSongPreviewAction(state: SongPreviewState, action: SongPreviewAction): SongPreviewState {
    switch (action.type) {
        case 'toggleSongPreview':
            return { ...state, songUri: state.songUri === action.uri ? null : action.uri, };

        case 'setSongVolume':
            return { ...state, songVolume: action.value };
    }
}
