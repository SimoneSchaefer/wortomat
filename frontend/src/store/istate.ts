import { BaseModel } from "@/models/Base.model";
import { NovelModel } from "@/models/Novel.model";
import { DISPLAY_SETTINGS_KEYS, NOVEL_ITEM_KEYS, PARENT_ITEM_KEYS } from "./keys";

export interface IState {    
    loading: boolean,
    modalIsOpen: boolean,
    novels: NovelModel[],
    activeParentKey: PARENT_ITEM_KEYS,
    currentNovel: NovelModel,
    novelItems: Map<PARENT_ITEM_KEYS, BaseModel[]>,
    displaySettings: Record<PARENT_ITEM_KEYS, Record<DISPLAY_SETTINGS_KEYS, boolean>>,
    selection: Map<NOVEL_ITEM_KEYS,Array<number>>,
    filteredTags: Map<NOVEL_ITEM_KEYS,Array<number>>,
}