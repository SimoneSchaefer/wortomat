<template>
  <div class="sub-menu">
    <div class="mutation-options">
      <SubMenuLink
        class="add"
        icon="plus"
        :title="`sub_menu.${parentKey}.add`"
        @click="addParent"
      ></SubMenuLink>

      <div class="trash" :title="$t(`sub_menu.${parentKey}.trash`)">
        <draggable
          :list="[]"
          class="dropzone trashzone"
          :group="{ name: 'trash', put: () => true }"
        >
          <i class="fa fa-2x fa-trash-alt"></i>
        </draggable>
      </div>
    </div>

    <div class="option-list">
      <SubMenuLink
        class="setting" v-bind:class="{ 'filter-active': tagFilterEnabled || statusFilterEnabled}"
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

  <!--
    <Dialog v-model:visible="sidebarVisible" :modal="true" :dismissableMask="true">
        <div class="menu-options">
            <DisplaySettingsMenu v-if="display_settings_visible"></DisplaySettingsMenu>
            <FilterMenu v-if="filter_visible"></FilterMenu>
            <ExportMenu v-if="export_visible"></ExportMenu>
        </div>
    </Dialog>-->
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
  },
})
export default class SubMenu extends mixins(
  NovelItemKeyAwareMixin,
  FilterAwareMixin
) {
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
    this.addNovelItem({ view: this.parentKey, novelItem: new BaseModel() });
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








/*

.trash {
	background:#ff6873;
	width: 4em;
	height: 4em;
	display: inline-block;
	margin:0 auto;
	
	position: relative;
	-webkit-border-bottom-right-radius: 6px;
	-webkit-border-bottom-left-radius: 6px;
	-moz-border-radius-bottomright: 6px;
	-moz-border-radius-bottomleft: 6px;
	border-bottom-right-radius: 6px;
	border-bottom-left-radius: 6px;
}
.trash:after {
	content: 'Mouse hover on Recile Bin';
	position: absolute;
	left: -99px;
	right: 0;
	bottom: -50px;
	width: 300px;
}
.trash span {
	position: absolute;
	height: 12px;
	background: #ff6873;
	top: -19px;
	left: -10px;
	right: -10px;
	
	border-top-left-radius: 10px;
	border-top-right-radius: 10px;
	transform: rotate(0deg);
	transition: transform 250ms;
	transform-origin: 19% 100%;
}
.trash span:after {
	content: '';
	position: absolute;
	width: 27px;
	height: 7px;
	background: #ff6873;
	top: -10px;
	
	border-top-left-radius: 10px;
	border-top-right-radius: 10px;
	transform: rotate(0deg);
	transition: transform 250ms;
	transform-origin: 19% 100%;
	left: 27px;
}


.trash i {
	position:relative;
	width: 5px;
	height:50px;
	background:#fff;
	display:block;
	margin:14px auto;
	border-radius: 5px;
}
.trash i:after {
	content: '';
	width: 5px;
	height: 50px;
	background: #fff;
	position: absolute;
	left: -18px;
	border-radius: 5px;
}
.trash i:before {
	content: '';
	width: 5px;
	height: 50px;
	background: #fff;
	position: absolute;
	right: -18px;
	border-radius: 5px;
}

.trash:hover span {
	transform: rotate(-45deg);
	transition: transform 250ms;
}*/















.trash {
  background-color: rgb(173, 35, 35);
  color: #efefef;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  width: 4rem;
  height: 4rem;
}

.trash:hover {
  color: white;
  background-color: rgb(224, 48, 48);
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
