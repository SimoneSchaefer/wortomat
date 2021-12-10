import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store/store'


// primevue 
import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import Card from 'primevue/card';
import Galleria from 'primevue/galleria';
import Dialog from 'primevue/dialog';
import ConfirmDialog from 'primevue/confirmdialog';
import ToastService from 'primevue/toastservice';
import Toast from 'primevue/toast';
import ConfirmationService from 'primevue/confirmationservice';
import OrderList from 'primevue/orderlist';
import Message from 'primevue/message';
import ScrollPanel from 'primevue/scrollpanel';
import TabMenu from 'primevue/tabmenu';
import Badge from 'primevue/badge';
import SpeedDial from 'primevue/speeddial';
import AutoComplete from 'primevue/autocomplete';
import Chip from 'primevue/chip';
import Divider from 'primevue/divider';
import Menu from 'primevue/menu';
import MenuBar from 'primevue/menubar';
import OverlayPanel from 'primevue/overlaypanel';
import SelectButton from 'primevue/selectbutton';
import Checkbox from 'primevue/checkbox';
import Fieldset from 'primevue/fieldset';
import FileUpload from 'primevue/fileupload';
import ProgressSpinner from 'primevue/progressspinner';
import Timeline from 'primevue/timeline';
import Dropdown from 'primevue/dropdown';
import Sidebar from 'primevue/sidebar';


// import draggable from 'vue-draggable-next'
import { VueDraggableNext } from 'vue-draggable-next'
import { createI18n } from 'vue-i18n'

import '@fortawesome/fontawesome-free/css/all.min.css';

import 'primevue/resources/themes/saga-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';

import { messages, defaultLocale} from '@/i18n'

const i18n = createI18n({
    locale: defaultLocale, // set locale
    fallbackLocale: 'en',
    messages // set locale messages
})

const app = createApp(App)
    .use(router)
    .use(PrimeVue)
    .use(store)
    .use(i18n)
    .use(ConfirmationService)
    .use(ToastService)
    .component('Button', Button)
    .component('SplitterPanel', SplitterPanel)
    .component('Splitter', Splitter)
    .component('Card', Card)
    .component('OrderList', OrderList)
    .component('Galleria', Galleria)
    .component('Dialog', Dialog)
    .component('ConfirmDialog', ConfirmDialog)
    .component('Toast', Toast)
    .component('Message', Message)
    .component('ScrollPanel', ScrollPanel)
    .component('TabMenu', TabMenu)
    .component('Menu', Menu)
    .component('MenuBar', MenuBar)
    .component('SelectButton', SelectButton)
    .component('Badge', Badge)
    .component('SpeedDial', SpeedDial)
    .component('AutoComplete', AutoComplete)
    .component('Chip', Chip)
    .component('FileUpload', FileUpload)
    .component('OverlayPanel', OverlayPanel)
    .component('Checkbox', Checkbox)
    .component('Divider', Divider)
    .component('ProgressSpinner', ProgressSpinner)
    .component('Fieldset', Fieldset)
    .component('Timeline', Timeline)
    .component('Dropdown', Dropdown)
    .component('Sidebar', Sidebar)
    .component('draggable', VueDraggableNext)

 app.mount("#app");




