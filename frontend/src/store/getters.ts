import { BaseModel } from "@/models/Base.model";
import { IState } from "./istate";
import { NOVEL_ITEM_KEYS, PARENT_ITEM_KEYS } from "./keys";



export function getAllItems(state: IState, key: PARENT_ITEM_KEYS) {
    const allItems = state.novelItems.get(key) || [];
    return allItems;
}
