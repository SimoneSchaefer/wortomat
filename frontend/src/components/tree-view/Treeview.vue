<template>
  <div class="tree">
      <draggable :list="items" group="parents"
        class="list-group"
        ghost-class="ghost"
        @change="parentMoved">
       <div class="list-group-item tree-view-item" v-for="item in items" :key="item.id">
          <w-tree-view-parent 
            :item="item" 
            :parentKey="parentKey" 
            :childKey="childKey"
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

import { getAllItems } from '@/store/getters';
import { BaseModel } from '@/models/Base.model';

import UpdatableItemMixin from '@/components/mixins/UpdatableItemMixin';
import WTreeViewParent from '@/components/tree-view/TreeviewParent.vue';
import { childKeyForParentKey, CHILD_ITEM_KEYS, PARENT_ITEM_KEYS } from '@/store/keys';
import { findParentForChild } from '@/store/store.helper';

const novelDataModule = namespace("novelData");

@Options({
  components: { WTreeViewParent}
})
export default class Treeview extends mixins(UpdatableItemMixin) {
  @novelDataModule.State('_novelItems')
  novelItems!: Map<PARENT_ITEM_KEYS, BaseModel[]>;

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
    this.deleteItem(this.parentKey, item);
  }

  deleteChild(item: BaseModel) {
    const parent = findParentForChild(this.$store.state, childKeyForParentKey(this.$store.state.activeParentKey), item);
    item.parentId = parent?.id || undefined;
    this.deleteItem(this.childKey, item);
  }

  addChild(selectedParent: BaseModel): void {
    const child = new BaseModel();
    child.parentId = selectedParent.id;
    this.$store.dispatch('addItem', { 
        key: this.childKey, 
        novelId: this.novelId, 
        item: child,
    });
    this.toggleState.set(selectedParent.id, true);
  }

  childMoved($event): void {
    const childId = $event.clone.id.replace('child-', '');
    const parentTo = $event.to.id.replace('parent-', '');
    const newPosition = $event.newIndex;

    this.$store.dispatch('moveChild', { 
      key: this.parentKey, 
      novelId: this.$route.params.id,
      childToMove: childId,
      newParentId: parentTo,
      newPosition: newPosition
    }); 
  }

  parentMoved($event): void {
    const parentId = $event.moved.element.id;
    const newIndex = $event.moved.newIndex;
    const oldIndex = $event.moved.oldIndex;

    this.$store.dispatch('moveParent', { 
      key: this.parentKey, 
      novelId: this.$route.params.id,
      parentId: parentId,
      oldPosition: oldIndex,
      newPosition: newIndex
    });
  }

  private deleteItem(key: PARENT_ITEM_KEYS | CHILD_ITEM_KEYS, item: BaseModel) {
    this.$store.dispatch('deleteItems', { 
      key: key, 
      novelId: this.$store.state.currentNovel?.id,
      items: [item]
    });
  }
}
</script>


<style scoped>
.list-group {
  width: 100%;
}
</style>
