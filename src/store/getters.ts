import { IState } from "./store";
import { novelIdOrRaise, NOVEL_ITEM_KEYS } from "./store.helper";

const openNovelId = state => state.currentNovel?.id;
const currentChapters = state => getCurrentSelection(state, NOVEL_ITEM_KEYS.CHAPTERS);

export default {
    openNovelId,
    currentChapters,
};


function getCurrentSelection(state, key: NOVEL_ITEM_KEYS) { 
    if (!novelIdOrRaise(state)) return [];

    const selectedItemIds = getCurrentSelectionIds(state, key);
    return state.currentNovel[key].filter(chapter => selectedItemIds.includes(chapter.id));   
}

function getCurrentSelectionIds(state: IState, key: NOVEL_ITEM_KEYS) {
    return state.selection.get(key) || [];
}