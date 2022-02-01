import { BaseModel } from "@/models/Base.model";
import { IState } from "./istate";
import { NOVEL_ITEM_KEYS, PARENT_ITEM_KEYS } from "./keys";
import { novelIdOrRaise } from "./store.helper";

const openNovelId = (state : IState) : number => state.currentNovel?.id;
 const tags = (state : IState): BaseModel[] => state.novelItems.get(PARENT_ITEM_KEYS.TAGS) || []

export default {
    openNovelId,
    tags
};

export function getSortedEvents(state: IState) {
   /* const allItems = state.novelItems.get(PARENT_ITEM_KEYS.TIMELINE) || [];
    allItems.sort(function(a, b) {
        if (a.eventDate === null && b.eventDate === null) {
            return a.id < b.id;
        }
        if (a.eventDate === null) {
            return -1;
        }
        if (b.eventDate === null) {
            return 1;
        }
        if (a.eventDate < b.eventDate) {
          return -1;
        }
        if (a.eventDate > b.eventDate) {
          return 1;
        }      
      });
    return allItems;*/
    return [];
}

export function getAllItems(state: IState, key: PARENT_ITEM_KEYS) {
    if (!novelIdOrRaise(state)) return [];

    const allItems = state.novelItems.get(key) || [];
    return allItems;
}
