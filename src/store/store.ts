import Vuex from 'vuex';
import { NovelModel } from '../models/Novel.model';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';
import { IState } from './istate';

export default new Vuex.Store<IState>({
  state: {
    novels: [],
    currentNovel: new NovelModel(),
    selection: new Map(),
    novelItems: {}
  },
  getters,
  mutations,
  actions
});