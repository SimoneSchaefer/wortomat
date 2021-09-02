import { BaseModel } from "@/models/Base.model";
import { NovelModel } from "@/models/Novel.model";
import { TagModel } from "@/models/Tag.model";
import { NovelService } from "@/service/NovelService";
import { NOVEL_ITEM_KEYS, VIEWS } from "./keys";
import { createItemInBackend, updateItemInBackend, deleteItemsInBackend, loadItemsFromBackend, updatePositionsInBackend } from "./store-api-adapter";
import { ActionContext } from 'vuex';
import { IState } from "./istate";

const openNovel = (context: ActionContext<IState,IState>, novelId: number): void => {
    new NovelService().get(novelId).then(result => {
      context.commit('novelOpened', result.data);
    });
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
    new NovelService().getAll().then(result => {
      context.commit('novelsLoaded', result.data)
    });  
}

const setView = (context: ActionContext<IState,IState>, payload: { key: NOVEL_ITEM_KEYS, view: VIEWS, value: boolean}): void => {
  context.commit('setView', { key: payload.key, view: payload.view, value: payload.value });
};


const loadItems = (context: ActionContext<IState,IState>, payload: { key: NOVEL_ITEM_KEYS, novelId: number }): void => {
  loadItemsFromBackend( payload.key, payload.novelId).then(result => {
    context.commit('itemsLoaded', { key: payload.key, items: result.data });
  }) 
}

const selectItems = (context: ActionContext<IState,IState>, item: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}): void => {
    context.commit('itemsSelected', item)        
}

const addItem = (context: ActionContext<IState,IState>, payload: { key: NOVEL_ITEM_KEYS, novelId: number, item: BaseModel }): void => {
    const {key, novelId, item } = payload;
    if (item.id) {
      context.commit('itemAdded', { key: key, item: item });
    } else {
      createItemInBackend(key, novelId, item).then(result => {
        context.commit('itemAdded', { key: key, item: result.data });
        context.commit('itemsSelected', { key: key, items: [result.data] });       
      });  
    }       
  }

const updateItem = (context: ActionContext<IState,IState>, update: { key: NOVEL_ITEM_KEYS, novelId: number, oldItem: BaseModel, overrideValues}): void => {
    const {key, novelId, oldItem, overrideValues } = update;
    updateItemInBackend(key, novelId, oldItem, overrideValues ).then(result => {
        context.commit('itemUpdated', { key: key, item: result.data })
    });      
}
  
const deleteItems = async (context: ActionContext<IState,IState>, update: { key: NOVEL_ITEM_KEYS, novelId: number, items: BaseModel[] }): Promise<void> => {
    const {key, novelId, items } = update;
    const deleted = await deleteItemsInBackend(key, novelId, items);
    context.commit('itemsDeleted', { key: key, items: deleted })
}

const updateOrder = async (context: ActionContext<IState,IState>, update: { key: NOVEL_ITEM_KEYS, novelId: number, newOrder: BaseModel[] }): Promise<void> => {
  const newOrder = await updatePositionsInBackend(update.key, update.novelId, update.newOrder);
  context.commit('itemsLoaded', { key: update.key, items: newOrder.data })
}

const filterTags = (context: ActionContext<IState,IState>, update: { key: NOVEL_ITEM_KEYS, tags: TagModel[]}): void => {
  context.commit('tagsFiltered', { key: update.key, tags: update.tags });
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
    loadItems,
    filterTags,
    setView
}