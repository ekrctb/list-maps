interface ModsState {
    currentMods: ModCombination,
    fetchMods: Partial<Record<ModCombination, 'needed' | 'fetching' | 'fetched'>>,
}

type ModsAction =
    { type: 'setCurrentMods', value: ModCombination } |
    { type: 'addNeededMods', neededMods: ModCombination[] } |
    { type: 'setFetchingMods', value: Mods } |
    { type: 'setFetchedMods', value: Mods };

interface SetAppStateAction {
    type: 'setAppState',
    currentMods: ModCombination,
    filter: FilterState,
    sort: SortState,
    pagination: PaginationState,
}

type AppAction =
    SetAppStateAction |
    ModsAction |
    DataAction |
    FilterAction |
    SortAction |
    PaginationAction |
    SongPreviewAction;

const Loader = (_: {}) => {
    return <i className="loader fa fa-spinner fa-pulse fa-3x"></i>;
};

const PageNavigation = (props: {
    pagination: PaginationState,
    filteredCount: number,
    dispatch: React.Dispatch<PaginationAction>,
    scrollMain: () => void,
}) => {
    const { pagination, filteredCount, dispatch } = props;
    const { pageStart, pageCount } = pagination;
    const pageEnd = selectPageEnd(pagination, filteredCount);

    const handleClickPrev = () => {
        dispatch({ type: 'setPageStart', value: Math.max(0, pageStart - pageCount), filteredCount });
    };

    const handleClickNext = () => {
        dispatch({ type: 'setPageStart', value: pageEnd, filteredCount });
        props.scrollMain();
    };

    return <nav>
        <ul className="pagination justify-content-center">
            <li className={classNames('page-item', pageStart === 0 && 'disabled')}>
                <button className="page-link" onClick={handleClickPrev}>Previous</button>
            </li>
            <li className={classNames('page-item', pageEnd === filteredCount && 'disabled')}>
                <button className="page-link" onClick={handleClickNext}>Next</button>
            </li>
        </ul>
    </nav>;
}

function handleModsAction(state: ModsState, action: ModsAction): ModsState {
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

const APP_INIT_DATE = new Date();

const App = (_: {}) => {
    const [mods, dispatchMods] = React.useReducer(handleModsAction, {
        currentMods: ANY_MODS,
        fetchMods: {
            [ANY_MODS]: 'needed'
        },
    });
    const [data, dispatchData] = React.useReducer(handleDataAction, {
        beatmapSummary: [],
        loadedMods: new Map(),
        perMods: [],
        localData: new Map(),
        originDate: APP_INIT_DATE,
    });
    const [filter, dispatchFilter] = React.useReducer(handleFilterAction, {
        statusFilter: StatusFilter.Ranked,
        rulesetFilter: RulesetFilter.Both,
        querySource: '',
        localDataFilter: LocalDataFilter.NoFiltering
    });
    const [sort, dispatchSort] = React.useReducer(handleSortAction, {
        sortOrder: [],
    });
    const [pagination, dispatchPagination] = React.useReducer(handlePaginationAction, {
        pageStart: 0,
        pageCount: 100,
    });
    const [songPreview, dispatchSongPreview] = React.useReducer(handleSongPreviewAction, {
        songUri: null,
        songVolume: 1,
    });

    const dispatch = React.useCallback((action: AppAction) => {
        console.log(action);

        switch (action.type) {
            case 'setAppState': {
                dispatchMods({ type: 'setCurrentMods', value: action.currentMods });
                dispatchFilter({ type: 'setFilterState', state: action.filter });
                dispatchSort({ type: 'setSortState', state: action.sort });
                dispatchPagination({ type: 'setPaginationState', state: action.pagination });
                break;
            }

            case 'setCurrentMods':
            case 'addNeededMods':
            case 'setFetchingMods':
            case 'setFetchedMods':
                dispatchMods(action);
                break;

            case 'loadBeatmapSummary':
            case 'loadPerModsInfo':
            case 'loadLocalData':
                dispatchData(action);
                break;

            case 'setFilterState':
            case 'setStatusFilter':
            case 'setRulesetFilter':
            case 'setQueryFilter':
            case 'setLocalDataFilter':
                dispatchFilter(action);
                break;

            case 'setSortState':
            case 'pushSort':
                dispatchSort(action);
                break;

            case 'setPaginationState':
            case 'setPageStart':
            case 'setPageCount':
                dispatchPagination(action);
                break;

            case 'toggleSongPreview':
            case 'setSongVolume':
                dispatchSongPreview(action);
                break;

            default:
                console.error('Unhandled action', action);
                break;
        }
    }, [dispatchMods, dispatchFilter, dispatchSort, dispatchPagination, dispatchSongPreview]);

    const unfetchedMods = new Set(MOD_COMBINATIONS.filter(m => !mods.fetchMods[m]));
    const { querySource } = filter;

    React.useEffect(() => {
        const result = selectQueryExpression(querySource, mods => unfetchedMods.has(mods) ? undefined : -1);
        if (result.neededMods.length !== 0) {
            dispatch({ type: 'addNeededMods', neededMods: result.neededMods });
        }
    }, [unfetchedMods, querySource, dispatch]);

    const { currentMods, fetchMods } = mods;
    React.useEffect(() => {
        for (const mods of MOD_COMBINATIONS) {
            if (fetchMods[mods] === 'fetching') break;
            if (fetchMods[mods] !== 'needed') continue;

            dispatch({ type: 'setFetchingMods', value: mods });

            fetch(mods === ANY_MODS ? './data/summary.csv' : `./data/mods-${mods}.csv`)
                .then(req => req.text())
                .then(text => {
                    dispatch({ type: 'setFetchedMods', value: mods });

                    const lines = text.split('\n').filter(line => line !== '');
                    if (mods === ANY_MODS) {
                        dispatch({ type: 'loadBeatmapSummary', lines });
                    } else {
                        dispatch({ type: 'loadPerModsInfo', mods, lines });
                    }
                });
        }
    }, [fetchMods, dispatch]);

    const mainRef = React.useRef<HTMLDivElement>(null);
    const scrollMain = () => {
        mainRef.current!.scroll(0, 0);
    };

    const { loadedMods } = data;

    const beatmapList = React.useMemo(
        () => selectBeatmapList(data, currentMods),
        [data, currentMods]);

    const filteredMaps = React.useMemo(
        () => selectFilteredMaps(filter, loadedMods, beatmapList),
        [filter, loadedMods, beatmapList]);

    const sortedMaps = React.useMemo(
        () => selectSortedMaps(sort, filteredMaps),
        [sort, filteredMaps]);

    const currentPage = selectCurrentPage(pagination, sortedMaps);

    const filteredCount = filteredMaps.length;

    return <>
        <Header currentMods={currentMods} filteredCount={filteredCount} filter={filter} pagination={pagination} dispatch={dispatch} />
        <div className="main" ref={mainRef}>
            {selectHasUnloadedData(data, currentMods) && <Loader />}
            <SummaryTable sort={sort} currentPage={currentPage} dispatch={dispatch} />
            <PageNavigation pagination={pagination} filteredCount={filteredCount} dispatch={dispatch} scrollMain={scrollMain} />
            <SongPreview songPreview={songPreview} dispatch={dispatch} />
        </div>
        <UriHash currentMods={currentMods} filter={filter} sort={sort} pagination={pagination} dispatch={dispatch} />
    </>
};
