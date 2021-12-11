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

import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { getAllItems } from '@/store/getters';
import { BaseModel } from '@/models/Base.model';

import UpdatableItemMixin from '@/components/mixins/UpdatableItemMixin';
import WTreeViewParent from '@/components/tree-view/TreeviewParent.vue';

@Options({
  components: { WTreeViewParent}
})
export default class Treeview extends mixins(UpdatableItemMixin) {
    @Prop() parentKey: NOVEL_ITEM_KEYS;
    @Prop() childKey: NOVEL_ITEM_KEYS;
    @Prop() items: BaseModel[] = [];

    toggleState = new Map<number, boolean>();
    
    toggle(open: boolean, parent: BaseModel) {
      this.toggleState.set(parent.id, open);
    }

    isOpen(parent: BaseModel) {
      return this.toggleState.has(parent.id) ? this.toggleState.get(parent.id) : true;
    }

    deleteParent(item: BaseModel) {
      this.$store.dispatch('deleteItems', { 
          key: this.parentKey, 
          novelId: this.$store.state.currentNovel?.id,
          items: [item]
      });
    }

    deleteChild(item: BaseModel) {
        const parentId = (this.items.find(parent => parent['children'].find(child => child.id === item.id)))?.id; 
        // TODO cleanup data structure mess
        let flatList = [];
        let parent = null;
        for (const group of getAllItems(this.$store.state, this.parentKey)) {
          // flatList = flatList.concat(group.research);
          const findChild = group['children'].find(child => child.id === item.id);
          if (findChild) {
              parent = group;
              break;
          }
        }
        item.parentId = parent?.id || undefined;
        this.$store.dispatch('deleteItems', { 
            key: this.childKey, 
            novelId: this.$store.state.currentNovel?.id,
            items: [item]
        });
    }

  addChild(selectedParent: BaseModel, $event): void {
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


}
</script>


<style scoped>
.list-group {
  width: 100%;
}
</style>
