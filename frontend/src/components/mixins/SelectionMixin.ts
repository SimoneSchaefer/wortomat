import { BaseModel } from "@/models/Base.model";
import { NovelItemService } from "@/service/NovelItemService";
import { NOVEL_ITEM_KEYS } from "@/store/keys";
import { Vue } from "vue-class-component";

export default abstract class SelectionMixin extends Vue {
    abstract novelItemKey: NOVEL_ITEM_KEYS;

    private lastChecked: BaseModel = null; // needed for CTRL handling

    selectItem(selected: BaseModel, $event: Event): void  {
        let selectedItems = [];
        if ($event['shiftKey']) {
            selectedItems = this.handleShift(selected);
        } else if ($event['ctrlKey']) {
            selectedItems = this.handleCtrl(selected);
        } else {
            selectedItems = [selected];
        }
        if (selectedItems.find(selectedItem => selectedItem.id === selected.id)) {
            this.lastChecked = selected;
        }     
        this.$store.dispatch('selectItems', { key: this.novelItemKey, items: selectedItems });
    }

    handleCtrl(selected: BaseModel): BaseModel[]  {
        const selectedItems = []; // this.selectedItems;
        const index = selectedItems.findIndex(selectedItem => selectedItem.id === selected.id);
        if (index >= 0) {
            selectedItems.splice(index, 1);
        } else {
           selectedItems.push(selected);
        }
        return selectedItems;
    }

    handleShift(selected: BaseModel): BaseModel[] {
        if (!this.lastChecked) {
            return [selected];
        }
        let selectedItems = [] // this.filteredItems;
        const start = selectedItems.findIndex(selectedItem => selectedItem.id === selected.id);
        const end = selectedItems.findIndex(selectedItem => selectedItem.id === this.lastChecked.id);
        selectedItems = this.$store.getters.filteredChapters.slice(Math.min(start,end), Math.max(start,end)+ 1);
        return selectedItems;
    }
 
}
  