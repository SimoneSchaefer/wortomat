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
import WTreeViewParent from '@/components/tree-view/TreeviewParent.vue';

const novelDataModule = namespace("novelData");
const selectionModule = namespace("selection");

@Options({
  components: { WTreeViewParent}
})
export default class Treeview extends mixins(UpdatableItemMixin) {
  @novelDataModule.State('_novelItems')
  novelItems!: Map<PARENT_ITEM_KEYS, BaseModel[]>;

  @selectionModule.State('_selectedItemIds')
  _selectedItemIds!: Map<PARENT_ITEM_KEYS, number[]>;

  @selectionModule.Action
  selectItemIds!: ( payload: { view: PARENT_ITEM_KEYS, itemIds: number[]} ) => Promise<void>;

  mounted() {
    this.$store.subscribe((mutation) => {
      if (mutation.type === 'novelData/novelItemAdded') {
        this.selectItemIds({ view: this.parentKey, itemIds: [ mutation.payload.novelItem.id ]} );
      }
      if (mutation.type === 'novelData/novelItemsLoaded' && !this._selectedItemIds.get(this.parentKey)?.length) { //TODO move to parent component
        const firstParentWithChildren = mutation.payload.novelItems.npfind(parent => parent['children'].length > 0);
        if (firstParentWithChildren) {
          this.selectItemIds({ view: this.parentKey, itemIds: [ firstParentWithChildren['children'][0].id ]} );
        }
      }
    });
  }

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

  get items() {
    return this.novelItems.get(this.parentKey) || [];
  }

  toggleState = new Map<number, boolean>(); // TODO issue#12 remember in local store
  
  toggle(open: boolean, parent: BaseModel) {
    this.toggleState.set(parent.id, open);
  }

  isOpen(parent: BaseModel) {
    return this.toggleState.has(parent.id) ? this.toggleState.get(parent.id) : true;
  }

  deleteParent(item: BaseModel) {
    this.deleteNovelItem({ view: this.parentKey, novelItem: item});
  }

  deleteChild(item: BaseModel) {
    const parent = this.novelItems.get(this.parentKey).find(parent => parent.id === item.parentId);
    item.parentId = parent?.id || -1;
    this.deleteNovelItem({ view: this.parentKey, novelItem: item});
  }

  addChild(selectedParent: BaseModel): void {
    const child = new BaseModel();
    child.parentId = selectedParent.id;
    this.addNovelItem({ view: this.parentKey, novelItem: child });
    this.toggleState.set(selectedParent.id, true);
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
}
</script>


<style scoped>
.list-group {
  width: 100%;
}
</style>
