import Vuex from 'vuex';
import { NovelModel } from '../models/Novel.model';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';
import { IState } from './istate';
import { PARENT_ITEM_KEYS } from './keys';

export default new Vuex.Store<IState>({
  state: {
    loading: false,
    modalIsOpen: false,
    novels: [],
    currentNovel: new NovelModel(),
    activeParentKey: PARENT_ITEM_KEYS.PARTS,
    novelItems: new Map(),
    selection: new Map(),
    filteredTags: new Map(),
    displaySettings: Object()
  },
  getters,
  mutations,
  actions
});