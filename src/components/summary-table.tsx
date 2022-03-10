const SORT_FIRST_DIRECTION: Record<BeatmapSortKey, SortDirection> = {
    date: 'desc',
    title: 'asc',
    stars: 'desc',
    pp: 'desc',
    length: 'asc',
    combo: 'asc',
    ar: 'asc',
    cs: 'asc',
    fc_count: 'desc',
    fc_mods: 'desc',
    local_data: 'desc',
};

const ICON_APPROVAL_STATUS: Partial<Record<number, string>> = {
    [ApprovalStatus.RANKED]: 'fa fa-angle-double-right',
    [ApprovalStatus.APPROVED]: 'fa fa-fire',
    [ApprovalStatus.QUALIFIED]: 'fa fa-check',
    [ApprovalStatus.LOVED]: 'fa fa-heart-o',
};

const ICON_RULESET = {
    [RulesetId.OSU]: 'fa fa-exchange',
    [RulesetId.CATCH]: 'fa fa-tint',
};

const LOCAL_DATA_RANK_NAMES = [
    'SSH', 'SH', 'SS', 'S', 'A',
    'B', 'C', 'D', 'F', '-'
];

const TableHeader = <K extends string>(props: {
    eventKey: K,
    sortDir: (key: K) => SortDirection | null,
    onClick: (key: K) => void,
    width: string,
    narrow?: boolean,
    children: React.ReactNode,
}) => {
    const sortDir = props.sortDir(props.eventKey);
    return <th
        key={props.eventKey}
        className={classNames(
            sortDir !== null && 'sorted',
            sortDir === 'asc' && 'ascending',
            sortDir === 'desc' && 'descending'
        )}
        style={{ width: props.width }}
        onClick={_ => props.onClick(props.eventKey)}>
        {props.narrow ?
            <span className="narrow-header-text">{props.children}</span> :
            props.children}
    </th>;
};

const SummaryTableHeader = (props: {
    sort: SortState,
    dispatch: React.Dispatch<SortAction>,
}) => {
    type HeaderId = BeatmapSortKey;

    const lastSortKeyDir = selectLastSortKeyDir(props.sort);
    const sortDir = (key: HeaderId) => lastSortKeyDir !== null && key === lastSortKeyDir[0] ? lastSortKeyDir[1] : null;
    const handleHeaderClick = (key: HeaderId) => {
        const currentDir = sortDir(key);
        const direction = currentDir === null ? SORT_FIRST_DIRECTION[key] :
            currentDir === 'asc' ? 'desc' : 'asc';
        props.dispatch({ type: 'pushSort', key, direction })
    };

    const TH = (props: { eventKey: HeaderId, width: string, narrow?: boolean, children: React.ReactNode }) =>
        <TableHeader sortDir={sortDir} onClick={handleHeaderClick} {...props}>{props.children}</TableHeader>;

    return <thead><tr>
        <TH eventKey="date" width="8em">Date</TH>
        <TH eventKey="title" width="auto">Map</TH>
        <TH eventKey="stars" width="3em" narrow>Stars</TH>
        <TH eventKey="pp" width="3.5em" narrow>PP</TH>
        <TH eventKey="length" width="3.5em" narrow>Length</TH>
        <TH eventKey="combo" width="3.5em" narrow>Combo</TH>
        <TH eventKey="ar" width="2.5em" narrow>AR</TH>
        <TH eventKey="cs" width="2.5em" narrow>CS</TH>
        <TH eventKey="fc_count" width="5em">FC count</TH>
        <TH eventKey="fc_mods" width="4em">FC mods</TH>
        <TH eventKey="local_data" width="8em">Local data</TH>
    </tr></thead>;
};

function formatFcCount(fcCount: number): string {
    return fcCount === 0 ? '' : fcCount < 0 ? `${-fcCount}xMiss` : `${fcCount} FCs`;
}

function formatFcMods(fcMods: FCMods): string {
    return fcMods & FCMods.HDFL ? '+HDFL' : fcMods & FCMods.FL ? '+FL' : fcMods & FCMods.HD ? '+HD' : '';
}

const SummaryTableRow = (props: {
    info: BeatmapInfo,
    dispatch: React.Dispatch<SongPreviewAction>,
}) => {
    const { info, dispatch } = props;
    const { meta, currentMods, localDataInfo } = info;

    return <tr>
        <SummaryTableRow.Date status={meta.approvalStatus}>
            {meta.approvedDateString.slice(0, 10)}
        </SummaryTableRow.Date>
        <SummaryTableRow.Map setId={meta.beatmapSetId} mapId={meta.beatmapId} ruleset={meta.rulesetId} dispatch={dispatch}>
            {meta.displayString}
        </SummaryTableRow.Map>
        <td>{currentMods.stars.toFixed(2)}</td>
        <td>{currentMods.performancePoint.toFixed(0)}</td>
        <td>{formatTime(currentMods.hitLength)}</td>
        <td>{currentMods.maxCombo}</td>
        <td>{currentMods.approachRate.toFixed(1)}</td>
        <td>{currentMods.circleSize.toFixed(1)}</td>
        <td>{formatFcCount(currentMods.fcCount)}</td>
        <td>{formatFcMods(currentMods.fcMods)}</td>
        <SummaryTableRow.LocalData localDataInfo={localDataInfo} />
    </tr>;
}

SummaryTableRow.Date = (props: {
    status: number,
    children: React.ReactNode,
}) => {
    return <td>
        <i className={ICON_APPROVAL_STATUS[props.status] ?? ''}></i>
        {props.children}
    </td>;
};

SummaryTableRow.Map = (props: {
    setId: number,
    mapId: number,
    ruleset: RulesetId,
    dispatch: React.Dispatch<SongPreviewAction>,
    children: React.ReactNode
}) => {
    const { setId, mapId, ruleset } = props;
    const beatmapLink = `https://osu.ppy.sh/beatmapsets/${setId}#fruits/${mapId}`;
    const osuDirectLink = `osu://dl/${setId}`;
    const handleSongClick = () => {
        props.dispatch({ type: 'toggleSongPreview', uri: `https://b.ppy.sh/preview/${setId}.mp3` });
    };
    return <td><div className="map-cell">
        <div>
            <i className={ICON_RULESET[ruleset] ?? ''}></i>
            <a target="_blank" href={beatmapLink}>{props.children}</a>
        </div>
        <div>
            <button className="btn btn-link fa fa-music" style={{ padding: "0" }} onClick={handleSongClick}></button>
            <a className="fa fa-cloud-download" href={osuDirectLink}></a>
        </div>
    </div></td>;
}

SummaryTableRow.LocalData = (props: {
    localDataInfo: LocalDataInfo | null
}) => {
    const { localDataInfo } = props;
    return <td>{localDataInfo !== null && <>
        <span className={`rank-${LOCAL_DATA_RANK_NAMES[localDataInfo.rankAchived] ?? '-'}`}></span>
        <span>{
            !localDataInfo.hasAnyInfo ? '' : !localDataInfo.hasLastPlayedDate ? '-' :
                localDataInfo.lastPlayedDate.toISOString().split('T')[0]
        }</span>
    </>}</td>
}

const SummaryTableBody = (props: {
    currentPage: BeatmapInfo[],
    dispatch: React.Dispatch<SongPreviewAction>,
}) => {
    const { currentPage, dispatch } = props;
    return <tbody>
        {currentPage.map((info, i) =>
            <SummaryTableRow key={i} info={info} dispatch={dispatch} />
        )}
    </tbody>;
}

const SummaryTable = (props: {
    sort: SortState,
    currentPage: BeatmapInfo[],
    dispatch: React.Dispatch<SortAction | SongPreviewAction>,
}) => {
    const { sort, currentPage, dispatch } = props;

    return <table className="table table-sm table-hover table-bordered table-striped table-sortable"
        style={{ tableLayout: "fixed" }}>
        <SummaryTableHeader sort={sort} dispatch={dispatch} />
        <SummaryTableBody currentPage={currentPage} dispatch={dispatch} />
    </table>;
};
