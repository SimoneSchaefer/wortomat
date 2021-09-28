import Vuex from 'vuex';
import { NovelModel } from '../models/Novel.model';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';
import { IState } from './istate';
import { NOVEL_ITEM_KEYS, VIEWS } from './keys';

export default new Vuex.Store<IState>({
  state: {
    loading: false,
    novels: [],
    currentNovel: new NovelModel(),
    selection: new Map(),
    novelItems: {},
    filteredTags: new Map(),
    view: new Map([[
      NOVEL_ITEM_KEYS.CHAPTERS, new Map<VIEWS,boolean>([[
        VIEWS.SUMMARY, true
      ], [
        VIEWS.EXTENDED_SUMMARY, true
      ],[
        VIEWS.TAGS, true
      ],[
        VIEWS.CONTENT, true
      ]
    ])
    ],[
      NOVEL_ITEM_KEYS.CHARACTERS, new Map<VIEWS,boolean>([[
        VIEWS.SUMMARY, true
      ], [
        VIEWS.EXTENDED_SUMMARY, true
      ],[
        VIEWS.TAGS, true
      ],[
        VIEWS.CONTENT, true
      ]
    ])
    ],[
      NOVEL_ITEM_KEYS.RESEARCH, new Map<VIEWS,boolean>([[
        VIEWS.SUMMARY, true
      ], [
        VIEWS.EXTENDED_SUMMARY, true
      ],[
        VIEWS.TAGS, true
      ],[
        VIEWS.CONTENT, true
      ]
    ])
    ]])
  },
  getters,
  mutations,
  actions
});