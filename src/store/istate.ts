import { BaseModel } from "@/models/Base.model";
import { NovelModel } from "@/models/Novel.model";
import { NOVEL_ITEM_KEYS } from "./keys";
export interface IState {
    novels: NovelModel[],
    currentNovel: NovelModel,
    novelItems,
    selection: Map<NOVEL_ITEM_KEYS,Array<number>>
}