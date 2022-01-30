import { NovelModel } from "@/models/Novel.model";
import { DisplaySettingsKeys } from "@/service/DisplaySettingsService";
import { NOVEL_ITEM_KEYS, VIEWS } from "./keys";
export interface IState {
    loading: boolean,
    modalIsOpen: boolean,
    novels: NovelModel[],
    currentNovel: NovelModel,
    novelItems,
    displaySettings: Record<NOVEL_ITEM_KEYS, Record<DisplaySettingsKeys, boolean>>,
    selection: Map<NOVEL_ITEM_KEYS,Array<number>>,
    filteredTags: Map<NOVEL_ITEM_KEYS,Array<number>>,
    view: Map<NOVEL_ITEM_KEYS, Map<VIEWS,boolean>>
}