<template>
  <WSidebarMenu :parentKey="parentKey" :childKey="childKey" />    
  <div v-if="!items.length" class="empty">
    <WHelpNote :itemKey="parentKey"></WHelpNote>
  </div>
  <div v-else class="grouping-item-view">
    <Splitter style="height: 100%" :stateKey="parentKey">
      <SplitterPanel class="split-content-left" :size="30">
        <ScrollPanel style="height: 100%">
          <WTreeview :parentKey="parentKey" :childKey="childKey" :items="items"></WTreeview>
        </ScrollPanel>
      </SplitterPanel>
      <SplitterPanel class="split-content-right">
        <ScrollPanel style="height: 100%">
          <WNovelItemSheetList :childKey="childKey" :parentKey="parentKey" />
        </ScrollPanel>
      </SplitterPanel>
    </Splitter> 
  </div>
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { getAllItems } from '@/store/getters';
import { BaseModel } from '@/models/Base.model';

import UpdatableItemMixin from '@/components/mixins/UpdatableItemMixin';
import WSidebarMenu from '@/components/shared/menu/SidebarMenu.vue';
import WNovelItemSheetList from '@/components/shared/novel-item/NovelItemSheetList.vue';
import WTreeview from '@/components/tree-view/Treeview.vue';
import WHelpNote from '@/components/HelpNote.vue';

@Options({
  components: {
    WSidebarMenu,
    WNovelItemSheetList,
    WTreeview,
    WHelpNote
  }
})
export default class GroupingNovelItem extends mixins(UpdatableItemMixin) {
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


     
  get items(): BaseModel[] {
      return getAllItems(this.$store.state, this.parentKey);
  }

  set items(value: BaseModel[]) {
      this.$store.dispatch('updateOrder', { key: this.parentKey, novelId: this.$store.getters.openNovelId, newOrder: value });
  } 

  get selectedItems(): number[] {
    return this.$store.state.selection.get(this.childKey) || [];
  }
}       
</script>

<style scoped>
.grouping-item-view {
  width: 100%;
  height: 100%;
}

.empty {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
}
</style>
