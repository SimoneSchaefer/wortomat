import { BaseModel } from "@/models/Base.model";
import { ChapterService } from "@/service/Chapter.service";
import { NovelItemService } from "@/service/NovelItemService";
import { IState } from "./istate";
import { NOVEL_ITEM_KEYS } from "./keys";


export const KEY_TO_SERVICE: Map<string,NovelItemService>  = new Map<NOVEL_ITEM_KEYS,NovelItemService>([
    [NOVEL_ITEM_KEYS.CHAPTERS, new ChapterService()]
])

export function createItem(key: NOVEL_ITEM_KEYS, novelId: number, item: BaseModel) {
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.create(novelId, item);
    }
}

export async function deleteItemsInBackend(key: NOVEL_ITEM_KEYS, items: BaseModel[]) {
    const results = [];
    for (const item of items) {
        await deleteItem(key, item );
        results.push(item);
    } 
    return results;
}

export function deleteItem(key: NOVEL_ITEM_KEYS, item: BaseModel) {
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.delete(item);
    }
}

export function updateItemInBackend(key: NOVEL_ITEM_KEYS, item: BaseModel, overrideValues: Record<string, unknown>) {
    const newItem = Object.assign({}, item, overrideValues);
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.update(newItem);
    }
}

export function itemIdsToSelect(key: string, items: BaseModel[]): number[] {
    return items.map( item => item.id);    
}

export function getChildItems(state: IState, key: NOVEL_ITEM_KEYS): BaseModel[] {
    return state.currentNovel[key] as BaseModel[];
}

export function updateItemInStore(needle: BaseModel, haystack: BaseModel[], remove = false) {
    const index = findItem(needle, haystack);
    if (index > -1) {
        if (remove) haystack.splice(index, 1);
        if (!remove) haystack.splice(index, 1, needle);
    }
}

export function findItem(needle: BaseModel, haystack: BaseModel[]) {
    return haystack.findIndex(item => needle.id === item.id);
}


export function novelIdOrRaise(state) {
    const novelId = state.currentNovel?.id;
    if (!novelId) {
        // TODO: handle loading state / display message
        console.warn('No open novel!')
    }
    return novelId;
}