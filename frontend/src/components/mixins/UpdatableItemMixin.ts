import { BaseModel } from "@/models/Base.model"
import { NOVEL_ITEM_KEYS } from "@/store/keys"
import { Vue } from "vue-class-component";

export default abstract class UpdateItemMixin extends Vue {
    get novelId(): number {
        return this.$store.getters.openNovelId;
    }   

    updateItem (itemKey: NOVEL_ITEM_KEYS, oldItem: BaseModel, overrideValues ) {
        this.$store.dispatch('updateItem', { 
            key: itemKey, 
            novelId: this.novelId,
            oldItem: oldItem,
            overrideValues: overrideValues
        })  
    }    
  }
  