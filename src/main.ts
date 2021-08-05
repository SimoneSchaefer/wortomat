import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Vue from 'vue'
import Vuex from 'vuex'

import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Galleria from 'primevue/galleria';
import ConfirmDialog from 'primevue/confirmdialog';
import ConfirmationService from 'primevue/confirmationservice';

import 'primevue/resources/themes/saga-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import store from './store/store'

// Vue.use(Vuex)

createApp(App)
    .use(router)
    .use(PrimeVue)
    .use(store)
    .use(ConfirmationService)
    .component('Button', Button)
    .component('Card', Card)
    .component('Galleria', Galleria)
    .component('ConfirmDialog', ConfirmDialog)
    .mount('#app')
