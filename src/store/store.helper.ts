import { BaseModel } from "@/models/Base.model";
import { ChapterService } from "@/service/Chapter.service";
import { NovelItemService } from "@/service/NovelItemService";

export enum SELECTION_KEYS {
    CHAPTERS = 'chapters'
}

export const KEY_TO_SERVICE: Map<string,NovelItemService>  = new Map<SELECTION_KEYS,NovelItemService>([
    [SELECTION_KEYS.CHAPTERS, new ChapterService()]
])

export function addItem(key: SELECTION_KEYS, novelId: number, item: BaseModel) {
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.create(novelId, item);
    }
}

export function deleteItem(key: SELECTION_KEYS, item: BaseModel) {
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.delete(item);
    }
}

export function updateItem(key: SELECTION_KEYS, item: BaseModel, overrideValues: Record<string, unknown>) {
    const newItem = Object.assign({}, item, overrideValues);
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.update(newItem);
    }
}

export function getCurrentSelection(state, key: SELECTION_KEYS) {
    const novelId = novelIdOrRaise(state);
    if (novelId) {
        const selectedItemIds = getCurrentSelectionIds(state, key);
        return state.currentNovel[key].filter(chapter => selectedItemIds.includes(chapter.id));
    }
}

export function getCurrentSelectionIds(state, key: SELECTION_KEYS) {
    const novelId = novelIdOrRaise(state);
    if (novelId) {
        const currentSelections = {...state.selection[novelId]} || {};
        const selectedItemIds = currentSelections[key] ||[];
        return selectedItemIds;
    }
    return [];
}

export function itemIdsToSelect(selection: { key: string, items: BaseModel[]}) {
    return selection.items.map( item => item.id);    
}

export function novelIdOrRaise(state) {
    const novelId = state.currentNovel?.id;
    if (!novelId) {
        // TODO: handle loading state / display message
        console.warn('No open novel!')
    }
    return novelId;
}