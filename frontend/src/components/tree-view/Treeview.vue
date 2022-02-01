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
            @updateParentName="updateName($event, item)"
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
import { Prop } from 'vue-property-decorator';

import { getAllItems } from '@/store/getters';
import { BaseModel } from '@/models/Base.model';

import UpdatableItemMixin from '@/components/mixins/UpdatableItemMixin';
import WTreeViewParent from '@/components/tree-view/TreeviewParent.vue';
import { CHILD_ITEM_KEYS, PARENT_ITEM_KEYS, PARENT_TO_CHILD } from '@/store/keys';

@Options({
  components: { WTreeViewParent}
})
export default class Treeview extends mixins(UpdatableItemMixin) {
  @Prop() items: BaseModel[] = [];

  protected get key(): CHILD_ITEM_KEYS {
    return PARENT_TO_CHILD.get(this.$store.state.activeParentKey);
  }

  toggleState = new Map<number, boolean>(); // TODO issue#12 remember in local store
  
  toggle(open: boolean, parent: BaseModel) {
    this.toggleState.set(parent.id, open);
  }

  isOpen(parent: BaseModel) {
    return this.toggleState.has(parent.id) ? this.toggleState.get(parent.id) : true;
  }

  deleteParent(item: BaseModel) {
    this.deleteItem(PARENT_TO_CHILD.get(this.parentKey), item);
  }

  deleteChild(item: BaseModel) {
    const parent = this.findParentForChild(item);
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

  private findParentForChild(item: BaseModel) {
    for (const group of getAllItems(this.$store.state, this.parentKey)) {
      const hasChild = group['children'].find(child => child.id === item.id);
      if (hasChild) {
          return group;
      }
    }
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
