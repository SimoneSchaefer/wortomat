<template>
  <WConfirmDialog ref="confirmDeleteParent" @cancel="reload" @accept="deleteNovelItemParent" message="delete_confirm"></WConfirmDialog>
  <WConfirmDialog ref="confirmDeleteChild" @cancel="reload" @accept="deleteNovelItemChild" message="delete_confirm"></WConfirmDialog>
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
            @childMoved="childMoved($event)"></w-tree-view-parent>        
        </div>
     </draggable>
    <!-- <div class="trash">
      <draggable class="dropzone trashzone" :group="{ name: 'trash', put: () => true, pull: () => false }">
          <Accordion :open="isOpen(trashGroup)" @toggle="toggle($event, trashGroup)">
            <template v-slot:header>
              <i class="fa fa-icon fa-trash-alt"></i>&nbsp;
              {{ $t('trash') }}
            </template>
            <template v-slot:content>
              <draggable :list="trashGroup['children']" class="list-group" ghost-class="ghost"  group="trash" :id="`trash-parent-${trashGroup.id}`">   
                <div class="trash-hint">{{ $t('trash_hint') }} </div>
            </draggable>
          </template>
          </Accordion>        
      </draggable>
    </div>-->
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
import { ChildModel } from '@/models/ChildModel';
import { ParentModel } from '@/models/ParentModel';
import WTreeviewListItem from '@/components/tree-view/TreeviewListItem.vue';
import Accordion from '@/components/tree-view/Accordion.vue';
 import WConfirmDialog from '@/components/shared/ConfirmDialog.vue';

const novelDataModule = namespace("novelData");
const selectionModule = namespace("selection");
const treeStateModule = namespace("treeState");

@Options({
  components: { WTreeViewParent, WTreeviewListItem, Accordion, WConfirmDialog}
})
export default class Treeview extends mixins(UpdatableItemMixin, FilterAwareMixin) {
  private lastChecked: BaseModel = null; // needed for CTRL/SHiFT+select handling

  @treeStateModule.State('toggleState')
  toggleState!: Record<PARENT_ITEM_KEYS, Record<number, boolean>>; // TODO issue#12 remember in local store

  @selectionModule.State('_selectedItemIds')
  _selectedItemIds!: Record<PARENT_ITEM_KEYS, number[]>;

  @novelDataModule.State('_deletedNovelItems')
  _deletedNovelItems!: Map<PARENT_ITEM_KEYS, ParentModel>;

  @novelDataModule.Action
  loadNovelItems!: (payload: { view: PARENT_ITEM_KEYS, novelId: number } ) => Promise<void>;

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
  deleteNovelItemChild!: (payload: { view: PARENT_ITEM_KEYS, novelItem: number}) => Promise<void>;

  @novelDataModule.Action
  deleteNovelItemParent!: (payload: { view: PARENT_ITEM_KEYS, novelItem: number}) => Promise<void>;

  @novelDataModule.Action
  moveParent!: (payload: { key: PARENT_ITEM_KEYS, novelId: number, parentId: number, oldPosition: number, newPosition: number }) => Promise<void>;

  @novelDataModule.Action
  moveChild!: (payload: { key: PARENT_ITEM_KEYS, novelId: number, childToMove: number, newParentId: number, newPosition: number }) => Promise<void>;

  mounted() {
    this.$store.subscribe((mutation, store) => {
      if (mutation.type === 'novelData/novelItemAdded' && this.isAboutChildItem(mutation)) {
        this.selectItemIds({ view: mutation.payload.view, itemIds: [ mutation.payload.novelItem.id ]} );
      }      
      if (mutation.type === 'novelData/novelItemDeleted' && this.isAboutChildItem(mutation)) {
        // TODO: In case the currently selected item has been deleted, we need to deselect, and, in case
        // nothing else is selected, select another item.
        /*const index = store.selectedItems.findIndex(mutation.payload.novelItem.id);
        if (index > -1) {
          const newSelectedItems = this.selectedItems.splice(index, 1);
          if (newSelectedItems.length) {
            this.selectItemIds({ view:mutation.payload.view, itemIds: newSelectedItems});
          } else {
            const firstParentWithChildren = this.getFilteredItems().find(parent => parent.children.length > 0);
            if (firstParentWithChildren) {
              this.selectItemIds({ view:mutation.payload.view, itemIds: [ firstParentWithChildren['children'][0].id ]} );
            }
          }
        }*/
      }
      if (mutation.type === 'novelData/novelItemsLoaded'  && !this._selectedItemIds[mutation.payload.view]?.length){
        const firstParentWithChildren = this.getFilteredItems(mutation.payload.novelItems).find(parent => parent.children.length > 0);
        if (firstParentWithChildren) {
          this.selectItemIds({ view:mutation.payload.view, itemIds: [ firstParentWithChildren.children[0].id ]} );
        }
      }
    });
  }

  reload() {
    this.loadNovelItems({ view: this.parentKey, novelId: this.novelId});
  }

  private isAboutChildItem(mutation): boolean {
   return !!mutation.payload.novelItem.parentId;
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
  
  toggle(open: boolean, parent: ParentModel) {
    this.toggleItems({ view: this.parentKey, itemIds: [ parent.id], expanded: open })
  }

  isOpen(parent: ParentModel) {
    return Object.keys(this.currentToggleState).includes(`${parent.id}`) ? this.currentToggleState[parent.id] : true;
  }

  addChild(selectedParent: ParentModel): void {
    const child = new ChildModel();
    child.parentId = selectedParent.id;
    child.tags = [];

    this.addNovelItem({ view: this.parentKey, novelItem: child });
    this.toggle(true, selectedParent);
  }

  childMoved($event): void {
    const childId = $event.clone.id.replace('child-', '');
    if ($event.to.className.includes('trashzone')) {
      this.confirmDeleteChild({ view: this.parentKey, novelItem: childId}, $event);
      // this.deleteNovelItemChild({ view: this.parentKey, novelItem: childId});
    } else {
      const parentTo = $event.to.id.replace('parent-', '');
      const newPosition = $event.newIndex;
      this.moveChild({ key: this.parentKey, novelId: this.novelId, childToMove: childId, newParentId: parentTo, newPosition: newPosition });
    }
  }

  confirmDeleteParent(item, $event): void {
    (this.$refs.confirmDeleteParent as WConfirmDialog).getDecision(item);
  }

  confirmDeleteChild(item, $event): void {
      $event.stopPropagation();
      (this.$refs.confirmDeleteChild as WConfirmDialog).getDecision(item);
  }

  parentMoved($event): void {
    if ($event.removed) {
      const parentId = $event.removed.element.id;
      this.confirmDeleteParent({ view: this.parentKey, novelItem: parentId}, $event);
    } else {
      const parentId = $event.moved.element.id;
      const newIndex = $event.moved.newIndex;
      const oldIndex = $event.moved.oldIndex;
      this.moveParent({ key: this.parentKey, novelId: this.novelId, parentId: parentId, oldPosition: oldIndex, newPosition: newIndex });
    }
  }

  selectChild(selected, $event): void {
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
  
  selectItem(event): void  {
    const $event = event.event;
    $event.stopPropagation();
    const selected = event.item;
    /*let selectedItems: number[] = [];
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
    this.selectItemIds( { view: this.parentKey, itemIds: selectedItems });  */
    this.selectChild(selected, $event);  
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

.trash-hint {
  background: var(--light-background);
  padding: 1em;
  color: gray;
  font-style: italic;
}
</style>
