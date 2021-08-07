import { BaseModel } from "@/models/Base.model";
import { NovelModel } from "@/models/Novel.model";
import { IState } from "./store";
import { getChildItems, itemIdsToSelect, NOVEL_ITEM_KEYS, updateItemInStore } from "./store.helper";

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
}

//// Novel items mutations ////
const itemsLoaded = (state, payload: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}) => {
    const {key, items } = payload;
    state.currentNovel[key] = items;
}

const itemsSelected = (state: IState, payload: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}) => {
    const {key, items } = payload;
    state.selection.set(key, itemIdsToSelect(key, items))
}
    
const itemAdded = (state, payload: { key: NOVEL_ITEM_KEYS, item: BaseModel}) => {
    const {key, item } = payload;
    (state.currentNovel[key] as BaseModel[]).push(item);
}
  
const itemUpdated = (state, payload: { key: NOVEL_ITEM_KEYS, item: BaseModel}) => {
    const {key, item } = payload;
    updateItemInStore(item, state.currentNovel[key] as BaseModel[]);
}

const itemsDeleted = (state, payload: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}) => {
    const {key, items } = payload;
    const itemIds = items.map(item => item.id);
    state.currentNovel[key] = getChildItems(state, key).filter(i => !itemIds.includes(i.id));
}
  
  export default {
    novelsLoaded,
    novelAdded,
    novelUpdated,
    novelDeleted,
    novelOpened,

    itemsLoaded,
    itemsSelected,
    itemAdded,
    itemUpdated,
    itemsDeleted
};