<template>
    <WSidebarOpener icon="fa fa-2x fa-bars" @click="sidebarVisible = true" />
    <Sidebar v-model:visible="sidebarVisible" position="left">
      <div class="w-sidebar-menu">
        <div class="w-sidebar-menu-item ">
          <WButton class="link" @click="addParent" :label="$t(`side_bar.add_parent.${parentKey}`)" />
        </div>
      </div>
    </Sidebar>    
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import WButton from '@/components/forms/Button.vue';
import WSidebarOpener from '@/components/shared/menu/SidebarOpener.vue';
import { Prop } from "vue-property-decorator";
import { BaseModel } from "@/models/Base.model";
import { getAllItems } from "@/store/getters";
import { NOVEL_ITEM_KEYS } from "@/store/keys";
import { TimelineEventModel } from "@/models/TimelineEvent";

@Options({
  components: { WButton, WSidebarOpener }
})
export default class WTimelineSidebarMenu extends Vue {
    @Prop() parentKey: NOVEL_ITEM_KEYS;

    sidebarVisible = false;
    selectedParent = null;

    addParent(): void {
        this.$store.dispatch("addItem", {
        key: this.parentKey,
        novelId: this.$store.state.currentNovel?.id,
        item: new TimelineEventModel(),
        });
        // var container = this.$el.querySelector(".p-scrollpanel-content");
        // container.scrollTop = container.scrollHeight;
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
</style>
