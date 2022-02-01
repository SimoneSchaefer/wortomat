import Vuex from 'vuex';
import { NovelModel } from '../models/Novel.model';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';
import { IState } from './istate';
import { DisplaySettingsService } from '@/service/DisplaySettingsService';

export default new Vuex.Store<IState>({
  state: {
    loading: false,
    modalIsOpen: false,
    novels: [],
    currentNovel: new NovelModel(),
    selection: new Map(),
    novelItems: new Map(),
    filteredTags: new Map(),
    displaySettings: new DisplaySettingsService().currentSettings
  },
  getters,
  mutations,
  actions
});