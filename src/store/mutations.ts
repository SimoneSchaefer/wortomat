import { BaseModel } from "@/models/Base.model";
import { NovelModel } from "@/models/Novel.model";
import { TagModel } from "@/models/Tag.model";
import { IState } from "./istate";
import { NOVEL_ITEM_KEYS, VIEWS } from "./keys";
import { getChildItems, itemIdsToSelect, updateItemInStore } from "./store.helper";

//// Novel mutations //// 
const novelsLoaded = (state: IState, payload: NovelModel[]) => {
    state.novels = payload;
}

const novelAdded = (state: IState, payload: NovelModel) => {
    state.novels.push(payload);
};
 
const novelUpdated = (state: IState, payload: NovelModel) => {
    updateItemInStore(payload, state.novels)  
}; 

const novelDeleted = (state: IState, payload: NovelModel) => {
    updateItemInStore(payload, state.novels, true)  
};

const novelOpened = (state: IState, payload: NovelModel) => {
    state.currentNovel = payload;
    state.novelItems[NOVEL_ITEM_KEYS.TAGS] = payload.tags;
}

const tagsFiltered = (state: IState, payload: { key: NOVEL_ITEM_KEYS, tags: TagModel[]}) => {
    state.filteredTags.set(payload.key, payload.tags.map(tag => tag.id));
}

const setView = (state: IState, payload: { view: VIEWS, value: boolean}) => {
    console.log('MUTATION', payload)
    console.log('CURRENT', state.view)

    state.view.set(payload.view, payload.value);
};

//// Novel items mutations ////
const itemsLoaded = (state, payload: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}) => {
    const {key, items } = payload;
    state.novelItems[key] = items;
    if (items.length && !state.selection.get(key)?.length) {
        state.selection.set(key, itemIdsToSelect(key, [items[0]]))
    }
}

const itemsSelected = (state: IState, payload: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}) => {
    const {key, items } = payload;
    state.selection.set(key, itemIdsToSelect(key, items))
}
    
const itemAdded = (state, payload: { key: NOVEL_ITEM_KEYS, item: BaseModel}) => {
    const {key, item } = payload;
    const items = state.novelItems[key] as BaseModel[] || [];
    items.push(item);
    state.novelItems[key] = items;
}
  
const itemUpdated = (state, payload: { key: NOVEL_ITEM_KEYS, item: BaseModel}) => {
    const {key, item } = payload;
    updateItemInStore(item, state.novelItems[key] as BaseModel[]);
}

const itemsDeleted = (state, payload: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}) => {
    const {key, items } = payload;
    const itemIds = items.map(item => item.id);
    state.novelItems[key] = getChildItems(state, key).filter(i => !itemIds.includes(i.id));
}
  
  export default {
    novelsLoaded,
    novelAdded,
    novelUpdated,
    novelDeleted,
    novelOpened,
    tagsFiltered,
    setView,

    itemsLoaded,
    itemsSelected,
    itemAdded,
    itemUpdated,
    itemsDeleted
};