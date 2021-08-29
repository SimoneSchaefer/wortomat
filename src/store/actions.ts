import { BaseModel } from "@/models/Base.model";
import { NovelModel } from "@/models/Novel.model";
import { TagModel } from "@/models/Tag.model";
import { NovelService } from "@/service/NovelService";
import { NOVEL_ITEM_KEYS, VIEWS } from "./keys";
import { createItemInBackend, updateItemInBackend, deleteItemsInBackend, loadItemsFromBackend, updatePositionsInBackend } from "./store-api-adapter";

const openNovel = (context, novelId: number) => {
    new NovelService().get(novelId).then(result => {
      context.commit('novelOpened', result.data);
    });
 }

const addNovel = (context, novel: NovelModel) => {
    new NovelService().create(novel).then(result => {
      context.commit('novelAdded', result.data);
    });
}
const updateNovel = (context, novel: NovelModel) => {
    new NovelService().update(novel).then(result => {
      context.commit('novelUpdated', result.data);
    });
}
  
const deleteNovel = (context, novel: NovelModel) => {
    new NovelService().delete(novel).then(_result => {
      context.commit('novelDeleted', novel);
    });
}

const loadNovels = (context) => {
    new NovelService().getAll().then(result => {
      context.commit('novelsLoaded', result.data)
    });  
}

const setView = (context, payload: { view: VIEWS, value: boolean}) => {
  context.commit('setView', { view: payload.view, value: payload.value });
};


const loadItems = (context, payload: { key: NOVEL_ITEM_KEYS, novelId: number }) => {
  loadItemsFromBackend( payload.key, payload.novelId).then(result => {
    context.commit('itemsLoaded', { key: payload.key, items: result.data });
  }) 
}

const selectItems = (context, item: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}) => {
    context.commit('itemsSelected', item)        
}

const addItem = (context, payload: { key: NOVEL_ITEM_KEYS, novelId: number, item: BaseModel }) => {
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

const updateItem = (context, update: { key: NOVEL_ITEM_KEYS, novelId: number, oldItem: BaseModel, overrideValues}) => {
    const {key, novelId, oldItem, overrideValues } = update;
    updateItemInBackend(key, novelId, oldItem, overrideValues ).then(result => {
        context.commit('itemUpdated', { key: key, item: result.data })
    });      
}
  
const deleteItems = async (context, update: { key: NOVEL_ITEM_KEYS, novelId: number, items: BaseModel[] }) => {
    const {key, novelId, items } = update;
    const deleted = await deleteItemsInBackend(key, novelId, items);
    context.commit('itemsDeleted', { key: key, items: deleted })
}

const updateOrder = async (context, update: { key: NOVEL_ITEM_KEYS, novelId: number, newOrder: BaseModel[] }) => {
  const newOrder = await updatePositionsInBackend(update.key, update.novelId, update.newOrder);
  context.commit('itemsLoaded', { key: update.key, items: newOrder.data })
}

const filterTags = (context, update: { key: NOVEL_ITEM_KEYS, tags: TagModel[]}) => {
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