import { ApprovalStatus, RulesetId } from "../osu.js";
import { FCMods, BeatmapInfo, LocalDataInfo } from "../state/data.js";
import { SongPreviewAction } from "../state/song-preview.js";
import {
    BeatmapSortKey,
    SortDirection,
    SortState,
    SortAction,
    selectLastSortKeyDir,
} from "../state/sort.js";
import { formatTime } from "../utils.js";

const SORT_FIRST_DIRECTION: Record<BeatmapSortKey, SortDirection> = {
    date: "desc",
    title: "asc",
    stars: "desc",
    pp: "desc",
    length: "asc",
    combo: "asc",
    ar: "asc",
    cs: "asc",
    fc_count: "desc",
    fc_mods: "desc",
    local_data: "desc",
};

const ICON_APPROVAL_STATUS: Partial<Record<number, string>> = {
    [ApprovalStatus.RANKED]: "fa fa-angle-double-right",
    [ApprovalStatus.APPROVED]: "fa fa-fire",
    [ApprovalStatus.QUALIFIED]: "fa fa-check",
    [ApprovalStatus.LOVED]: "fa fa-heart-o",
};

const ICON_RULESET: Record<RulesetId, string> = {
    [RulesetId.OSU]: "fa fa-exchange",
    [RulesetId.CATCH]: "fa fa-tint",
};

const ICON_SORT: Record<SortDirection, string> = {
    ["asc"]: "fa fa-caret-up",
    ["desc"]: "fa fa-caret-down",
};

const LOCAL_DATA_RANK_NAMES: string[] = [
    "SSH",
    "SH",
    "SS",
    "S",
    "A",
    "B",
    "C",
    "D",
    "F",
    "-",
];

const TableHeader = <K extends string>(props: {
    eventKey: K;
    sortDir: (key: K) => SortDirection | null;
    onClick: (key: K) => void;
    width?: string;
    children: React.ReactNode;
}) => {
    const sortDir = props.sortDir(props.eventKey);
    return (
        <th className="th">
            <button onClick={() => props.onClick(props.eventKey)}>
                {sortDir && <i className={ICON_SORT[sortDir]}></i>}
                <span>{props.children}</span>
            </button>
        </th>
    );
};

const SummaryTableHeader = (props: {
    sort: SortState;
    dispatch: React.Dispatch<SortAction>;
}) => {
    const lastSortKeyDir = selectLastSortKeyDir(props.sort);

    const sortDir = (key: BeatmapSortKey) =>
        lastSortKeyDir !== null && key === lastSortKeyDir[0]
            ? lastSortKeyDir[1]
            : null;

    const handleHeaderClick = (key: BeatmapSortKey) => {
        const currentDir = sortDir(key);
        const direction =
            currentDir === null
                ? SORT_FIRST_DIRECTION[key]
                : currentDir === "asc"
                ? "desc"
                : "asc";
        props.dispatch({ type: "pushSort", key, direction });
    };

    const headerProps = { sortDir, onClick: handleHeaderClick };

    return (
        <thead>
            <tr>
                <TableHeader eventKey="date" {...headerProps}>
                    Date
                </TableHeader>
                <TableHeader eventKey="title" {...headerProps}>
                    Map
                </TableHeader>
                <TableHeader eventKey="stars" {...headerProps}>
                    Stars
                </TableHeader>
                <TableHeader eventKey="pp" {...headerProps}>
                    PP
                </TableHeader>
                <TableHeader eventKey="length" {...headerProps}>
                    Length
                </TableHeader>
                <TableHeader eventKey="combo" {...headerProps}>
                    Combo
                </TableHeader>
                <TableHeader eventKey="ar" {...headerProps}>
                    AR
                </TableHeader>
                <TableHeader eventKey="cs" {...headerProps}>
                    CS
                </TableHeader>
                <TableHeader eventKey="fc_count" {...headerProps}>
                    FC count
                </TableHeader>
                <TableHeader eventKey="fc_mods" {...headerProps}>
                    FC mods
                </TableHeader>
                <TableHeader eventKey="local_data" {...headerProps}>
                    Local data
                </TableHeader>
            </tr>
        </thead>
    );
};

function formatFcCount(fcCount: number): string {
    return fcCount === 0
        ? ""
        : fcCount < 0
        ? `${-fcCount}xMiss`
        : `${fcCount} FCs`;
}

function formatFcMods(fcMods: FCMods): string {
    return fcMods & FCMods.HDFL
        ? "+HDFL"
        : fcMods & FCMods.FL
        ? "+FL"
        : fcMods & FCMods.HD
        ? "+HD"
        : "";
}

const SummaryTableRow = (props: {
    info: BeatmapInfo;
    dispatch: React.Dispatch<SongPreviewAction>;
}) => {
    const { info, dispatch } = props;
    const { meta, currentMods, localDataInfo } = info;

    return (
        <tr>
            <DateCell status={meta.approvalStatus}>
                {meta.approvedDateString.slice(0, 10)}
            </DateCell>
            <MapCell
                setId={meta.beatmapSetId}
                mapId={meta.beatmapId}
                ruleset={meta.rulesetId}
                dispatch={dispatch}
            >
                {meta.displayString}
            </MapCell>
            <td className="text-end">{currentMods.stars.toFixed(2)}</td>
            <td className="text-end">
                {currentMods.performancePoint.toFixed(0)}
            </td>
            <td className="text-end">{formatTime(currentMods.hitLength)}</td>
            <td className="text-end">{currentMods.maxCombo}</td>
            <td className="text-end">{currentMods.approachRate.toFixed(1)}</td>
            <td className="text-end">{currentMods.circleSize.toFixed(1)}</td>
            <td>{formatFcCount(currentMods.fcCount)}</td>
            <td>{formatFcMods(currentMods.fcMods)}</td>
            <LocalDataCell localDataInfo={localDataInfo} />
        </tr>
    );
};

const DateCell = (props: { status: number; children: React.ReactNode }) => {
    return (
        <td>
            <i className={ICON_APPROVAL_STATUS[props.status] ?? ""}></i>
            {props.children}
        </td>
    );
};

const MapCell = (props: {
    setId: number;
    mapId: number;
    ruleset: RulesetId;
    dispatch: React.Dispatch<SongPreviewAction>;
    children: React.ReactNode;
}) => {
    const { setId, mapId, ruleset } = props;
    const beatmapLink = `https://osu.ppy.sh/beatmapsets/${setId}#fruits/${mapId}`;
    const osuDirectLink = `osu://dl/${setId}`;
    const handleSongClick = () => {
        props.dispatch({
            type: "toggleSongPreview",
            uri: `https://b.ppy.sh/preview/${setId}.mp3`,
        });
    };
    return (
        <td>
            <div className="map-cell">
                <div>
                    <i className={ICON_RULESET[ruleset] ?? ""}></i>
                    <a target="_blank" rel="noreferrer" href={beatmapLink}>
                        {props.children}
                    </a>
                </div>
                <div>
                    <button
                        className="btn btn-link fa fa-music"
                        style={{ padding: "0" }}
                        onClick={handleSongClick}
                    ></button>
                    <a
                        className="fa fa-cloud-download"
                        href={osuDirectLink}
                    ></a>
                </div>
            </div>
        </td>
    );
};

const LocalDataCell = (props: { localDataInfo: LocalDataInfo | null }) => {
    const { localDataInfo } = props;
    return (
        <td>
            {localDataInfo !== null && (
                <>
                    <span
                        className={`rank-${
                            LOCAL_DATA_RANK_NAMES[localDataInfo.rankAchived] ??
                            "-"
                        }`}
                    ></span>
                    <span>
                        {!localDataInfo.hasAnyInfo
                            ? ""
                            : !localDataInfo.hasLastPlayedDate
                            ? "-"
                            : localDataInfo.lastPlayedDate
                                  .toISOString()
                                  .split("T")[0]}
                    </span>
                </>
            )}
        </td>
    );
};

const SummaryTableBody = (props: {
    currentPage: BeatmapInfo[];
    dispatch: React.Dispatch<SongPreviewAction>;
}) => {
    const { currentPage, dispatch } = props;
    return (
        <tbody>
            {currentPage.map((info, i) => (
                <SummaryTableRow key={i} info={info} dispatch={dispatch} />
            ))}
        </tbody>
    );
};

export const SummaryTable = (props: {
    sort: SortState;
    currentPage: BeatmapInfo[];
    dispatch: React.Dispatch<SortAction | SongPreviewAction>;
}) => {
    const { sort, currentPage, dispatch } = props;

    return (
        <table
            className="table table-hover table-striped"
            style={{ tableLayout: "fixed" }}
        >
            <SummaryTableHeader sort={sort} dispatch={dispatch} />
            <SummaryTableBody currentPage={currentPage} dispatch={dispatch} />
        </table>
    );
};
