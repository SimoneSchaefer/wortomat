<template>
  <div class="grouping-item-view">
    <div class="submenu"><WSubMenu></WSubMenu></div>
    <div class="content-view">
      <Splitter style="height: 100%" :stateKey="novelItemKey">
        <SplitterPanel class="split-content-left" :size="30">
          <ScrollPanel style="height: 100%">
            <WTreeview></WTreeview>
          </ScrollPanel>
        </SplitterPanel>
        <SplitterPanel class="split-content-right">
          <ScrollPanel style="height: 100%">
            <WNovelItemSheetList />
          </ScrollPanel>
        </SplitterPanel>
      </Splitter>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { namespace } from "s-vuex-class";

import { PARENT_ITEM_KEYS } from "@/store/keys";
import { BaseModel } from "@/models/Base.model";

import WNovelItemSheetList from "@/components/shared/novel-item/NovelItemSheetList.vue";
import WTreeview from "@/components/tree-view/Treeview.vue";
import WHelpNote from "@/components/HelpNote.vue";
import WSubMenu from "@/components/navigation/submenu/SubMenu.vue";

const applicationStateModule = namespace("applicationState");
const novelDataModule = namespace("novelData");

@Options({
  components: {
    WNovelItemSheetList,
    WTreeview,
    WHelpNote,
    WSubMenu,
  },
})
export default class GroupingNovelItem extends Vue {
  @Prop() novelItemKey: PARENT_ITEM_KEYS;

  @novelDataModule.State("_novelItems")
  novelItems!: Map<PARENT_ITEM_KEYS, BaseModel[]>;

  @novelDataModule.State("_loading")
  loading!: boolean;

  mounted(): void {
    this.setActiveView(this.novelItemKey); // TODO: Move this to link click
    this.loadNovelItems({
      view: this.novelItemKey,
      novelId: this.$route.params.id,
    });
  }

  @applicationStateModule.Action
  setActiveView!: (view: PARENT_ITEM_KEYS) => Promise<void>;

  @novelDataModule.Action
  loadNovelItems!: ({
    view: PARENT_ITEM_KEYS,
    novelId: number,
  }) => Promise<void>;

  get items(): BaseModel[] {
    return this.novelItems.get(this.novelItemKey) || [];
  }

  set items(value: BaseModel[]) {
    this.$store.dispatch("updateOrder", {
      key: this.novelItemKey,
      novelId: this.$store.getters.openNovelId,
      newOrder: value,
    });
  }
}
</script>

<style scoped>
.grouping-item-view {
  width: 100%;
  height: 100%;
  display: flex;
}

.submenu {
  flex-grow: 0;
  justify-content: center;
  width: 5rem;
  height: 100%;
  z-index: 1;

  border-bottom: 1px solid rgba(0, 0, 0, 0.63);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5);
  -webkit-box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5);
  -moz-box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5);
}

.content-view {
  flex-grow: 1;
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
