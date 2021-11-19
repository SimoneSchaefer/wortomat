import { BaseModel } from "@/models/Base.model";
import { ChapterService } from "@/service/Chapter.service";
import { CharacterService } from "@/service/Character.service";
import { NovelItemService } from "@/service/NovelItemService";
import { PartService } from "@/service/Parts.service";
import { ResearchService } from "@/service/Research.service";
import { ResearchGroupService } from "@/service/ResearchGroupService";
import { CharacterGroupService } from "@/service/CharacterGroupService";
import { TagService } from "@/service/Tag.service";
import { TimelineService } from "@/service/TimelineService";
import { AxiosResponse } from "axios";
import { NOVEL_ITEM_KEYS } from "./keys";
import { LocationService } from "@/service/Location.service";
import { LocationGroupService } from "@/service/LocationGroupService";

export const KEY_TO_SERVICE: Map<NOVEL_ITEM_KEYS,NovelItemService>  = new Map<NOVEL_ITEM_KEYS,NovelItemService>([
    [NOVEL_ITEM_KEYS.TIMELINE, new TimelineService()],
    [NOVEL_ITEM_KEYS.CHAPTERS, new ChapterService()],
    [NOVEL_ITEM_KEYS.PARTS, new PartService()],
    [NOVEL_ITEM_KEYS.CHARACTERS, new CharacterService()],
    [NOVEL_ITEM_KEYS.CHARACTER_GROUPS, new CharacterGroupService()],
    [NOVEL_ITEM_KEYS.LOCATIONS, new LocationService()],
    [NOVEL_ITEM_KEYS.LOCATION_GROUPS, new LocationGroupService()],
    [NOVEL_ITEM_KEYS.RESEARCH_GROUPS, new ResearchGroupService()],
    [NOVEL_ITEM_KEYS.RESEARCH, new ResearchService()],
    [NOVEL_ITEM_KEYS.TAGS, new TagService()]
]);

export const KEY_TO_CHILD: Map<NOVEL_ITEM_KEYS,NOVEL_ITEM_KEYS>  = new Map<NOVEL_ITEM_KEYS,NOVEL_ITEM_KEYS>([
    [NOVEL_ITEM_KEYS.PARTS, NOVEL_ITEM_KEYS.CHAPTERS],
    [NOVEL_ITEM_KEYS.RESEARCH_GROUPS, NOVEL_ITEM_KEYS.RESEARCH],
    [NOVEL_ITEM_KEYS.CHARACTER_GROUPS, NOVEL_ITEM_KEYS.CHARACTERS],
    [NOVEL_ITEM_KEYS.LOCATION_GROUPS, NOVEL_ITEM_KEYS.LOCATIONS],
]);

export function loadItemsFromBackend(key: NOVEL_ITEM_KEYS, novelId: number): Promise<AxiosResponse> {
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.list(novelId);
    }
}

export function loadTagsFromBackend(key: NOVEL_ITEM_KEYS, novelId: number): Promise<AxiosResponse> {
    /*if (key === NOVEL_ITEM_KEYS.TIMELINE) {
        key = NOVEL_ITEM_KEYS.CHAPTERS; //TODO
    }*/
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.tags(novelId);
    }
}

export function createItemInBackend(key: NOVEL_ITEM_KEYS, novelId: number, item: BaseModel, parentId?: number): Promise<AxiosResponse> {
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.create(novelId, item, parentId);
    }
}

export async function deleteItemsInBackend(key: NOVEL_ITEM_KEYS, novelId: number, items: BaseModel[]): Promise<BaseModel[]> {
    const results = new Array<BaseModel>();
    for (const item of items) {
        await deleteItemInBackend(key, novelId, item );
        results.push(item);
    } 
    return results;
}

export function deleteItemInBackend(key: NOVEL_ITEM_KEYS, novelId: number, item: BaseModel): Promise<AxiosResponse> {
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.delete(novelId, item);
    }
}

export function updatePositionsInBackend(key: NOVEL_ITEM_KEYS, novelId: number, items: BaseModel[]): Promise<AxiosResponse> {
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.updatePositions(novelId, items);
    }
}

export function moveChildInBackend(key: NOVEL_ITEM_KEYS, novelId: number, childId: number, newParent: number, newPosition: number): Promise<AxiosResponse> {
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.moveChild(novelId, childId, newParent, newPosition);
    }
}

export function updateItemInBackend(key: NOVEL_ITEM_KEYS, novelId: number, item: BaseModel, overrideValues: Record<string, unknown>): Promise<AxiosResponse> {
    const newItem = Object.assign({}, item, overrideValues);
    const serviceToUse = KEY_TO_SERVICE.get(key);
    if (serviceToUse) {
        return serviceToUse.update(novelId, newItem);
    }
}