import { Mods } from "../osu.js";
import { DataAction, ModCombination } from "../state/data.js";
import {
    FilterAction,
    FilterState,
    LocalDataFilter,
    RulesetFilter,
    StatusFilter,
} from "../state/filter.js";
import { ModsAction } from "../state/mods.js";
import {
    PaginationAction,
    PaginationState,
    selectPageEnd,
} from "../state/pagination.js";
import { classNames } from "../utils.js";

const StatusFilterField = (props: {
    statusFilter: StatusFilter;
    dispatch: React.Dispatch<FilterAction>;
}) => {
    const ID = "filter-status";
    return (
        <div className="col field">
            <label htmlFor={ID}>Ranked status</label>
            <select
                id={ID}
                className="form-control"
                value={props.statusFilter}
                onChange={(e) =>
                    props.dispatch({
                        type: "setStatusFilter",
                        value: parseInt(e.target.value),
                    })
                }
            >
                <option value="1">Ranked</option>
                <option value="2">Loved</option>
                <option value="3">Both</option>
            </select>
        </div>
    );
};

const RulesetFilterField = (props: {
    rulesetFilter: RulesetFilter;
    dispatch: React.Dispatch<FilterAction>;
}) => {
    const ID = "filter-ruleset";
    return (
        <div className="col field">
            <label htmlFor={ID}>Mode</label>
            <select
                id={ID}
                className="form-control"
                value={props.rulesetFilter}
                onChange={(e) =>
                    props.dispatch({
                        type: "setRulesetFilter",
                        value: parseInt(e.target.value),
                    })
                }
            >
                <option value="1">Converted</option>
                <option value="2">Specific</option>
                <option value="3">Both</option>
            </select>
        </div>
    );
};

const QueryFilterField = (props: {
    querySource: string;
    dispatch: React.Dispatch<FilterAction>;
}) => {
    const ID = "filter-query";
    return (
        <div className="col field">
            <label htmlFor={ID}>Search query</label>
            <input
                type="text"
                id={ID}
                className="form-control"
                placeholder="queries like ar=9 are supported"
                value={props.querySource}
                onChange={(e) =>
                    props.dispatch({
                        type: "setQueryFilter",
                        source: e.target.value,
                    })
                }
            />
        </div>
    );
};

const ModsSelectField = (props: {
    currentMods: Mods | -1;
    dispatch: React.Dispatch<ModsAction>;
}) => {
    const ID = "current-mods";
    return (
        <div className="col field">
            <label htmlFor={ID}>Mod combination</label>
            <select
                id={ID}
                className="form-control"
                value={props.currentMods}
                onChange={(e) =>
                    props.dispatch({
                        type: "setCurrentMods",
                        value: parseInt(e.target.value),
                    })
                }
            >
                <option value="-1">Any</option>
                <option value="0">No Mod</option>
                <option value="16">Hard Rock</option>
                <option value="2">Easy</option>
                <option value="64">Double Time</option>
                <option value="80">HR + DT</option>
                <option value="66">EZ + DT</option>
                <option value="256">Half Time</option>
                <option value="272">HR + HT</option>
                <option value="258">EZ + HT</option>
            </select>
        </div>
    );
};

const LocalDataFilterField = (props: {
    localDataFilter: LocalDataFilter;
    dispatch: React.Dispatch<FilterAction>;
}) => {
    const ID = "filter-local-data";
    return (
        <div className="col field">
            <label htmlFor={ID}>Local data</label>
            <select
                id={ID}
                className="form-control"
                value={props.localDataFilter}
                onChange={(e) =>
                    props.dispatch({
                        type: "setLocalDataFilter",
                        value: parseInt(e.target.value),
                    })
                }
            >
                <option value="0">No filtering</option>
                <option value="1">Unplayed only</option>
                <option value="2">Played only</option>
                <option value="3">Maps you don&apos;t have</option>
                <option value="4">Maps you have</option>
                <option value="5">Owning but unplayed</option>
            </select>
        </div>
    );
};

const FiltersTab = (props: {
    filter: FilterState;
    pagination: PaginationState;
    currentMods: ModCombination;
    filteredCount: number;
    dispatch: React.Dispatch<ModsAction | PaginationAction | FilterAction>;
}) => {
    const { filter, pagination, currentMods, filteredCount, dispatch } = props;

    const handlePageStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!Number.isFinite(value)) return;
        dispatch({ type: "setPageStart", value, filteredCount });
    };

    const handlePageCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!Number.isFinite(value) || value < 0) return;
        dispatch({ type: "setPageCount", value });
    };

    return (
        <div className="row">
            <StatusFilterField
                statusFilter={filter.statusFilter}
                dispatch={dispatch}
            />
            <RulesetFilterField
                rulesetFilter={filter.rulesetFilter}
                dispatch={dispatch}
            />
            <QueryFilterField
                querySource={filter.querySource}
                dispatch={dispatch}
            />
            <ModsSelectField currentMods={currentMods} dispatch={dispatch} />
            <LocalDataFilterField
                localDataFilter={filter.localDataFilter}
                dispatch={dispatch}
            />
            <div className="col">
                <p>
                    <a href="#">Reset filters</a>
                    <br />
                    <input
                        style={{ width: "3em" }}
                        value={pagination.pageStart}
                        onChange={handlePageStartChange}
                    />
                    ..{selectPageEnd(pagination, filteredCount)} of{" "}
                    {filteredCount} maps
                    <br />
                    <input
                        style={{ width: "3em" }}
                        value={pagination.pageCount}
                        onChange={handlePageCountChange}
                    />{" "}
                    per page
                </p>
            </div>
        </div>
    );
};

const LocalDataTab = (props: { dispatch: React.Dispatch<DataAction> }) => {
    const ID = "local-data-file-input";
    const { dispatch } = props;

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = () => {
        const input = fileInputRef.current!;
        for (const file of input.files ?? []) {
            if (file.name.includes("osu!.db")) {
                file.arrayBuffer()
                    .then((buffer) => {
                        dispatch({ type: "loadLocalData", buffer });
                    })
                    .catch(console.error);
                break;
            }
        }
        input.files = null;
        dispatch({ type: "loadLocalData", buffer: null });
    };

    return (
        <div className="row">
            <div className="col field">
                <label htmlFor={ID} style={{ paddingRight: "1em" }}>
                    Load osu!.db file
                </label>
                <input
                    id={ID}
                    className="form-control-file"
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
};

const Tab = <K extends string>(props: {
    eventkey: K;
    active: (key: K) => boolean;
    setActive: (key: K) => void;
    children: React.ReactNode;
}) => {
    return (
        <li key={props.eventkey} className="nav-item">
            <button
                className={classNames(
                    "nav-link",
                    props.active(props.eventkey) && "active"
                )}
                onClick={() => props.setActive(props.eventkey)}
            >
                {props.children}
            </button>
        </li>
    );
};

const TabPane = <K extends string>(props: {
    eventkey: K;
    active: (eventkey: K) => boolean;
    children: React.ReactNode;
}) => {
    return (
        <div
            className={classNames(
                "tab-pane",
                props.active(props.eventkey) && "active"
            )}
        >
            {props.children}
        </div>
    );
};

export const Header = (props: {
    filter: FilterState;
    pagination: PaginationState;
    currentMods: ModCombination;
    filteredCount: number;
    dispatch: React.Dispatch<
        ModsAction | DataAction | FilterAction | PaginationAction
    >;
}) => {
    type TabId = "filters" | "local_data" | "about";

    const [activeTab, setActiveTab] = React.useState("filters" as TabId);
    const active = React.useCallback(
        (key: TabId) => key === activeTab,
        [activeTab]
    );

    return (
        <div className="header container-fluid">
            <ul className="nav nav-tabs">
                <Tab
                    eventkey="filters"
                    active={active}
                    setActive={setActiveTab}
                >
                    Filters
                </Tab>
                <Tab
                    eventkey="local_data"
                    active={active}
                    setActive={setActiveTab}
                >
                    Local data
                </Tab>
                <Tab eventkey="about" active={active} setActive={setActiveTab}>
                    About
                </Tab>
            </ul>
            <div className="tab-content">
                <TabPane eventkey="filters" active={active}>
                    <FiltersTab {...props} />
                </TabPane>
                <TabPane eventkey="local_data" active={active}>
                    <LocalDataTab dispatch={props.dispatch} />
                </TabPane>
            </div>
        </div>
    );
};
