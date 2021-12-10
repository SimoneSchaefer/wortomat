<template>
  <draggable 
    v-model="items" 
    group="items" 
    @start="drag=true" 
    @end="drag=false" 
    item-key="id">
    <template #item="{element}">
        <div v-if="isVisible(element)">
            <div class="item p-jc-between" v-on:click="selectItem(element, $event)" v-bind:class="{ active: isSelected(element)}">
                <slot v-bind:item="element"></slot>
            </div>
        </div>      
    </template>
  </draggable>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import draggable from 'vue-draggable-next'

import { BaseModel } from '@/models/Base.model';
import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { getAllItems, getCurrentSelection, getFilteredItems } from '@/store/getters';

@Options({
  components: { draggable }
})
export default class DragDropList extends Vue {
    @Prop() novelItemKey: NOVEL_ITEM_KEYS;

    private lastChecked: BaseModel = null; // needed for CTRL handling

    get selectedItems(): BaseModel[] {
        return getCurrentSelection(this.$store.state, this.novelItemKey);
    }
   
    get items(): BaseModel[] {
        return getAllItems(this.$store.state, this.novelItemKey);
    }

    set items(value: BaseModel[]) {
        this.$store.dispatch('updateOrder', { key: this.novelItemKey, novelId: this.$store.getters.openNovelId, newOrder: value });
    } 


    get filteredItems(): BaseModel[] {
        return getFilteredItems(this.$store.state, this.novelItemKey);
    }


    isVisible(item: BaseModel): boolean {
        return !!this.filteredItems.find(filteredItem => filteredItem.id === item.id);
    }

    isSelected(item: BaseModel): boolean {
        return !!this.selectedItems.find(chapter => chapter.id === item.id);
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