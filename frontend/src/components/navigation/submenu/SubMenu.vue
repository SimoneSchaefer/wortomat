<template>
    <div class="vertical-menu">
        <button class="navigation-link" :title="$t(`sub_menu.${parentKey}.add`)" @click="addParent">
            <i class="fa fa fa-plus"></i> 
            <span class="sub-link">{{$t(`sub_menu.${parentKey}.add`)}}</span>
        </button>
        <button class="navigation-link" :title="$t(`sub_menu.${parentKey}.display_settings`)" @click="setVisible('display_settings_visible')">
            <i class="fa fa fa-eye"></i>
            <span class="sub-link">{{$t(`sub_menu.${parentKey}.display_settings`)}}</span>
        </button>
        <button class="navigation-link" :title="$t(`sub_menu.${parentKey}.filter`)" @click="setVisible('filter_visible')">
            <i class="fa fa fa-filter"></i>
            <span class="sub-link">{{$t(`sub_menu.${parentKey}.filter`)}}</span>
        </button>
        <button class="navigation-link" :title="$t(`sub_menu.${parentKey}.export`)" @click="setVisible('export_visible')">
            <i class="fa fa fa-file-export"></i>
            <span class="sub-link">{{$t(`sub_menu.${parentKey}.export`)}}</span>
        </button>
    </div>
    <Dialog v-model:visible="sidebarVisible" modal="true" dismissableMask="true">
        <div class="menu-options">
            <DisplaySettingsMenu v-if="display_settings_visible"></DisplaySettingsMenu>
            <FilterMenu v-if="filter_visible"></FilterMenu>
            <ExportMenu v-if="export_visible"></ExportMenu>
        </div>
    </Dialog>
   <!-- <Sidebar v-model:visible="sidebarVisible" position="right">
        <DisplaySettingsMenu v-if="display_settings_visible"></DisplaySettingsMenu>
        <FilterMenu v-if="filter_visible"></FilterMenu>
        <ExportMenu v-if="export_visible"></ExportMenu>
    </Sidebar>-->
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';
import Navlink from '@/components/navigation/Navlink.vue'
import DisplaySettingsMenu from '@/components/navigation/submenu/DisplaySettingsMenu.vue'
import FilterMenu from '@/components/navigation/submenu/FilterMenu.vue'
import ExportMenu from '@/components/navigation/submenu/ExportMenu.vue'
import { PARENT_ITEM_KEYS } from '@/store/keys';
import { BaseModel } from '@/models/Base.model';
import NovelItemKeyAwareMixin from '../../mixins/NovelItemKeyAwareMixin';
import { namespace } from 's-vuex-class';


type visible_flags = '' | 'filter_visible' | 'export_visible' | 'display_settings_visible';
const novelDataModule = namespace("novelData");

@Options({
    components: { Navlink, DisplaySettingsMenu, FilterMenu, ExportMenu }
})
export default class SubMenu extends mixins(NovelItemKeyAwareMixin) {

    @novelDataModule.Action
    addNovelItem!: (payload: { view: PARENT_ITEM_KEYS, novelItem: BaseModel}) => Promise<void>;
  
    filter_visible = false;
    export_visible = false;
    display_settings_visible = false;

    setVisible(flag: visible_flags) {
        this.setAllInvisible();
        this[flag] = true;
    }

    get sidebarVisible() {
        return this.filter_visible || this.export_visible || this.display_settings_visible;
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
        this.addNovelItem({ view: this.parentKey, novelItem: new BaseModel()});
    }
}
</script>

<style >
.p-sidebar.p-sidebar-active.p-sidebar-right {
    right: 80px;
}

.p-dialog-header {
    justify-content: right !important;
}
</style>

<style scoped>
.vertical-menu {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 3em;
  flex-shrink: 0;
  /*background: var(--tabmenu-background);*/
  background-color: #d2d2d2;
  z-index: 1102;
}

.menu-options {
    min-width:50em;
    min-height: 30em;
}

.navigation-link{
    margin-left: 1em;
    height: 5em;
    font-size: 1rem;
    /*width: 5em !important;*/
    display: flex;
    justify-content: center;
    align-items: center;
    color: #2b2b2ba4;
    border: none;
    text-decoration: none;
    background: transparent
}

.navigation-link.active {
    color: rgb(36, 36, 36);
}
.navigation-link:hover {
    color: rgb(36, 36, 36);
    cursor: pointer;
}

.sub-link {
    margin-left: 0.5em;
}

.vertical-menu .p-button.p-button-secondary, 
.vertical-menu .p-buttonset.p-button-secondary > .p-button, 
.vertical-menu .p-splitbutton.p-button-secondary > .p-button {
  background-color: transparent;
  border: none;
  border-bottom: 1px solid #2d2b2b;
}


.toggle-switch {
    line-height: 3.0em;
    display: flex;
    align-items: center;
}

.toggle-switch .label {
    margin-left: 1em;;
}
</style>
