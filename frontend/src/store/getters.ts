import { BaseModel } from "@/models/Base.model";
import { IState } from "./istate";
import { NOVEL_ITEM_KEYS } from "./keys";
import { novelIdOrRaise } from "./store.helper";

const openNovelId = (state : IState) : number => state.currentNovel?.id;
const currentChapters = (state : IState): BaseModel[] => getCurrentSelection(state, NOVEL_ITEM_KEYS.CHAPTERS);
const filteredChapters = (state : IState): BaseModel => getFilteredItems(state, NOVEL_ITEM_KEYS.CHAPTERS);
const selectedCharacters = (state : IState): BaseModel[] => getCurrentSelection(state, NOVEL_ITEM_KEYS.CHARACTERS);
const filteredCharacters = (state : IState): BaseModel => getFilteredItems(state, NOVEL_ITEM_KEYS.CHARACTERS);
const currentResearch = (state : IState): BaseModel[] => getCurrentSelection(state, NOVEL_ITEM_KEYS.RESEARCH);
const filteredResearch = (state : IState): BaseModel => getFilteredItems(state, NOVEL_ITEM_KEYS.RESEARCH);
const tags = (state : IState): BaseModel[] => state.novelItems[NOVEL_ITEM_KEYS.TAGS] || []

export default {
    openNovelId,
    currentChapters,
    filteredChapters,
    currentResearch,
    filteredResearch,
    selectedCharacters,
    filteredCharacters,
    tags
};

export function getFilteredItems(state: IState, key: NOVEL_ITEM_KEYS) { 
    if (!novelIdOrRaise(state)) return [];

    const allItems = state.novelItems[key] || [];
    const filteredTagIds = state.filteredTags.get(key) || [];

    if (!filteredTagIds.length) { return allItems;}
    return allItems.filter(item => {
        const includedTags = (item.tags ||[]).map(tag => tag.id);
        const notIncluded = filteredTagIds.find(tagId => !includedTags.includes(tagId));
        return !notIncluded;
    });   
}


export function getCurrentSelection(state: IState, key: NOVEL_ITEM_KEYS): BaseModel[] { 
    if (!novelIdOrRaise(state)) return [];

    const selectedItemIds = getCurrentSelectionIds(state, key);
    const filteredItems = getFilteredItems(state, key);
    return filteredItems.filter(item => selectedItemIds.includes(item.id));   
}

function getCurrentSelectionIds(state: IState, key: NOVEL_ITEM_KEYS) {
    return state.selection.get(key) || [];
}