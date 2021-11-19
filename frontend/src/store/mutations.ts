import { BaseModel } from "@/models/Base.model";
import { NovelModel } from "@/models/Novel.model";
import { TagModel } from "@/models/Tag.model";
import { IState } from "./istate";
import { NOVEL_ITEM_KEYS, VIEWS } from "./keys";
import { KEY_TO_CHILD } from "./store-api-adapter";
import { findItem, getChildItems, itemIdsToSelect, updateItemInStore } from "./store.helper";


const setLoading = (state: IState, payload: { loading: boolean}): void => {
    state.loading = payload.loading;
};

const setModalOpen = (state: IState, payload: { isOpen: boolean }): void => {
    state.modalIsOpen = payload.isOpen;
};

const novelsLoaded = (state: IState, payload: NovelModel[]): void => {
    state.novels = payload;
}

const novelAdded = (state: IState, payload: NovelModel): void => {
    state.novels.push(payload);
};
 
const novelUpdated = (state: IState, payload: NovelModel): void => {
    updateItemInStore(payload, state.novels)  
}; 

const novelDeleted = (state: IState, payload: NovelModel): void => {
    updateItemInStore(payload, state.novels, true)  
};

const novelOpened = (state: IState, payload: NovelModel): void => {
    state.currentNovel = payload;
}

const tagsLoaded = (state: IState, payload: []): void => {
    state.novelItems.set(NOVEL_ITEM_KEYS.TAGS, payload);
}

const tagsFiltered = (state: IState, payload: { key: NOVEL_ITEM_KEYS, tags: TagModel[]}): void => {
    state.filteredTags.set(payload.key, payload.tags.map(tag => tag.id));
}

const setView = (state: IState, payload: { key: NOVEL_ITEM_KEYS, view: VIEWS, value: boolean}): void => {
    const currentView = state.view.get(payload.key);
    currentView.set(payload.view, payload.value);
    state.view.set(payload.key, currentView);
};

const itemsLoaded = (state: IState, payload: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}): void => {
    const {key, items } = payload;
    state.novelItems.set(key, items);
}

    
const itemAdded = (state: IState, payload: { key: NOVEL_ITEM_KEYS, item: BaseModel }): void => {
    const { key, item } = payload;
    const parent = findParent(state, key, item );
    if (parent) { 
        if (!parent['children']) { parent['children'] = []; }
        parent['children'].push(item);
    } else {
        const items = state.novelItems.get(key) as BaseModel[] || [];
        items.push(item);
        state.novelItems.set(key, items);
    }
    if (!KEY_TO_CHILD.has(key)) {
        state.selection.set(key, [item.id]);
    }
}
  
const itemUpdated = (state: IState, payload: { key: NOVEL_ITEM_KEYS, item: BaseModel}):void => {
    const { key, item } = payload;
    const parent = findParent(state, key, item );
    if (parent) {
        const index = findItem(item, parent['children']);
        parent['children'].splice(index, 1, item);
    } else {
        updateItemInStore(item, state.novelItems.get(key) as BaseModel[]);
    }
}

const itemsDeleted = (state: IState, payload: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}): void => {
    const { key, items } = payload;
    const itemIds = items.map(item => item.id);
    if (KEY_TO_CHILD.has(key)) {
        state.novelItems.set(key, getChildItems(state, key).filter(i => !itemIds.includes(i.id)));
    } else {
        if (key === NOVEL_ITEM_KEYS.TIMELINE) { // TODO generic handling for flat hierarchies
            state.novelItems.set(key, state.novelItems.get(key).filter(i => !itemIds.includes(i.id)));
        } else {
            const allParentItems = state.novelItems.get(getParentKey(key));
            for (const item of items) {
                const parentItem = allParentItems.find(parent => parent.id === item.parentId);
                const childIndex = parentItem['children'].findIndex(child => child.id === item.id);
                parentItem['children'].splice(childIndex, 1);
            }
        }
        
       
    }
}
  
const itemsSelected = (state: IState, payload: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}): void => {
    const {key, items } = payload;
    state.selection.set(key, itemIdsToSelect(key, items));
}

const getParentKey = ( itemKey : NOVEL_ITEM_KEYS ): NOVEL_ITEM_KEYS => {
    const parentKey = Array.from(KEY_TO_CHILD.entries()).find(entry => entry[1] === itemKey)
    return parentKey ? parentKey[0] : null;
}

const findParent = (state: IState, itemKey: NOVEL_ITEM_KEYS, item: BaseModel ) => {
    const parentKey = getParentKey(itemKey);
    if (!parentKey) { return null }

    const allParents = state.novelItems.get(parentKey);
    return allParents.find(parent => parent.id === item.parentId);
}

  export default {
    novelsLoaded,
    novelAdded,
    novelUpdated,
    novelDeleted,
    novelOpened,
    tagsFiltered,
    setView,
    setLoading,
    setModalOpen,
    itemsLoaded,
    tagsLoaded,
    itemsSelected,
    itemAdded,
    itemUpdated,
    itemsDeleted
};