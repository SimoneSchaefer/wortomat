import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store/store'

import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import Splitter from 'primevue/splitter';
import Splitterpanel from 'primevue/splitterpanel';
import Card from 'primevue/card';
import Galleria from 'primevue/galleria';
import Dialog from 'primevue/dialog';
import ConfirmDialog from 'primevue/confirmdialog';
import ConfirmationService from 'primevue/confirmationservice';
import OrderList from 'primevue/orderlist';
import Message from 'primevue/message';
import ScrollPanel from 'primevue/scrollpanel';
import TabMenu from 'primevue/tabmenu';

import '@fortawesome/fontawesome-free/css/all.min.css';

import 'primevue/resources/themes/saga-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

const app = createApp(App)
    .use(router)
    .use(PrimeVue)
    .use(store)
    .use(ConfirmationService)
    .component('Button', Button)
    .component('Splitterpanel', Splitterpanel)
    .component('Splitter', Splitter)
    .component('Card', Card)
    .component('OrderList', OrderList)
    .component('Galleria', Galleria)
    .component('Dialog', Dialog)
    .component('ConfirmDialog', ConfirmDialog)
    .component('Message', Message)
    .component('ScrollPanel', ScrollPanel)
    .component('TabMenu', TabMenu)

app.mount("#app");



