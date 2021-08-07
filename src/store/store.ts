import Vuex from 'vuex';
import { BaseModel } from '../models/Base.model';
import { NovelModel } from '../models/Novel.model';
import { NovelService } from '../service/NovelService';
import { createItem, deleteItems, getCurrentSelection, itemIdsToSelect, NOVEL_ITEM_KEYS, updateItem } from './store.helper';

export interface IState {
  novels: NovelModel[],
  currentNovel: NovelModel,
  selection: Map<NOVEL_ITEM_KEYS,Array<number>>
}

export default new Vuex.Store<IState>({
  state: {
    novels: [],
    currentNovel: null,
    selection: new Map()
  },

  getters: {
    openNovelId(state: IState) {
      return state.currentNovel?.id
    },
    currentChapters(state: IState) {
      return getCurrentSelection(state, NOVEL_ITEM_KEYS.CHAPTERS);      
    }
  },

  mutations: {
    addNovel(state, novel: NovelModel) {
      state.novels.push(novel);
    },
    updateNovel(state, novel: NovelModel) {
      const index = state.novels.findIndex(n => novel.id === n.id);
      if (index > -1) {
        state.novels.splice(index, 1, novel);
      }
    },
    deleteNovel(state, novel: NovelModel) {
      const index = state.novels.findIndex(n => novel.id === n.id);
      if (index > -1) {
        state.novels.splice(index, 1);
      }
    },
    setNovels(state, novels: NovelModel[]) {
      state.novels = novels;
    },
    openNovel(state, novel: NovelModel) {
      state.currentNovel = novel;
    },
    selectItems(state: IState, selection: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}) {
      const {key, items } = selection;
      state.selection.set(key, itemIdsToSelect(key, items))
    },
    addItem(state, update: { key: NOVEL_ITEM_KEYS, item: BaseModel}) {
      (state.currentNovel[update.key] as BaseModel[]).push(update.item);
    }, 
    updateItem(state, update: { key: NOVEL_ITEM_KEYS, item: BaseModel}) {
      const index = (state.currentNovel[update.key] as BaseModel[]).findIndex(i => i.id === update.item.id);
      if (index > -1) {
        (state.currentNovel[update.key] as BaseModel[]).splice(index, 1, update.item);
      }
    },
    setItems(state, update: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}) {
      (state.currentNovel[update.key] as BaseModel[]) = update.items;
    },
    deleteItems(state, update: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}) {
      const itemIds = update.items.map(item => item.id);
      const currentItems = (state.currentNovel[update.key] as BaseModel[]);
      (state.currentNovel[update.key] as BaseModel[]) = currentItems.filter(i => !itemIds.includes(i.id));
    }
  },

  actions: {
    openNovel(context, novelId: number) {
      new NovelService().get(novelId).then(result => {
        const sortedChapters = result.data[NOVEL_ITEM_KEYS.CHAPTERS].sort((a, b) => (a.order > b.order) ? 1 : -1 );
        result.data[NOVEL_ITEM_KEYS.CHAPTERS] = sortedChapters
        context.commit('openNovel', result.data);
        if (result.data[NOVEL_ITEM_KEYS.CHAPTERS].length) {
          context.commit('selectItems', { key: NOVEL_ITEM_KEYS.CHAPTERS, items: [result.data[NOVEL_ITEM_KEYS.CHAPTERS][0]] });
        }
      });
    },
    addNovel(context, novel: NovelModel) {
      new NovelService().create(novel).then(result => {
        context.commit('addNovel', result.data);
      });
    },
    updateNovel(context, novel: NovelModel) {
      new NovelService().update(novel).then(result => {
        context.commit('updateNovel', result.data);
      });
    },
    deleteNovel(context, novel: NovelModel) {
      new NovelService().delete(novel).then(_result => {
        context.commit('deleteNovel', novel);
      });
    },
    loadNovels(context) {
      new NovelService().getAll().then(result => {
        context.commit('setNovels', result.data)
      });  
    },
    selectItems(context, item: { key: NOVEL_ITEM_KEYS, items: BaseModel[]}) {
      context.commit('selectItems', item)        
    },
    addItem(context, update: { key: NOVEL_ITEM_KEYS, novelId: number, item: BaseModel}) {
      const {key, novelId, item } = update;
      createItem(key, novelId, item).then(result => {
          context.commit('addItem', { key: key, item: result.data });
          context.commit('selectItems', { key: NOVEL_ITEM_KEYS.CHAPTERS, items: [result.data] });
      });      
    },
    updateItem(context, update: { key: NOVEL_ITEM_KEYS, oldItem: BaseModel, overrideValues: Record<string, unknown>}) {
      const {key, oldItem, overrideValues } = update;
      updateItem(key, oldItem, overrideValues ).then(result => {
          context.commit('updateItem', { key: key, item: result.data })
      });      
    },
    async deleteItems(context, update: { key: NOVEL_ITEM_KEYS, items: BaseModel[] }) {
      const {key, items } = update;
      const deleted = await deleteItems(key, items);
      context.commit('deleteItems', { key: key, items: deleted })
    },
    async updateOrder(context, update: { key: NOVEL_ITEM_KEYS, newOrder: BaseModel[] }) {
      const results = []
      let counter = 0;
      for (const item of update.newOrder) {
        const newItem = await updateItem(NOVEL_ITEM_KEYS.CHAPTERS, item as BaseModel, { order: counter} );
        results.push(newItem.data);
        counter++;
      }
      context.commit('setItems', { key: update.key, items: results })

    }
  }
});