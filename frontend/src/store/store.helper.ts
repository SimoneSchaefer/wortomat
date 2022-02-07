import { BaseModel } from "@/models/Base.model";
import { getAllItems } from "./getters";
import { IState } from "./istate";
import { CHILD_ITEM_KEYS, parentKeyForChildKey, PARENT_ITEM_KEYS } from "./keys";


export function getAllEnumValues(enumType) {
    const allValues = [];
    for (const value in enumType) {
        if (isNaN(Number(value))) allValues.push(value)
    }
    return allValues;
}

export function findParentForChild(state: IState, childKey: CHILD_ITEM_KEYS, item: BaseModel) {
    for (const group of getAllItems(state, parentKeyForChildKey(childKey))) {
      const hasChild = group['children'].find(child => child.id === item.id);
      if (hasChild) {
          return group;
      }
    }
  }

export function itemIdsToSelect(key: string, items: BaseModel[]): number[] {
    return items.map( item => item.id);    
}

export function getChildItems(state: IState): BaseModel[] {
    return state.novelItems.get(state.activeParentKey) as BaseModel[];
}

export function updateItemInStore(needle: BaseModel, haystack: BaseModel[], remove = false): void {
    const index = findItem(needle, haystack);
    if (index > -1) {
        if (remove) haystack.splice(index, 1);
        if (!remove) haystack.splice(index, 1, needle);
    }
}

export function findItem(needle: BaseModel, haystack: BaseModel[]): number {
    return haystack.findIndex(item => needle.id === item.id);
}


export function novelIdOrRaise(state: IState): number {
    const novelId = state.currentNovel?.id;
    if (!novelId) {
        // TODO: handle loading state / display message
        console.warn('No open novel!')
    }
    return novelId;
}