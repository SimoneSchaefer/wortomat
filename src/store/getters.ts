import { IState } from "./istate";
import { NOVEL_ITEM_KEYS } from "./keys";
import { novelIdOrRaise } from "./store.helper";

const openNovelId = state => state.currentNovel?.id;
const currentChapters = state => getCurrentSelection(state, NOVEL_ITEM_KEYS.CHAPTERS);
const tags = state => state.novelItems[NOVEL_ITEM_KEYS.TAGS]

export default {
    openNovelId,
    currentChapters,
    tags
};


function getCurrentSelection(state, key: NOVEL_ITEM_KEYS) { 
    if (!novelIdOrRaise(state)) return [];

    const selectedItemIds = getCurrentSelectionIds(state, key);
    return (state.novelItems[key] || []).filter(item => selectedItemIds.includes(item.id));   
}

function getCurrentSelectionIds(state: IState, key: NOVEL_ITEM_KEYS) {
    return state.selection.get(key) || [];
}