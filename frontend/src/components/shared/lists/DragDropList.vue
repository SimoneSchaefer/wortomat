<template>
  <draggable 
    v-model="filteredItems" 
    group="items" 
    @start="drag=true" 
    @end="drag=false" 
    item-key="id">
    <template #item="{element}">
        <div class="item p-jc-between" v-on:click="selectItem(element, $event)" v-bind:class="{ active: isSelected(element)}">
            <slot v-bind:item="element"></slot>
        </div>
    </template>
  </draggable>
</template>

<script lang="ts">
import { BaseModel } from '@/models/Base.model';
import { Options, Vue } from 'vue-class-component';
import draggable from 'vuedraggable'
import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { Prop } from 'vue-property-decorator';

@Options({
  components: { draggable }
})
export default class DragDropList extends Vue {
    @Prop() novelItemKey: NOVEL_ITEM_KEYS;

    @Prop() /* TODO can't set the models themselves as properties as for some reason, the selected items are not refreshed correctly :(*/ 
    private selectedItemsKey: string;
    
    @Prop()
    private filteredItemsKey: string;

    private lastChecked: BaseModel = null; 


    get filteredItems(): BaseModel[] {
        return this.$store.getters[this.filteredItemsKey];
    }

    set filteredItems(value: BaseModel[]) {
        this.$store.dispatch('updateOrder', { key: this.novelItemKey, novelId: this.$store.getters.openNovelId, newOrder: value});
    }  
    
    get selectedItems(): BaseModel[] {
        return this.$store.getters[this.selectedItemsKey] || []
    }
   
    get items(): BaseModel[] {
        return this.filteredItems;
    }


    isSelected(item: BaseModel): boolean {
        return !!this.$store.getters[this.selectedItemsKey].find(chapter => chapter.id === item.id);
    }

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
        let selectedItems = this.selectedItems;
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
        let selectedItems = this.filteredItems;
        const start = selectedItems.findIndex(selectedItem => selectedItem.id === selected.id);
        const end = selectedItems.findIndex(selectedItem => selectedItem.id === this.lastChecked.id);
        selectedItems = this.$store.getters.filteredChapters.slice(Math.min(start,end), Math.max(start,end)+ 1);
        return selectedItems;
    }
}
</script>

<style scoped>
.item {
  display: flex;
  font-size: smaller;
  padding: 0.5em;
}

.item.active {
  cursor: pointer;
  background-color: #bad8f6a6;
}

.item:hover {
  cursor: pointer;
  background-color: #d0e7ff7c;
}
</style>