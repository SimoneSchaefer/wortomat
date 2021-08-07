import { BaseModel } from "@/models/Base.model";
import { ChapterService } from "@/service/Chapter.service";
import { NovelItemService } from "@/service/NovelItemService";
import { IState } from "./store";

export enum NOVEL_ITEM_KEYS {
    CHAPTERS = 'chapters'
}

export const KEY_TO_SERVICE: Map<string,NovelItemService>  = new Map<NOVEL_ITEM_KEYS,NovelItemService>([
    [NOVEL_ITEM_KEYS.CHAPTERS, new ChapterService()]
])

export function createItem(key: NOVEL_ITEM_KEYS, novelId: number, item: BaseModel) {
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.create(novelId, item);
    }
}

export async function deleteItems(key: NOVEL_ITEM_KEYS, items: BaseModel[]) {
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

export function updateItem(key: NOVEL_ITEM_KEYS, item: BaseModel, overrideValues: Record<string, unknown>) {
    const newItem = Object.assign({}, item, overrideValues);
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.update(newItem);
    }
}

export function getCurrentSelection(state, key: NOVEL_ITEM_KEYS) { 
    if (novelIdOrRaise(state)) {
        const selectedItemIds = getCurrentSelectionIds(state, key);
        return state.currentNovel[key].filter(chapter => selectedItemIds.includes(chapter.id));
    }
    return [];   
}

export function getCurrentSelectionIds(state: IState, key: NOVEL_ITEM_KEYS) {
    return state.selection.get(key) || [];
}

export function itemIdsToSelect(key: string, items: BaseModel[]) {
    return items.map( item => item.id);    
}

export function novelIdOrRaise(state) {
    const novelId = state.currentNovel?.id;
    if (!novelId) {
        // TODO: handle loading state / display message
        console.warn('No open novel!')
    }
    return novelId;
}