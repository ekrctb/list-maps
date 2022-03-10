import { SetAppStateAction } from "../state/app.js";
import { ANY_MODS, MOD_COMBINATIONS, ModCombination } from "../state/data.js";
import {
    StatusFilter,
    RulesetFilter,
    LocalDataFilter,
    FilterState,
    selectQueryExpression,
} from "../state/filter.js";
import { PaginationState } from "../state/pagination.js";
import {
    BeatmapSortKey,
    SortOrder,
    pushSortOrder,
    SortState,
} from "../state/sort.js";
import { findToString, clamp } from "../utils.js";

type HashStringKey = "s" | "m" | "q" | "d" | "i" | "n" | "o" | "x";

const HASH_SORT_KEY_MAP: Record<BeatmapSortKey, number> = {
    date: 1,
    title: 2,
    stars: 3,
    pp: 4,
    length: 5,
    bpm: 12,
    combo: 6,
    ar: 7,
    cs: 8,
    fc_count: 9,
    fc_mods: 10,
    local_data: 11,
};

const HASH_DEFAULT = {
    s: StatusFilter.Ranked,
    m: RulesetFilter.Both,
    q: "",
    d: LocalDataFilter.NoFiltering,
    i: 0,
    n: 100,
    o: "",
    x: ANY_MODS,
} as const;

const parseHashString = (hash: string): SetAppStateAction => {
    const map = new Map(
        hash
            .split("&")
            .map((part) => [
                part.slice(0, 1),
                decodeURIComponent(part.slice(2)),
            ])
    );

    const statusFilter =
        findToString(map.get("s"), [
            StatusFilter.Ranked,
            StatusFilter.Loved,
            StatusFilter.Both,
        ]) ?? HASH_DEFAULT.s;

    const rulesetFilter =
        findToString(map.get("m"), [
            RulesetFilter.Converted,
            RulesetFilter.Specific,
            RulesetFilter.Both,
        ]) ?? HASH_DEFAULT.m;

    const querySource = map.get("q") ?? HASH_DEFAULT.q;

    const localDataFilter =
        findToString(map.get("d"), [
            LocalDataFilter.NoFiltering,
            LocalDataFilter.Unplayed,
            LocalDataFilter.Played,
            LocalDataFilter.HasData,
            LocalDataFilter.NoData,
            LocalDataFilter.HasDataUnplayed,
        ]) ?? HASH_DEFAULT.d;

    let sortOrder: SortOrder = [];
    for (const part of (map.get("o") ?? HASH_DEFAULT.o).split(".")) {
        const value = parseInt(part);
        const abs = Math.abs(value);
        const key = Object.entries(HASH_SORT_KEY_MAP).find((x) => x[1] === abs);
        if (key !== undefined) {
            const dir = value > 0 ? "asc" : "desc";
            sortOrder = pushSortOrder(sortOrder, key[0] as BeatmapSortKey, dir);
        }
    }

    const pageStart = clamp(
        parseInt(map.get("i") || HASH_DEFAULT.i.toString()),
        0,
        99999
    );

    const pageCount = clamp(
        parseInt(map.get("n") || HASH_DEFAULT.n.toString()),
        0,
        99999
    );

    return {
        type: "setAppState",
        currentMods:
            findToString(map.get("x"), MOD_COMBINATIONS) ?? HASH_DEFAULT.x,
        filter: {
            statusFilter,
            rulesetFilter,
            querySource,
            localDataFilter,
        },
        sort: {
            sortOrder,
        },
        pagination: {
            pageStart,
            pageCount,
        },
    };
};

export const UriHash = (props: {
    currentMods: ModCombination;
    filter: FilterState;
    sort: SortState;
    pagination: PaginationState;
    dispatch: React.Dispatch<SetAppStateAction>;
}) => {
    const { currentMods, filter, sort, pagination, dispatch } = props;
    const { statusFilter, rulesetFilter, querySource, localDataFilter } =
        filter;

    const { normalizedSource } = selectQueryExpression(querySource, () => -1);

    const hashObject: Record<HashStringKey, number | string> = {
        s: statusFilter,
        m: rulesetFilter,
        q: normalizedSource,
        d: localDataFilter,
        i: pagination.pageStart,
        n: pagination.pageCount,
        o: sort.sortOrder
            .map(
                ([key, dir]) =>
                    HASH_SORT_KEY_MAP[key] * (dir === "asc" ? 1 : -1)
            )
            .join("."),
        x: currentMods,
    };
    const hashString = Object.entries(hashObject)
        .filter(([k, v]) => v !== HASH_DEFAULT[k as HashStringKey])
        .map(([k, v]) => `${k}=${encodeURIComponent(v.toString())}`)
        .join("&");

    const hashStringWithHash = hashString === "" ? "" : `#${hashString}`;

    React.useEffect(() => {
        const handleHashChange = () => {
            dispatch(parseHashString(location.hash.slice(1)));
        };

        handleHashChange();
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, []);

    React.useEffect(() => {
        history.replaceState(
            {},
            document.title,
            location.pathname + hashStringWithHash
        );
    }, [hashStringWithHash]);

    return <></>;
};
