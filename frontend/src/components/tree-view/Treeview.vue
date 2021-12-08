<template>
  <div class="tree">
      <draggable :list="items" group="parents"
        class="list-group"
        ghost-class="ghost"
        @change="parentMoved">
        <div class="list-group-item" v-for="item in items" :key="item.id">
          <WTreeviewHeader 
            :parentKey="parentKey" 
            :item="item"                     
            @addChild="addChild"
            @updateParentName="updateName"
            @deleteParent="deleteParent">
          </WTreeviewHeader>
          <draggable :list="item['children']" class="list-group" ghost-class="ghost"  group="children" @end="childMoved" :id="`parent-${item.id}`">   
            <WTreeviewListItem v-for="child in item['children']" :key="child.id"
                @select="selectChild"
                @deleteChild="deleteChild"
                :selected="isSelected(child)"
                :element="child" 
                :parentKey="parentKey" 
                :childKey="childKey">
            </WTreeviewListItem>    
          </draggable>
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
import WTreeviewHeader from '@/components/tree-view/TreeviewHeader.vue';
import WTreeviewListItem from '@/components/tree-view/TreeviewListItem.vue';

@Options({
  components: {
    WTreeviewHeader,
    WTreeviewListItem,
  }
})
export default class Treeview extends mixins(UpdatableItemMixin) {
    @Prop() parentKey: NOVEL_ITEM_KEYS;
    @Prop() childKey: NOVEL_ITEM_KEYS;
    @Prop() items: BaseModel[] = [];
    
    activeIndex = [];

    closeGroup($event) {
      const index = this.activeIndex.findIndex(val => val === $event.index)
      if (index > -1) this.activeIndex.splice(index, 1);
    }

    deleteParent(item: BaseModel) {
        this.$store.dispatch('deleteItems', { 
            key: this.parentKey, 
            novelId: this.$store.state.currentNovel?.id,
            items: [item]
        });
    }

    parentMove($event) {
      console.log('DRAG DROP PARENT CHANGE', $event)
    }

    childMove($event) {
      console.log('DRAG DROP CHILD CHANGE', $event)
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
    $event.stopPropagation();
    const child = new BaseModel();
    child.parentId = selectedParent.id;
    this.$store.dispatch('addItem', { 
        key: this.childKey, 
        novelId: this.novelId, 
        item: child,
    });
    
    const parentIndex = this.items.findIndex(parent => parent.id === selectedParent.id);
    if (!this.activeIndex.includes(parentIndex)) {
      this.activeIndex.splice(0, 0, parentIndex);
    }
    this.activeIndex = [...this.activeIndex];
  }

  childMoved($event): void {
    const childId = $event.clone.id.replace('child-', '');
    const parentTo = $event.to.id.replace('parent-', '');
    const newPosition = $event.newIndex;

    console.log('Moving ' + childId + ' to ' + parentTo + ', poisition: ' + newPosition)

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

  isSelected(item: BaseModel) {
    const isSelected = !!this.selectedItems.find(selectedItem => selectedItem === item.id); 
    if (isSelected) {
      this.openParentIfNecessary(item);
    }
    return isSelected;
  }

  selectChild(item: BaseModel) {
    this.$store.dispatch('selectItems', { key: this.childKey, items: [item] });
  }

  get selectedItems(): number[] {
    return this.$store.state.selection.get(this.childKey) || [];
  }
  
  private openParentIfNecessary(item: BaseModel) {
    const parentIndex = this.items.findIndex(parent => parent.id === item.parentId);
    if (!this.activeIndex.includes(parentIndex)) {
      this.activeIndex.push(parentIndex);
    }
  }
}
</script>

<style>
.p-scrollpanel-bar {
  background-color: purple !important;
}
</style>

<style scoped>
.list-group {
  width: 100%;
  padding-right: 1em;
}
</style>
