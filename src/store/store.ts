import Vuex from 'vuex';
import Novel from '../models/Novel.model';
import { NovelService } from '../service/NovelService';

export default new Vuex.Store({
  state: {
    novels: Array<Novel>()
  },

  mutations: {
    addNovel(state, novel: Novel) {
      state.novels.push(novel);
    },
    deleteNovel(state, novel: Novel) {
      const index = state.novels.findIndex(n => novel.id === n.id);
      if (index > -1) {
        state.novels.splice(index, 1);
      }
    },
    setNovels(state, novels: Novel[]) {
      state.novels = novels;
    }
  },

  actions: {
    addNovel(context, novel: Novel) {
      new NovelService().create(novel).then(result => {
        context.commit('addNovel', result.data);
      });
    },

    deleteNovel(context, novel: Novel) {
      new NovelService().delete(novel).then(_result => {
        context.commit('deleteNovel', novel);
      });
    },

    loadNovels(context) {
      new NovelService().loadNovels().then(result => {
        context.commit('setNovels', result.data)
      });  
    }
  }
});