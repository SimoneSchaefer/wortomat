import { BaseModel } from "@/models/Base.model";
import { NovelModel } from "@/models/Novel.model";
import { TagModel } from "@/models/Tag.model";
import { IState } from "./istate";
import { CHILD_ITEM_KEYS, DISPLAY_SETTINGS_KEYS, NOVEL_ITEM_KEYS, parentKeyForChildKey, PARENT_ITEM_KEYS } from "./keys";
import { findParentForChild, getAllEnumValues, itemIdsToSelect, updateItemInStore } from "./store.helper";


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

const parentItemKeySelected = (state: IState, payload: PARENT_ITEM_KEYS): void => {
    state.activeParentKey = payload;
};

const displaySettingsUpdated = (state: IState, payload: Record<NOVEL_ITEM_KEYS, Record<DISPLAY_SETTINGS_KEYS, boolean>>): void => {
    state.displaySettings = payload;
}


const novelOpened = (state: IState, payload: NovelModel): void => {
    state.currentNovel = payload;
}

const tagsLoaded = (state: IState, payload: []): void => {
    state.novelItems.set(PARENT_ITEM_KEYS.TAGS, payload);
}

const tagsFiltered = (state: IState, payload: { key: NOVEL_ITEM_KEYS, tags: TagModel[]}): void => {
    state.filteredTags.set(payload.key, payload.tags.map(tag => tag.id));
}

const itemsLoaded = (state: IState, payload: { key: PARENT_ITEM_KEYS, items: BaseModel[]}): void => {
    const {key, items } = payload;
    state.novelItems.set(key, items);
}


const itemAdded = (state: IState, payload: { key: PARENT_ITEM_KEYS | CHILD_ITEM_KEYS, item: BaseModel }): void => {
    const { key, item } = payload;
    if (isParentKey(key)) {
        parentItemAdded(state, key as PARENT_ITEM_KEYS, item);
    } else {
        childItemAdded(state, key as CHILD_ITEM_KEYS, item);
    }
}
 
const itemUpdated = (state: IState, payload: { key: PARENT_ITEM_KEYS | CHILD_ITEM_KEYS, item: BaseModel}):void => {
    const { key, item } = payload;
    if (isParentKey(key)) {
        parentItemUpdated(state, key as PARENT_ITEM_KEYS, item);
    } else {
        childItemUpdated(state, key as CHILD_ITEM_KEYS, item);
    }
}


const itemsDeleted = (state: IState, payload: { key: PARENT_ITEM_KEYS | CHILD_ITEM_KEYS, items: BaseModel[]}): void => {
    const { key, items } = payload;
    if (isParentKey(key)) {
        parentsDeleted(state, key as PARENT_ITEM_KEYS, items);
    } else {
        childrenDeleted(state, key as CHILD_ITEM_KEYS, items);
    }
}
  
const itemsSelected = (state: IState, payload: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}): void => {
    const {key, items } = payload;
    state.selection.set(key, itemIdsToSelect(key, items));
}

  export default {
    novelsLoaded,
    novelAdded,
    novelUpdated,
    novelDeleted,
    novelOpened,
    tagsFiltered,
    setLoading,
    setModalOpen,
    itemsLoaded,
    tagsLoaded,
    itemsSelected,
    itemAdded,
    itemUpdated,
    itemsDeleted,
    displaySettingsUpdated,
    parentItemKeySelected
};



const childItemAdded = (state: IState, key: CHILD_ITEM_KEYS, item: BaseModel): void => {
    const parent = state.novelItems.get(parentKeyForChildKey(key)).find(parent => parent.id === item.parentId);
    parent['children'].push(item);
};

const parentItemAdded = (state: IState, key: PARENT_ITEM_KEYS, item: BaseModel): void => {
    const items = state.novelItems.get(key) as BaseModel[] || [];
    items.push(item);
    state.novelItems.set(key, items);
};


const parentItemUpdated = (state: IState, key: PARENT_ITEM_KEYS, item: BaseModel): void => {
    updateItemInStore(item, state.novelItems.get(key as PARENT_ITEM_KEYS) as BaseModel[]);
};

const childItemUpdated = (state: IState, key: CHILD_ITEM_KEYS, item: BaseModel): void => {
    const parent = findParentForChild(state, key, item);
    const index = parent['children'].findIndex(child => child.id === item.id);
    parent['children'].splice(index, 1, item);
};


const parentsDeleted = (state: IState, key: PARENT_ITEM_KEYS, items: BaseModel[]): void => {
    const itemIds = items.map(item => item.id);
    const afterDeletion = state.novelItems.get(key).filter(i => !itemIds.includes(i.id));
    state.novelItems.set(key, afterDeletion);
};

const childrenDeleted = (state: IState, key: CHILD_ITEM_KEYS, items: BaseModel[]): void => {
    const allParentItems = state.novelItems.get(parentKeyForChildKey(key));
    for (const item of items) {
        const parentItem = allParentItems.find(parent => parent.id === item.parentId);
        const childIndex = parentItem['children'].findIndex(child => child.id === item.id);
        parentItem['children'].splice(childIndex, 1);
    }
}

const isParentKey = (key: PARENT_ITEM_KEYS | CHILD_ITEM_KEYS) => {
    const allParentKeys = getAllEnumValues(PARENT_ITEM_KEYS);
    return allParentKeys.includes(key);
}