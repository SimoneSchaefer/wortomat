<template>
  <div v-if="!items.length && !loading" class="empty">
    <WHelpNote :itemKey="parentKey"></WHelpNote>
  </div>
  <div v-else class="grouping-item-view">
    <Splitter style="height: 100%" :stateKey="parentKey">
      <SplitterPanel class="split-content-left" :size="30">
        <ScrollPanel style="height: 100%">
          <WTreeview :items="items"></WTreeview>
        </ScrollPanel>
      </SplitterPanel>
      <SplitterPanel class="split-content-right">
        <ScrollPanel style="height: 100%">
          <WNovelItemSheetList />
        </ScrollPanel>
      </SplitterPanel>
    </Splitter> 
  </div>
  <WSubMenu :parentKey="parentKey" :childKey="childKey"></WSubMenu>

</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';

import { getAllItems } from '@/store/getters';
import { BaseModel } from '@/models/Base.model';
import { PARENT_ITEM_KEYS } from '@/store/keys';

import WSidebarMenu from '@/components/shared/menu/SidebarMenu.vue';
import WNovelItemSheetList from '@/components/shared/novel-item/NovelItemSheetList.vue';
import WTreeview from '@/components/tree-view/Treeview.vue';
import WHelpNote from '@/components/HelpNote.vue';
import WSubMenu from '@/components/navigation/SubMenu.vue';
import NovelItemKeyAwareMixin from '@/components/mixins/NovelItemKeyAwareMixin';
import { Prop } from 'vue-property-decorator';

@Options({
  components: {
    WSidebarMenu,
    WNovelItemSheetList,
    WTreeview,
    WHelpNote,
    WSubMenu
  }
})
export default class GroupingNovelItem extends mixins(NovelItemKeyAwareMixin) {
  @Prop() novelItemKey: PARENT_ITEM_KEYS;
    
  activeIndex = [];

  protected get key(): PARENT_ITEM_KEYS {
    return this.$store.state.activeParentKey;
  }

  mounted(): void {
    this.$store.dispatch('setActiveParentKey', { parentKey: this.novelItemKey }); 
    this.$store.dispatch('loadItems', { key: this.novelItemKey, novelId: this.$route.params.id }); 
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

  get loading(): boolean {
    return this.$store.state.loading;
  }
  get selectedItems(): number[] {
    return this.$store.state.selection.get(this.childKey) || [];
  }
  get items(): BaseModel[] {
      return getAllItems(this.$store.state, this.parentKey);
  }
  set items(value: BaseModel[]) {
      this.$store.dispatch('updateOrder', { key: this.parentKey, novelId: this.$store.getters.openNovelId, newOrder: value });
  } 
}       
</script>

<style scoped>
.grouping-item-view {
  width: 100%;
  height: 100%;
}

.split-content-right {
  background: var(--very-dark-background);
}

.empty {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
}
</style>
