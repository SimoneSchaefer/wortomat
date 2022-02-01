import { NovelModel } from "@/models/Novel.model";
import { DisplaySettingsKeys, NOVEL_ITEM_KEYS } from "./keys";

export interface IState {    
    loading: boolean,
    modalIsOpen: boolean,
    novels: NovelModel[],
    currentNovel: NovelModel,
    novelItems,
    displaySettings: Record<NOVEL_ITEM_KEYS, Record<DisplaySettingsKeys, boolean>>,
    selection: Map<NOVEL_ITEM_KEYS,Array<number>>,
    filteredTags: Map<NOVEL_ITEM_KEYS,Array<number>>,
}