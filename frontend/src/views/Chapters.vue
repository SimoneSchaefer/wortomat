<template>
  <div class="chapters-view">
    <Button class="sidebar-opener" icon="fa fa-3x fa-bars" @click="sidebarVisible = true" />
    <Sidebar v-model:visible="sidebarVisible" position="right">
      <div class="chapters-menu">
        <div class="chapters-menu-item">
          <b>Options</b>
        </div>
        <a class="chapters-menu-item link" @click="addParent">
          Add Part      
        </a>
      </div>
    </Sidebar>
    
    <div class="chapters-content">
      <Splitter style="height: 100%" :stateKey="parentKey">
        <SplitterPanel class="split-content-left">
          <div class="tree-view">
            <ScrollPanel style="height: 100%">
              <Accordion lazy>
                <AccordionTab v-for="item of items" :key="item.id">
                  <template #header>
                    <div class="accordion-header">
                      <EditableLabel v-bind:value="item.name" @update-label="updateName(item, $event)" placeHolderTitle="No name added yet."></EditableLabel>
                      <div class="menu" @click="addChild(item)"><i class="fa fa-bars"></i></div>
                    </div>
                  </template>

                  <div class="tree-view-item" >
                    <a v-for="child of item.chapters" href="#" 
                      class="tree-view-item-child"
                      @click="selectChild(child)"  
                      :key="child.id"
                      :class="{ selected: isSelected(child) }">
                      <MissingValueTolerantLabel :value="child.name" fallback="No name added yet"></MissingValueTolerantLabel>
                      - 
                      <MissingValueTolerantLabel :value="child.summary" fallback="No summary added yet"></MissingValueTolerantLabel>
                    </a>          
                  </div>
                </AccordionTab>
              </Accordion>         
            </ScrollPanel>
          </div> 
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

import NovelItemMenu from '@/components/shared/menu/NovelItemMenu.vue';
import NovelItemList from '@/components/shared/novel-item/NovelItemList.vue';
import NovelItemSheetList from '@/components/shared/novel-item/NovelItemSheetList.vue';
import UpdatableItemMixin from '@/components/mixins/UpdatableItemMixin';
import { BaseModel } from '@/models/Base.model';
import { getAllItems } from '@/store/getters';
import NovelItemSheet from '@/components/shared/novel-item/NovelItemSheet.vue';


@Options({
  components: {
    NovelItemMenu,
    NovelItemList,
    NovelItemSheetList,
    WButton,
    WLink,
    EditableLabel,
    MissingValueTolerantLabel,
    NovelItemSheet
  }
})
export default class Chapters extends mixins(UpdatableItemMixin) {
  sidebarVisible = false;

  mounted(): void {
    this.$store.dispatch('loadItems', { key: this.parentKey, novelId: this.$route.params.id }); 
  }
     
  get items(): BaseModel[] {
      return getAllItems(this.$store.state, this.parentKey);
  }

  get selectedItems(): number[] {
    return this.$store.state.selection.get(this.childKey) || [];
  }

  isSelected(item: BaseModel) {
    return !!this.selectedItems.find(selectedItem => selectedItem === item.id); 
  }

  selectChild(item: BaseModel) {
    this.$store.dispatch('selectItems', { key: this.childKey, items: [item] });
  }

   addParent(): void {
      this.$store.dispatch('addItem', { 
          key: this.parentKey, 
          novelId: this.novelId, 
          item: new BaseModel() 
      });
    }

   addChild(parent): void {
     const child = new BaseModel();
     child.parentId = parent.id;
      this.$store.dispatch('addItem', { 
          key: this.childKey, 
          novelId: this.novelId, 
          item: child,
      });
    }

        
    updateName(item, newValue: string): void {
        this.updateItem(
          this.parentKey, 
          item, 
          { name: newValue }

      );   
    }  


    createParent() {
        this.$store.dispatch('addItem', { 
            key: this.parentKey, 
            novelId: this.novelId, 
            item: new BaseModel() 
        });
    }

    createChild(parentId: number) {
      const model = new BaseModel();
      model['partId'] = parentId;
        this.$store.dispatch('addItem', { 
            key: this.childKey, 
            novelId: this.novelId, 
            item: new BaseModel() 
        });
    }

  get parentKey(): NOVEL_ITEM_KEYS {
    return NOVEL_ITEM_KEYS.PARTS;
  }

  get childKey(): NOVEL_ITEM_KEYS {
    return NOVEL_ITEM_KEYS.CHAPTERS;
  }
}
</script>

<style>
.p-scrollpanel-bar {
  background-color: purple !important;
}
</style>


<style scoped>

.chapters-content {
  width: 100%;
}
.chapters-view {
  display: flex;
  width: 100%;
}

.chapters-menu {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background-color: white;
  align-items: flex-start;
}

.chapters-menu-item {
  padding: 1em;
  width: 100%;
  border-bottom: 1px solid darkgray;
}

.chapters-menu-item.link:hover {
  cursor: pointer;
  background-color: #efefef;
}

.tree-view {
  background-color: white;
  height: 100%;
  box-shadow: rgba(0, 0, 0, 0.07) 0px 1px 2px, rgba(0, 0, 0, 0.07) 0px 2px 4px, rgba(0, 0, 0, 0.07) 0px 4px 8px, rgba(0, 0, 0, 0.07) 0px 8px 16px, rgba(0, 0, 0, 0.07) 0px 16px 32px, rgba(0, 0, 0, 0.07) 0px 32px 64px;
}

.tree-view-item {
  display: block;
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
  box-shadow: rgba(50, 50, 93, 0.25) 0px 30px 60px -12px inset, rgba(0, 0, 0, 0.3) 0px 18px 36px -18px inset;
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

.tree-view-item a:hover {
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


.sidebar-opener {
  position: fixed; 
  right: 0;
  top: 0;
  width: 5em !important;
  height: 5em;
  z-index: 9999;
}
</style>
