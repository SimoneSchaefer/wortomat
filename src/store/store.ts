import Vuex from 'vuex';
import { BaseModel } from '../models/Base.model';
import { NovelModel } from '../models/Novel.model';
import { NovelService } from '../service/NovelService';
import { getCurrentSelection, itemIdsToSelect, SELECTION_KEYS, updateItem } from './store.helper';

export default new Vuex.Store({
  state: {
    novels: [],
    currentNovel: null,
    selection: {}
  },

  getters: {
    openNovelId(state) {
      return state.currentNovel?.id
    },
    currentChapters(state) {
      return getCurrentSelection(state, SELECTION_KEYS.CHAPTERS);      
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
    selectItems(state, selection: { key: string, items: BaseModel[]}) {
      const novelId = state.currentNovel?.id;
      if (novelId) {
        const ids = itemIdsToSelect(selection);
        const currentSelections = {...state.selection[novelId]} || {};
        currentSelections[selection.key] = ids;
        console.log('store:::setting selection to ', currentSelections)
        state.selection[novelId] = currentSelections;
      }
    },
    updateItem(state, update: { key: SELECTION_KEYS, item: BaseModel}) {
      const index = state.currentNovel[update.key].findIndex(i => i.id === update.item.id);
      if (index > -1) {
        state.currentNovel[update.key].splice(index, 1, update.item);
      }
    },
    setItems(state, update: { key: SELECTION_KEYS, items: BaseModel[]}) {
      state.currentNovel[update.key] = update.items;
    }
  },

  actions: {
    openNovel(context, novelId: number) {
      new NovelService().get(novelId).then(result => {
        const sortedChapters = result.data[SELECTION_KEYS.CHAPTERS].sort((a, b) => (a.order > b.order) ? 1 : -1 );
        result.data[SELECTION_KEYS.CHAPTERS] = sortedChapters
        context.commit('openNovel', result.data);
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
    selectItems(context, item: { key: SELECTION_KEYS, items: BaseModel[]}) {
      context.commit('selectItems', item)        
    },
    updateItem(context, update: { key: SELECTION_KEYS, oldItem: BaseModel, overrideValues: Record<string, unknown>}) {
      const {key, oldItem, overrideValues } = update;
      updateItem(key, oldItem, overrideValues ).then(result => {
          context.commit('updateItem', { key: key, item: result.data })
      });      
    },
    async updateOrder(context, update: { key: SELECTION_KEYS, newOrder: BaseModel[] }) {
      console.log('updating order in store', update.newOrder)
      const results = []
      let counter = 0;
      for (const item of update.newOrder) {
        const newItem = await updateItem(SELECTION_KEYS.CHAPTERS, item as BaseModel, { order: counter} );
        results.push(newItem.data);
        counter++;
        /*.then(result => {
          context.commit('updateItem', { key: key, item: result.data })
        }*/
      }
      context.commit('setItems', { key: update.key, items: results })

    }
  }
});