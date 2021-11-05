<template>
    <Accordion multiple :activeIndex="activeIndex">                 
        <AccordionTab v-for="item of items" :key="item.id">
            <template #header>
                <WTreeviewHeader 
                    :parentKey="parentKey" 
                    :item="item" 
                    @addChild="addChild"
                    @updateParentName="updateName"
                    @deleteParent="deleteParent">
                </WTreeviewHeader>
            </template>

            <draggable class="list-group"
                :id="`parent-${item.id}`"
                :data-source="`parent-${item.id}`"
                :list="item[childKey]"
                :item-key="`parent-${item.id}`"
                group="a"                 
                @end="childMoved" >
                <template #item="{element}">
                    <WTreeviewListItem 
                        @select="selectChild"
                        :selected="isSelected(item)"
                        :element="element" 
                        :parentKey="parentKey" 
                        :childKey="childKey">
                    </WTreeviewListItem>                   
                </template>
            </draggable>
        </AccordionTab>
    </Accordion> 
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import draggable from 'vuedraggable'

import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { getAllItems } from '@/store/getters';
import { BaseModel } from '@/models/Base.model';

import WButton from '@/components/shared/Button.vue';
import WLink from '@/components/shared/Link.vue';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import MissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';
import UpdatableItemMixin from '@/components/mixins/UpdatableItemMixin';
import WConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import WTreeviewHeader from '@/components/tree-view/TreeviewHeader.vue';
import WTreeviewListItem from '@/components/tree-view/TreeviewListItem.vue';

@Options({
  components: {
    WButton,
    WLink,
    EditableLabel,
    MissingValueTolerantLabel,
    WConfirmDialog,
    WTreeviewHeader,
    WTreeviewListItem,
    draggable
  }
})
export default class Chapters extends mixins(UpdatableItemMixin) {
    @Prop() parentKey: NOVEL_ITEM_KEYS;
    @Prop() childKey: NOVEL_ITEM_KEYS;
    @Prop() parentItems: BaseModel[];
    
    activeIndex = [];

    deleteParent(item: BaseModel) {
        this.$store.dispatch('deleteItems', { 
            key: this.parentKey, 
            novelId: this.$store.state.currentNovel?.id,
            items: [item]
        });
    }

    deleteChild(item: BaseModel) {
        const parentId = (this.items.find(parent => parent[this.childKey].find(child => child.id === item.id)))?.id; 
        // TODO cleanup data structure mess
        let flatList = [];
        let parent = null;
        for (const group of getAllItems(this.$store.state, this.parentKey)) {
        // flatList = flatList.concat(group.research);
        console.log('checking group', group, 'item is ', item)
        const findChild = group[this.childKey].find(child => child.id === item.id);
        if (findChild) {
            parent = group;
            break;
        }

        }
        console.log('AAAA', parent)
        item.parentId = parent?.id || undefined;
        this.$store.dispatch('deleteItems', { 
            key: this.childKey, 
            novelId: this.$store.state.currentNovel?.id,
            items: [item]
        });
    }

  addChild(selectedParent: BaseModel, $event): void {
    // $event.stopPropagation();
    const child = new BaseModel();
    child.parentId = selectedParent.id;
    this.$store.dispatch('addItem', { 
        key: this.childKey, 
        novelId: this.novelId, 
        item: child,
    });
  }

  get modalOpen() {
    return this.$store.state.modalIsOpen;
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
     
  get items(): BaseModel[] {
      return getAllItems(this.$store.state, this.parentKey);
  }

  set items(value: BaseModel[]) {
      this.$store.dispatch('updateOrder', { key: this.parentKey, novelId: this.$store.getters.openNovelId, newOrder: value });
  } 

  get selectedItems(): number[] {
    return this.$store.state.selection.get(this.childKey) || [];
  }

  isSelected(item: BaseModel) {
    const isSelected = !!this.selectedItems.find(selectedItem => selectedItem === item.id); 
    if (isSelected) {
      const parentIndex = this.items.findIndex(parent => parent.id === item.parentId);
      if (!this.activeIndex.includes(parentIndex)) {
        this.activeIndex.push(parentIndex);
      }
    }
    return isSelected;
  }

  selectChild(item: BaseModel) {
    this.$store.dispatch('selectItems', { key: this.childKey, items: [item] });
  }

        
    updateName(newValue: string, item: BaseModel): void {
        this.updateItem(
          this.parentKey, 
          item, 
          { name: newValue }

      );   
    }  
}
</script>

<style>
.p-scrollpanel-bar {
  background-color: purple !important;
}
</style>
