<template>
  <div class="tree">
      <draggable :list="items" group="parents"
        class="list-group"
        ghost-class="ghost"
        @change="parentMoved">
       <div class="list-group-item tree-view-item" v-for="item in items" :key="item.id">
          <w-tree-view-parent 
            :item="item"
            :open="isOpen(item)"
            @toggle="toggle($event, item)"
            @select-child="selectItem($event)"
            @updateParentName="updateName(item, $event)"
            @addChild="addChild(item)"
            @childMoved="childMoved($event)"
            @deleteParent="deleteParent"
            @deleteChild="deleteChild"></w-tree-view-parent>        
        </div>
      </draggable>
  </div>
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';
import { namespace } from 's-vuex-class';

import { BaseModel } from '@/models/Base.model';
import { PARENT_ITEM_KEYS } from '@/store/keys';

import UpdatableItemMixin from '@/components/mixins/UpdatableItemMixin';
import FilterAwareMixin from '@/components/mixins/FilterAwareMixin';
import WTreeViewParent from '@/components/tree-view/TreeviewParent.vue';

const novelDataModule = namespace("novelData");
const selectionModule = namespace("selection");
const treeStateModule = namespace("treeState");

@Options({
  components: { WTreeViewParent}
})
export default class Treeview extends mixins(UpdatableItemMixin, FilterAwareMixin) {
  private lastChecked: BaseModel = null; // needed for CTRL/SHiFT+select handling

  @treeStateModule.State('toggleState')
  toggleState!: Record<PARENT_ITEM_KEYS, Record<number, boolean>>; // TODO issue#12 remember in local store

  @selectionModule.State('_selectedItemIds')
  _selectedItemIds!: Record<PARENT_ITEM_KEYS, number[]>;

  @selectionModule.Action
  selectItemIds!: ( payload: { view: PARENT_ITEM_KEYS, itemIds: number[]} ) => Promise<void>;

  @treeStateModule.Action
  toggleItems!: ( payload: { view: PARENT_ITEM_KEYS, itemIds: number[], expanded: boolean } ) => Promise<void>;

  @novelDataModule.Action
  updateNovelItem!: (payload: { view: PARENT_ITEM_KEYS, novelItem: BaseModel}) => Promise<void>;

  @novelDataModule.Action
  addNovelItem!: (payload: { view: PARENT_ITEM_KEYS, novelItem: BaseModel}) => Promise<void>;

  @novelDataModule.Action
  deleteNovelItem!: (payload: { view: PARENT_ITEM_KEYS, novelItem: BaseModel}) => Promise<void>;

  @novelDataModule.Action
  moveParent!: (payload: { key: PARENT_ITEM_KEYS, novelId: number, parentId: number, oldPosition: number, newPosition: number }) => Promise<void>;

  @novelDataModule.Action
  moveChild!: (payload: { key: PARENT_ITEM_KEYS, novelId: number, childToMove: number, newParentId: number, newPosition: number }) => Promise<void>;

  mounted() {
    this.$store.subscribe((mutation) => {
      if (mutation.type === 'novelData/novelItemAdded') {
        if (mutation.payload.novelItem.parentId) {
          this.selectItemIds({ view: mutation.payload.view, itemIds: [ mutation.payload.novelItem.id ]} );
        }
      }
      if (mutation.type === 'novelData/novelItemsLoaded'  && !this._selectedItemIds[mutation.payload.view]?.length){
        const firstParentWithChildren = mutation.payload.novelItems.find(parent => parent['children'].length > 0);
        if (firstParentWithChildren) {
          this.selectItemIds({ view:mutation.payload.view, itemIds: [ firstParentWithChildren['children'][0].id ]} );
        }
      }
    });
  }

  get items() {
    return this.getFilteredItems();
  }

  get currentToggleState() {
    return this.toggleState[this.parentKey] || {};
  }

  get novelItems() {
    return this._novelItems.get(this.parentKey) || [];
  }

  get childItems() {
    const flatChildren = [];
    const filteredItems = this.getFilteredItems();
    for (let parent of filteredItems) {
      flatChildren.push(...parent['children']);
    }
    return flatChildren;
  }
     
  get selectedItems() {
    return this._selectedItemIds[this.parentKey] || [];
  }
  
  toggle(open: boolean, parent: BaseModel) {
    this.toggleItems({ view: this.parentKey, itemIds: [ parent.id], expanded: open })
  }

  isOpen(parent: BaseModel) {
    return Object.keys(this.currentToggleState).includes(`${parent.id}`) ? this.currentToggleState[parent.id] : true;
  }

  deleteParent(item: BaseModel) {
    this.deleteNovelItem({ view: this.parentKey, novelItem: item});
  }

  deleteChild(item: BaseModel) {
    const parent = this.novelItems.find(parent => parent.id === item.parentId);
    item.parentId = parent?.id || -1;
    this.deleteNovelItem({ view: this.parentKey, novelItem: item});
  }

  addChild(selectedParent: BaseModel): void {
    const child = new BaseModel();
    child.parentId = selectedParent.id;
    this.addNovelItem({ view: this.parentKey, novelItem: child });
    this.currentToggleState[selectedParent.id] = true;
  }

  childMoved($event): void {
    const childId = $event.clone.id.replace('child-', '');
    const parentTo = $event.to.id.replace('parent-', '');
    const newPosition = $event.newIndex;
    this.moveChild({ key: this.parentKey, novelId: this.novelId, childToMove: childId, newParentId: parentTo, newPosition: newPosition });
  }

  parentMoved($event): void {
    const parentId = $event.moved.element.id;
    const newIndex = $event.moved.newIndex;
    const oldIndex = $event.moved.oldIndex;
    this.moveParent({ key: this.parentKey, novelId: this.novelId, parentId: parentId, oldPosition: oldIndex, newPosition: newIndex });
  }

  selectItem(event): void  {
    const $event = event.event;
    $event.stopPropagation();
    const selected = event.item;
    let selectedItems: number[] = [];
    if ($event['shiftKey']) {
        selectedItems = this.handleShift(selected);
    } else if ($event['ctrlKey']) {
        selectedItems = this.handleCtrl(selected);
    } else {
        selectedItems = [selected.id];
    }
    if (selectedItems.find(selectedItem => selectedItem === selected.id)) {
      this.lastChecked = selected;
    } 
    this.selectItemIds( { view: this.parentKey, itemIds: selectedItems });    
  }

  handleCtrl(selected: BaseModel): number[]  {
    const index = this.selectedItems.findIndex(selectedItem => selectedItem === selected.id);
    if (index >= 0) {
        this.selectedItems.splice(index, 1);
    } else {
        this.selectedItems.push(selected.id);
    }
    return this.selectedItems;
  }

  handleShift(selected: BaseModel): number[] {
    if (!this.lastChecked) {
        return [selected.id];
    }
    const childItems = this.childItems;
    const start = childItems.findIndex(item => item.id === selected.id);
    const end = childItems.findIndex(item => item.id === this.lastChecked.id);
    const newSelectedItems = this.childItems.slice(Math.min(start,end), Math.max(start,end)+ 1);
    return newSelectedItems.map(item => item.id);
  }
}
</script>


<style scoped>
.list-group {
  width: 100%;
}
</style>
