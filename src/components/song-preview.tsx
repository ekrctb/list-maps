import { SongPreviewState, SongPreviewAction } from "../state/song-preview.js";
import { clamp, classNames } from "../utils.js";

const LOCAL_STORAGE_KEY = "list-maps/volume";

export const SongPreview = (props: {
    songPreview: SongPreviewState;
    dispatch: React.Dispatch<SongPreviewAction>;
}) => {
    const {
        songPreview: { songUri, songKey, songVolume },
        dispatch,
    } = props;

    const audioRef = React.useRef<HTMLAudioElement>(null);

    React.useEffect(() => {
        const volume = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (volume !== null) {
            dispatch({
                type: "setSongVolume",
                value: clamp(parseFloat(volume), 0, 1),
            });
        }
    }, [dispatch]);

    React.useEffect(() => {
        const audio = audioRef.current!;
        audio.volume = songVolume;
        localStorage.setItem(LOCAL_STORAGE_KEY, songVolume.toString());
    }, [songVolume]);

    React.useEffect(() => {
        const audio = audioRef.current!;
        if (songUri !== null) {
            audio.src = songUri;
            audio.currentTime = 0;
            audio.play().catch(console.error);
        } else {
            audio.removeAttribute("src");
            audio.pause();
        }
    }, [songKey, songUri]);

    const handleVolumeChange = () => {
        const audio = audioRef.current!;
        dispatch({ type: "setSongVolume", value: audio.volume });
    };

    const handleEnded = () => {
        if (songUri !== null && songKey !== null)
            dispatch({ type: "toggleSongPreview", uri: songUri, key: songKey });
    };

    return (
        <div className={classNames("music-control", !songUri && "d-none")}>
            <audio
                ref={audioRef}
                controls
                onVolumeChange={handleVolumeChange}
                onEnded={handleEnded}
            ></audio>
        </div>
    );
};
