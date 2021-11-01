<template>
    <WButton class="w-sidebar-opener" color="primary" :title="$t('side_bar.open_menu')" icon="fa fa-2x fa-bars" @click="sidebarVisible = true" />
    <Sidebar v-model:visible="sidebarVisible" position="left">
      <div class="w-sidebar-menu">
        <div class="w-sidebar-menu-item ">
          <WButton class="link" @click="addParent" :label="$t(`side_bar.add_parent.${parentKey}`)" />
        </div>

        <div class="w-sidebar-menu-item ">
            <Dropdown v-model="selectedParent" :options="parents" :placeholder="$t(`side_bar.select_parent.${parentKey}`)" optionLabel="name" :filter="true" />
            <WButton color="primary" @click="addChild" :label="$t(`side_bar.add_child.${parentKey}`)" :disabled="selectedParent === null" />
        </div>
      </div>
    </Sidebar>    
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import WButton from '@/components/shared/Button.vue';
import { Prop } from "vue-property-decorator";
import { BaseModel } from "@/models/Base.model";
import { getAllItems } from "@/store/getters";
import { NOVEL_ITEM_KEYS } from "@/store/keys";

@Options({
  components: { WButton }
})
export default class WSidebarMenu extends Vue {
    @Prop() parentKey: NOVEL_ITEM_KEYS;
    @Prop() childKey: NOVEL_ITEM_KEYS;

    sidebarVisible = false;
    selectedParent = null;



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
.w-sidebar-opener {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 5em !important;
    height: 5em;
    z-index: 10;
    border-left: 1px solid #1a1a1a;
    display: flex;
    margin: auto 0;
    background-color: transparent !important;
    border: 0px !important
}

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
