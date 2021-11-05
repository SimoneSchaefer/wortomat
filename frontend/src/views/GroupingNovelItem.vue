<template>
  <div class="chapters-view">
    <WSidebarMenu :parentKey="parentKey" :childKey="childKey" />
    
    <div class="chapters-content">
      <Splitter style="height: 100%" :stateKey="parentKey">
        <SplitterPanel class="split-content-left">
          <WTreeview :parentKey="parentKey" :childKey="childKey" :parentItems="items"></WTreeview>
        </SplitterPanel>
        <SplitterPanel class="split-content-right">
          <ScrollPanel style="height: 100%">
            <NovelItemSheetList :childKey="childKey" :parentKey="parentKey" />
          </ScrollPanel>
        </SplitterPanel>
      </Splitter> 
    </div>
  </div>
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';
import { NOVEL_ITEM_KEYS } from '@/store/keys';
import WButton from '@/components/shared/Button.vue';
import WLink from '@/components/shared/Link.vue';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import MissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';

import WSidebarMenu from '@/components/shared/menu/SidebarMenu.vue';
import NovelItemList from '@/components/shared/novel-item/NovelItemList.vue';
import NovelItemSheetList from '@/components/shared/novel-item/NovelItemSheetList.vue';
import UpdatableItemMixin from '@/components/mixins/UpdatableItemMixin';
import { BaseModel } from '@/models/Base.model';
import { getAllItems } from '@/store/getters';
import NovelItemSheet from '@/components/shared/novel-item/NovelItemSheet.vue';

import draggable from 'vuedraggable'
import { Prop } from 'vue-property-decorator';
import WConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import WTreeview from '@/components/tree-view/Treeview.vue';

@Options({
  components: {
    WSidebarMenu,
    NovelItemList,
    NovelItemSheetList,
    WButton,
    WLink,
    EditableLabel,
    MissingValueTolerantLabel,
    NovelItemSheet,
    WConfirmDialog,
    WTreeview,
    draggable
  }
})
export default class Chapters extends mixins(UpdatableItemMixin) {
    @Prop() parentKey: NOVEL_ITEM_KEYS;
    @Prop() childKey: NOVEL_ITEM_KEYS;
    
    activeIndex = [];

    mounted(): void {
      this.$store.dispatch('loadItems', { key: this.parentKey, novelId: this.$route.params.id }); 
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
    $event.stopPropagation();
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

        
    updateName(item, newValue: string): void {
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


<style scoped>

.p-accordion-header .group-options,
.hidden.group-options {
  display: none;  
}

.p-accordion-header:hover .group-options {
  display: flex; 
}

.chapters-content {
  width: 100%;
}
.chapters-view {
  display: flex;
  width: 100%;
}

.tree-view {
  background-color: white;
  height: 100%;
}

.tree-view-item {
  display: flex;
  width: 100%;
  cursor: grab;
  justify-content: space-between;
}

.tree-view-item-header {
  font-weight: bold;
  display: flex;
}
.tree-view-item-child {
  padding-left: 1em;
}
.tree-view .tree-view-item-child a{
  padding: 0.5em;
}

.tree-view.children {
  width: 20em;
}

.tree-view-children-header {
  font-weight: bold;
}


.tree-view-item a {
  text-decoration: none;
  display: block;
  width: 100%;
  padding: 0.8em;
}

.tree-view-item:hover {
  background-color: pink;
}

.selected {
  background-color: pink;
}

.accordion-header {
  display: flex;
  width: 100%;
  align-items: center;
}

.accordion-header .menu {
  width: 2em;
  opacity: 0.5;
  text-align: right;
}


.part-draggable {
  padding: 0.5em;
  border-bottom: 1px solid gray;
}
</style>
