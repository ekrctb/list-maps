import { SongPreviewState, SongPreviewAction } from "../state/song-preview.js";
import { classNames } from "../utils.js";

export const SongPreview = (props: {
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
            audio.play().catch(console.error);
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
