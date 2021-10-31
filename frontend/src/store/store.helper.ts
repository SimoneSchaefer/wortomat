import { BaseModel } from "@/models/Base.model";
import { IState } from "./istate";
import { NOVEL_ITEM_KEYS } from "./keys";

export function itemIdsToSelect(key: string, items: BaseModel[]): number[] {
    return items.map( item => item.id);    
}

export function getChildItems(state: IState, key: NOVEL_ITEM_KEYS): BaseModel[] {
    return state.novelItems.get(key) as BaseModel[];
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