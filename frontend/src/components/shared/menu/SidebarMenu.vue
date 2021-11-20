<template>
    <WSidebarOpener icon="fa fa-2x fa-plus" @click="addParent" />
    <!--<Sidebar v-model:visible="sidebarVisible" position="left">
      <div class="w-sidebar-menu">
        <div class="w-sidebar-menu-item ">
          <WButton class="link" @click="addParent" :label="$t(`side_bar.add_parent.${parentKey}`)" />
        </div>

        <div class="w-sidebar-menu-item">
            <WNovelItemDropdown :items="parents" @change="onChange" :novelItemKey="parentKey" :placeHolder="`side_bar.select_parent.${parentKey}`"></WNovelItemDropdown>
            <WButton color="primary" @click="addChild" :label="$t(`side_bar.add_child.${parentKey}`)" :disabled="selectedParent === null" />
        </div>
      </div>
    </Sidebar>    -->
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop } from "vue-property-decorator";

import WButton from '@/components/shared/Button.vue';
import WSidebarOpener from '@/components/shared/menu/SidebarOpener.vue';
import WNovelItemDropdown from '@/components/shared/NovelItemDropdown.vue';
import WMissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';

import { BaseModel } from "@/models/Base.model";
import { getAllItems } from "@/store/getters";
import { NOVEL_ITEM_KEYS } from "@/store/keys";

@Options({
  components: { WButton, WSidebarOpener, WMissingValueTolerantLabel, WNovelItemDropdown}
})
export default class WSidebarMenu extends Vue {
    @Prop() parentKey: NOVEL_ITEM_KEYS;
    @Prop() childKey: NOVEL_ITEM_KEYS;

    sidebarVisible = false;
    selectedParent = null;

    onChange($event) {
        this.selectedParent = $event;
    }

    addParent(): void {
      this.$store.dispatch('addItem', { 
          key: this.parentKey, 
          novelId: this.novelId, 
          item: new BaseModel() 
      });
      this.hideSidebar();
    }

    addChild(): void {
        const child = new BaseModel();
        child.parentId = this.selectedParent.id;
        this.$store.dispatch('addItem', { 
            key: this.childKey, 
            novelId: this.novelId, 
            item: child,
        });
        this.hideSidebar();
    }

    get selectedForChildCreation() {
        return this.selectedParent;
    }
         
    get parents(): BaseModel[] {
        return getAllItems(this.$store.state, this.parentKey);
    }

    get novelId(): number {
        return this.$store.getters.openNovelId;
    } 
        
    private hideSidebar() {
        this.sidebarVisible = false;
    }
}
</script>

<style scoped>

.w-sidebar-menu {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background-color: white;
    align-items: flex-start;
}

.w-sidebar-menu-item {
    padding: 1em;
    width: 100%;
    border-bottom: 1px solid darkgray;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: stretch;
}

.w-sidebar-menu-item button {
    margin: 1em 0;
}
</style>
