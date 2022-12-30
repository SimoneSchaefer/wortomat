<template>
  <div class="sub-menu">
    <div class="mutation-options">
      <SubMenuLink
        class="add"
        icon="plus"
        :title="`sub_menu.${parentKey}.add`"
        @click="addParent"
      ></SubMenuLink>

      <div class="trash-menu">
        <TrashButton></TrashButton>
      </div>
    </div>

    <div v-if="displayOptions" class="option-list">
      <SubMenuLink
        class="setting"
        v-bind:class="{
          'filter-active': tagFilterEnabled || statusFilterEnabled,
        }"
        icon="filter"
        :title="`sub_menu.${parentKey}.filter`"
        @click="setVisible('filter_visible')"
      ></SubMenuLink>
      <SubMenuLink
        class="setting"
        icon="eye"
        :title="`sub_menu.${parentKey}.display_settings`"
        @click="setVisible('display_settings_visible')"
      ></SubMenuLink>
      <SubMenuLink
        class="setting"
        icon="print"
        :title="`sub_menu.${parentKey}.export`"
        @click="setVisible('export_visible')"
      ></SubMenuLink>
    </div>

    <Sidebar
      v-model:visible="sidebarVisible"
      :modal="true"
      position="left"
      :showCloseIcon="true"
    >
      <DisplaySettingsMenu
        v-if="display_settings_visible"
      ></DisplaySettingsMenu>
      <FilterMenu v-if="filter_visible"></FilterMenu>
      <ExportMenu v-if="export_visible"></ExportMenu>
    </Sidebar>
  </div>
</template>

<script lang="ts">
import { mixins, Options } from "vue-class-component";
import Navlink from "@/components/navigation/Navlink.vue";
import DisplaySettingsMenu from "@/components/navigation/submenu/DisplaySettingsMenu.vue";
import FilterMenu from "@/components/navigation/submenu/FilterMenu.vue";
import ExportMenu from "@/components/navigation/submenu/ExportMenu.vue";
import { PARENT_ITEM_KEYS } from "@/store/keys";
import { BaseModel } from "@/models/Base.model";
import NovelItemKeyAwareMixin from "../../mixins/NovelItemKeyAwareMixin";
import { namespace } from "s-vuex-class";
import WConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import FilterAwareMixin from "@/components/mixins/FilterAwareMixin";
import SubMenuLink from "./SubMenuLink.vue";
import TrashButton from "./TrashButton.vue";
import { Prop } from "vue-property-decorator";

type visible_flags =
  | ""
  | "filter_visible"
  | "export_visible"
  | "display_settings_visible";
const novelDataModule = namespace("novelData");
const selectionModule = namespace("selection");

@Options({
  components: {
    Navlink,
    DisplaySettingsMenu,
    FilterMenu,
    ExportMenu,
    WConfirmDialog,
    SubMenuLink,
    TrashButton,
  },
})
export default class SubMenu extends mixins(
  NovelItemKeyAwareMixin,
  FilterAwareMixin
) {
  trashHovered = false;

  @Prop()
  createModel?: () => BaseModel;

  @Prop()
  displayOptions: boolean;

  @novelDataModule.Action
  deleteMultipleNovelItems!: (payload: {
    view: PARENT_ITEM_KEYS;
    novelItemIds: number[];
  }) => Promise<void>;

  @selectionModule.State("_selectedItemIds")
  _selectedItemIds!: Record<PARENT_ITEM_KEYS, number[]>;

  @novelDataModule.Action
  addNovelItem!: (payload: {
    view: PARENT_ITEM_KEYS;
    novelItem: BaseModel;
  }) => Promise<void>;

  filter_visible = false;
  export_visible = false;
  display_settings_visible = false;

  setVisible(flag: visible_flags) {
    this.setAllInvisible();
    this[flag] = true;
  }

  get sidebarVisible() {
    return (
      this.filter_visible ||
      this.export_visible ||
      this.display_settings_visible
    );
  }

  set sidebarVisible(_value: boolean) {
    this.setAllInvisible();
  }

  setAllInvisible() {
    this.filter_visible = false;
    this.export_visible = false;
    this.display_settings_visible = false;
  }

  addParent(): void {
    this.addNovelItem({ view: this.parentKey, novelItem: this.createModel? this.createModel() : new BaseModel() });
  }

  confirmDeleteSelected($event): void {
    $event.stopPropagation();
    (this.$refs.confirmDeleteSelected as WConfirmDialog).getDecision();
  }
}
</script>

<style >
.p-sidebar.p-sidebar-active.p-sidebar-top {
  top: 8rem;
  height: auto !important;
}

.p-dialog-header {
  justify-content: right !important;
}
</style>

<style scoped>
.sub-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 5rem;
  height: 100%;
  flex-shrink: 0;
  background: var(--middle-dark-background);
  z-index: 1102;
}

.sub-menu .option-list {
  margin: 1rem 0;
}

.trash-menu {
  position: relative;
}

.add {
  background-color: rgb(80, 80, 248);
  color: #efefef;
}

.add:hover {
  color: white;
  background-color: rgb(47, 47, 228);
}

.setting {
  color: white;
  background-color: rgba(153, 153, 153, 0.466);
}

.setting:hover {
  color: white;
  background-color: rgba(206, 206, 206, 0.466);
}

.setting.filter-active {
  color: #495057;
  background-color: rgb(202, 230, 255);
}

.mutation-options {
  margin: 1rem 0;
}

.toggle-switch {
  line-height: 3em;
  display: flex;
  align-items: center;
}

.toggle-switch .label {
  margin-left: 1em;
}
</style>
