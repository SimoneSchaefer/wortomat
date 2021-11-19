import { BaseModel } from "@/models/Base.model";
import { NovelModel } from "@/models/Novel.model";
import { TagModel } from "@/models/Tag.model";
import { NovelService } from "@/service/NovelService";
import { NOVEL_ITEM_KEYS, VIEWS } from "./keys";
import { createItemInBackend, updateItemInBackend, deleteItemsInBackend, loadItemsFromBackend, updatePositionsInBackend, KEY_TO_CHILD, moveChildInBackend } from "./store-api-adapter";
import { ActionContext } from 'vuex';
import { IState } from "./istate";
import { TimelineEventModel } from "@/models/TimelineEvent";
import { TimelineService } from "@/service/TimelineService";
import { SelectionService } from "@/service/Selection.service";


const setLoading = (context: ActionContext<IState,IState>, loading: boolean) => {
  context.commit('setLoading', { loading: loading });
}

const setModalOpen = (context: ActionContext<IState,IState>, payload: { isOpen: boolean}): void => {
  context.commit('setModalOpen', payload)        
}

const openNovel = (context: ActionContext<IState,IState>, novelId: number): void => {
  context.commit('novelOpened', { id: novelId });
 }

const addNovel = (context: ActionContext<IState,IState>, novel: NovelModel): void => {
  new NovelService().create(novel).then(result => {
    context.commit('novelAdded', result.data);
  });
}

const updateNovel = (context: ActionContext<IState,IState>, novel: NovelModel): void => {
  new NovelService().update(novel).then(result => {
    context.commit('novelUpdated', result.data);
  });
}
  
const deleteNovel = (context: ActionContext<IState,IState>, novel: NovelModel): void => {
  new NovelService().delete(novel).then(() => {
    context.commit('novelDeleted', novel);
  });
}

const loadNovels = (context: ActionContext<IState,IState>): void => {
  setLoading(context, true);
  new NovelService().getAll().then(result => {
    context.commit('novelsLoaded', result.data)
    setLoading(context, false);
  });  
}


const setView = (context: ActionContext<IState,IState>, payload: { key: NOVEL_ITEM_KEYS, view: VIEWS, value: boolean}): void => {
  context.commit('setView', { 
    key: payload.key, 
    view: payload.view, 
    value: payload.value 
  });
};

const loadItems = (context: ActionContext<IState,IState>, payload: { key: NOVEL_ITEM_KEYS, novelId: number }): void => {
  const { key, novelId } = payload;
  setLoading(context, true);

  Promise.all([
    loadItemsFromBackend( key, novelId),
    // loadTagsFromBackend( payload.key, payload.novelId) // TODO
  ]).then(result => {
    const loadedItems = result[0].data;
    context.commit('itemsLoaded', { key: key, items: loadedItems });
    //context.commit('tagsLoaded', result[1].data);
    selectFirstItemIfNecessary(context, key, loadedItems) ;
    setLoading(context, false);
  });
}

const selectItems = (context: ActionContext<IState,IState>, payload: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}): void => {
    context.commit('itemsSelected', payload)        
}

const addItem = (context: ActionContext<IState,IState>, payload: { key: NOVEL_ITEM_KEYS, novelId: number, item: BaseModel }): void => {
  const { key, novelId, item } = payload;  
  createItemInBackend(key, novelId, item, item.parentId).then(result => {
    result.data.parentId = item.parentId;
    context.commit('itemAdded', { key: key, item: result.data });
    if (!KEY_TO_CHILD.has(key)) selectItems(context, { key: key, items: [result.data] });
  });  
}

const updateItem = (context: ActionContext<IState,IState>, update: { key: NOVEL_ITEM_KEYS, novelId: number, oldItem: BaseModel, overrideValues}): void => {
  const {key, novelId, oldItem, overrideValues } = update;
  updateItemInBackend(key, novelId, oldItem, overrideValues ).then(result => {
      result.data.parentId = oldItem.parentId;
      context.commit('itemUpdated', { key: key, item: result.data })
  });      
}
  
const deleteItems = async (context: ActionContext<IState,IState>, update: { key: NOVEL_ITEM_KEYS, novelId: number, items: BaseModel[] }): Promise<void> => {
    const { key, novelId, items } = update;
    const deleted = await deleteItemsInBackend(key, novelId, items);
    context.commit('itemsDeleted', { key: key, items: deleted })
}

const moveChild = async (context: ActionContext<IState,IState>, update: { 
  key: NOVEL_ITEM_KEYS, 
  novelId: number, 
  childToMove: number,
  newParentId: number,
  newPosition: number
  }): Promise<void> => {
    const newOrder = await moveChildInBackend(update.key, update.novelId, update.childToMove, update.newParentId, update.newPosition);
    context.commit('itemsLoaded', { key: update.key, items: newOrder.data });
}

const updateOrder = async (context: ActionContext<IState,IState>, update: { key: NOVEL_ITEM_KEYS, novelId: number, newOrder: BaseModel[] }): Promise<void> => {
  const newOrder = await updatePositionsInBackend(update.key, update.novelId, update.newOrder);
  context.commit('itemsLoaded', { key: update.key, items: newOrder.data })
}

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

/*
const addResearchReference = (context: ActionContext<IState,IState>, payload: { novelId: number, event: TimelineEventModel, research: ResearchModel }): void => {
  new TimelineService().addResearchReference(payload.novelId, payload.event, payload.research).then(result => {
    context.commit('itemUpdated', { key: NOVEL_ITEM_KEYS.TIMELINE, item: result.data });
  });   
}*/

const filterTags = (context: ActionContext<IState,IState>, update: { key: NOVEL_ITEM_KEYS, tags: TagModel[]}): void => {
  context.commit('tagsFiltered', { key: update.key, tags: update.tags });
}

const selectFirstItemIfNecessary = (context: ActionContext<IState,IState>, key: NOVEL_ITEM_KEYS, loadedItems: BaseModel[]) => {
  const itemToSelect = new SelectionService().getFirstItemToSelect(context.state, key, loadedItems);
  if (itemToSelect) {
    context.commit('itemsSelected', { key: KEY_TO_CHILD.has(key) ? KEY_TO_CHILD.get(key) : key, items: [itemToSelect] });
  }  
}


export default {
    openNovel,
    addNovel,
    updateNovel,
    deleteNovel,
    loadNovels,
    selectItems,
    addItem,
    updateItem,
    deleteItems,
    updateOrder,
    moveChild,
    loadItems,
    filterTags,
    setView,
    addReference,
    deleteReference,
    setModalOpen
}

