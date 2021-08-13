import { BaseModel } from "@/models/Base.model";
import { ChapterService } from "@/service/Chapter.service";
import { NovelItemService } from "@/service/NovelItemService";
import { TagService } from "@/service/Tag.service";
import { NOVEL_ITEM_KEYS } from "./keys";

export const KEY_TO_SERVICE: Map<string,NovelItemService>  = new Map<NOVEL_ITEM_KEYS,NovelItemService>([
    [NOVEL_ITEM_KEYS.CHAPTERS, new ChapterService()],
    [NOVEL_ITEM_KEYS.TAGS, new TagService()]
])

export function loadItemsFromBackend(key: NOVEL_ITEM_KEYS, novelId: number) {
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.list(novelId);
    }

}

export function createItemInBackend(key: NOVEL_ITEM_KEYS, novelId: number, item: BaseModel) {
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.create(novelId, item);
    }
}

export async function deleteItemsInBackend(key: NOVEL_ITEM_KEYS, items: BaseModel[]) {
    const results = [];
    for (const item of items) {
        await deleteItemInBackend(key, item );
        results.push(item);
    } 
    return results;
}

export function deleteItemInBackend(key: NOVEL_ITEM_KEYS, item: BaseModel) {
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