
import { createStore } from "vuex";
import DisplaySettingsModule from '@/store/DisplaySettingsModule';

import NovelDataModule from '@/store/NovelDataModule';
import ApplicationStateModule from '@/store/ApplicationStateModule';
import SelectionModule from '@/store/SelectionModule';
import TreeStateModule from '@/store/TreeStateModule';
import VuexLocalStorage, { setupLocalStorage } from '@/store/plugins/web-storage';

const store = createStore({
    plugins: [ VuexLocalStorage ]
});

new DisplaySettingsModule({ store: store, name: 'displaySettings' });
new NovelDataModule({ store: store, name: 'novelData' });
new ApplicationStateModule({ store: store, name: 'applicationState' });
new SelectionModule({ store: store, name: 'selection' });
new TreeStateModule({ store: store, name: 'treeState' });

setupLocalStorage(store);

export default store;


