import { childKeyForParentKey, PARENT_ITEM_KEYS } from "@/store/keys"
import { namespace } from "s-vuex-class";
import { Vue } from "vue-class-component";

const novelDataModule = namespace("novelData");
const applicationStateModule = namespace("applicationState");


export default abstract class NovelItemKeyAwareMixin extends Vue {
    @novelDataModule.State('_novelId')
    novelId!: number;   
    
    @applicationStateModule.State('_activeView')
    _activeView!: PARENT_ITEM_KEYS;

    get parentKey(): PARENT_ITEM_KEYS {
        return this._activeView;
    }
    get childKey() {
        return childKeyForParentKey(this.parentKey);
    }  
  }
  