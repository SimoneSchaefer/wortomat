import { BaseModel } from "@/models/Base.model";
import { NovelModel } from "@/models/Novel.model";
import { NovelService } from "@/service/NovelService";
import { NOVEL_ITEM_KEYS } from "./keys";
import { createItemInBackend, updateItemInBackend, deleteItemsInBackend, loadItemsFromBackend } from "./store-api-adapter";

const openNovel = (context, novelId: number) => {
    new NovelService().get(novelId).then(result => {
      //const sortedChapters = result.data[NOVEL_ITEM_KEYS.CHAPTERS].sort((a, b) => (a.order > b.order) ? 1 : -1 ); //TODO handle by API
      //result.data[NOVEL_ITEM_KEYS.CHAPTERS] = sortedChapters
      context.commit('novelOpened', result.data);
      /*if (result.data[NOVEL_ITEM_KEYS.CHAPTERS].length) {
        // TODO central selection handler to handle 'nothing-selected' case 
        // - after opening a novel 
        // - switching between tabs (keep selection?)
        // - when selected element has been deleted
        context.commit('itemsSelected', { key: NOVEL_ITEM_KEYS.CHAPTERS, items: [result.data[NOVEL_ITEM_KEYS.CHAPTERS][0]] });
      }*/
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


const loadItems = (context, payload: { key: NOVEL_ITEM_KEYS, novelId: number }) => {
  loadItemsFromBackend( payload.key, payload.novelId).then(result => {
    context.commit('itemsLoaded', { key: payload.key, items: result.data });
  }) 
}

const selectItems = (context, item: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}) => {
    context.commit('itemsSelected', item)        
}

const addItem = (context, payload: { key: NOVEL_ITEM_KEYS, novelId: number, item: BaseModel, reference?: { key: NOVEL_ITEM_KEYS, item: BaseModel}}) => {
    const {key, novelId, item, reference } = payload;
    createItemInBackend(key, novelId, item).then(result => {
        context.commit('itemAdded', { key: key, item: result.data });
        context.commit('itemsSelected', { key: key, items: [result.data] });
        if (reference) {
          console.log('updating', reference)
          const aha = [...reference.item[key]];
          aha.push(result.data);
          const override = {
            [key]: aha
          }
          updateItem(context, { key: reference.key, oldItem: reference.item, overrideValues: override});         
        }
    });      
  }

const updateItem = (context, update: { key: NOVEL_ITEM_KEYS, oldItem: BaseModel, overrideValues}) => {
    const {key, oldItem, overrideValues } = update;
    updateItemInBackend(key, oldItem, overrideValues ).then(result => {
        context.commit('itemUpdated', { key: key, item: result.data })
    });      
}
  
const deleteItems = async (context, update: { key: NOVEL_ITEM_KEYS, items: BaseModel[] }) => {
    const {key, items } = update;
    const deleted = await deleteItemsInBackend(key, items);
    context.commit('itemsDeleted', { key: key, items: deleted })
  }

const updateOrder = async (context, update: { key: NOVEL_ITEM_KEYS, newOrder: BaseModel[] }) => {
    const results = []
    let counter = 0;
    for (const item of update.newOrder) {
      const newItem = await updateItemInBackend(NOVEL_ITEM_KEYS.CHAPTERS, item as BaseModel, { order: counter} );
      results.push(newItem.data);
      counter++;
    }
    context.commit('itemsLoaded', { key: update.key, items: results })
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
    loadItems
}