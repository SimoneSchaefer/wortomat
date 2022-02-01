import { PARENT_ITEM_KEYS, PARENT_TO_CHILD } from "@/store/keys"
import { Vue } from "vue-class-component";

export default abstract class NovelItemKeyAwareMixin extends Vue {
    get novelId(): number {
        return this.$store.getters.openNovelId;
    }  
    get parentKey(): PARENT_ITEM_KEYS {
        return this.$store.state.activeParentKey;
    }
    get childKey() {
        return PARENT_TO_CHILD.get(this.parentKey);
    }  
  }
  