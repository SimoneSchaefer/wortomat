import { NovelModel } from "@/models/Novel.model";
import { NOVEL_ITEM_KEYS, VIEWS } from "./keys";
export interface IState {
    novels: NovelModel[],
    currentNovel: NovelModel,
    novelItems,
    selection: Map<NOVEL_ITEM_KEYS,Array<number>>,
    filteredTags: Map<NOVEL_ITEM_KEYS,Array<number>>,
    view: Map<VIEWS,boolean>
}