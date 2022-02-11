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
