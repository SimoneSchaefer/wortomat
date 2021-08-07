import Vuex from 'vuex';
import { BaseModel } from '../models/Base.model';
import { NovelModel } from '../models/Novel.model';
import { NovelService } from '../service/NovelService';
import { createItem, deleteItems, NOVEL_ITEM_KEYS, updateItem } from './store.helper';
import getters from './getters';
import mutations from './mutations';
export interface IState {
  novels: NovelModel[],
  currentNovel: NovelModel,
  selection: Map<NOVEL_ITEM_KEYS,Array<number>>
}

export default new Vuex.Store<IState>({
  state: {
    novels: [],
    currentNovel: new NovelModel(),
    selection: new Map()
  },
  getters,
  mutations,

  actions: {
    openNovel(context, novelId: number) {
      new NovelService().get(novelId).then(result => {
        const sortedChapters = result.data[NOVEL_ITEM_KEYS.CHAPTERS].sort((a, b) => (a.order > b.order) ? 1 : -1 );
        result.data[NOVEL_ITEM_KEYS.CHAPTERS] = sortedChapters
        context.commit('novelOpened', result.data);
        if (result.data[NOVEL_ITEM_KEYS.CHAPTERS].length) {
          context.commit('itemsSelected', { key: NOVEL_ITEM_KEYS.CHAPTERS, items: [result.data[NOVEL_ITEM_KEYS.CHAPTERS][0]] });
        }
      });
    },
    addNovel(context, novel: NovelModel) {
      new NovelService().create(novel).then(result => {
        context.commit('novelAdded', result.data);
      });
    },
    updateNovel(context, novel: NovelModel) {
      new NovelService().update(novel).then(result => {
        context.commit('novelUpdated', result.data);
      });
    },
    deleteNovel(context, novel: NovelModel) {
      new NovelService().delete(novel).then(_result => {
        context.commit('novelDeleted', novel);
      });
    },
    loadNovels(context) {
      new NovelService().getAll().then(result => {
        context.commit('novelsLoaded', result.data)
      });  
    },
    selectItems(context, item: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}) {
      context.commit('itemsSelected', item)        
    },
    addItem(context, update: { key: NOVEL_ITEM_KEYS, novelId: number, item: BaseModel}) {
      const {key, novelId, item } = update;
      createItem(key, novelId, item).then(result => {
          context.commit('itemAdded', { key: key, item: result.data });
          context.commit('itemsSelected', { key: NOVEL_ITEM_KEYS.CHAPTERS, items: [result.data] });
      });      
    },
    updateItem(context, update: { key: NOVEL_ITEM_KEYS, oldItem: BaseModel, overrideValues: Record<string, unknown>}) {
      const {key, oldItem, overrideValues } = update;
      updateItem(key, oldItem, overrideValues ).then(result => {
          context.commit('itemUpdated', { key: key, item: result.data })
      });      
    },
    async deleteItems(context, update: { key: NOVEL_ITEM_KEYS, items: BaseModel[] }) {
      const {key, items } = update;
      const deleted = await deleteItems(key, items);
      context.commit('itemsDeleted', { key: key, items: deleted })
    },
    async updateOrder(context, update: { key: NOVEL_ITEM_KEYS, newOrder: BaseModel[] }) {
      const results = []
      let counter = 0;
      for (const item of update.newOrder) {
        const newItem = await updateItem(NOVEL_ITEM_KEYS.CHAPTERS, item as BaseModel, { order: counter} );
        results.push(newItem.data);
        counter++;
      }
      context.commit('itemsLoaded', { key: update.key, items: results })

    }
  }
});