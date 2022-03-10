interface PaginationState {
    pageStart: number,
    pageCount: number,
}

type PaginationAction =
    { type: 'setPaginationState', state: PaginationState } |
    { type: 'setPageStart', value: number, filteredCount: number } |
    { type: 'setPageCount', value: number };

function selectPageEnd(state: PaginationState, filteredCount: number): number {
    return clamp(state.pageStart + state.pageCount, 0, filteredCount);
}

function selectCurrentPage(state: PaginationState, sortedMaps: BeatmapInfo[]): BeatmapInfo[] {
    const { pageStart } = state;
    const pageEnd = selectPageEnd(state, sortedMaps.length);
    return sortedMaps.slice(pageStart, pageEnd);
}

function handlePaginationAction(state: PaginationState, action: PaginationAction): PaginationState {
    switch (action.type) {
        case 'setPaginationState':
            return action.state;

        case 'setPageStart': {
            const pageStart = clamp(action.value, 0, action.filteredCount);
            return { ...state, pageStart };
        }

        case 'setPageCount': {
            const pageCount = action.value;
            return { ...state, pageCount };
        }
    }
}
