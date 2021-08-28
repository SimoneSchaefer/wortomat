import Vuex from 'vuex';
import { NovelModel } from '../models/Novel.model';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';
import { IState } from './istate';
import { VIEWS } from './keys';

export default new Vuex.Store<IState>({
  state: {
    novels: [],
    currentNovel: new NovelModel(),
    selection: new Map(),
    novelItems: {},
    filteredTags: new Map(),
    view: new Map([[
      VIEWS.SUMMARY, true
    ],[
      VIEWS.EXTENDED_SUMMARY, true
    ],[
      VIEWS.CONTENT, true
    ]])
  },
  getters,
  mutations,
  actions
});