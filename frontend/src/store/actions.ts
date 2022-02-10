import { BaseModel } from "@/models/Base.model";
import { TagModel } from "@/models/Tag.model";
import { NOVEL_ITEM_KEYS } from "./keys";
import { ActionContext } from 'vuex';
import { IState } from "./istate";
import { TimelineEventModel } from "@/models/TimelineEvent";
import { TimelineService } from "@/service/TimelineService";



const addReference = (context: ActionContext<IState,IState>, payload: { novelId: number, event: TimelineEventModel, item: BaseModel, key: NOVEL_ITEM_KEYS }): void => {
  new TimelineService().addReference(payload.novelId, payload.event, payload.item, payload.key).then(result => {
    context.commit('itemUpdated', { key: NOVEL_ITEM_KEYS.TIMELINE, item: result.data });
  });   
}

const deleteReference = (context: ActionContext<IState,IState>, payload: { novelId: number, event: TimelineEventModel, item: BaseModel, key: NOVEL_ITEM_KEYS }): void => {
  new TimelineService().deleteReference(payload.novelId, payload.event, payload.item, payload.key).then(result => {
    context.commit('itemUpdated', { key: NOVEL_ITEM_KEYS.TIMELINE, item: result.data });
  });   
}

const filterTags = (context: ActionContext<IState,IState>, update: { key: NOVEL_ITEM_KEYS, tags: TagModel[]}): void => {
  context.commit('tagsFiltered', { key: update.key, tags: update.tags });
}

export default {
    filterTags,
    addReference,
    deleteReference,
}

