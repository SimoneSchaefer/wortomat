<template>
    <div class="vertical-menu">
        <button class="navigation-link" :title="$t(`sub_menu.add`)" @click="addParent">
            <i class="fa fa-2x fa-plus"></i>
        </button>
        <button class="navigation-link" :title="$t(`sub_menu.display_settings`)" @click="setVisible('display_settings_visible')">
            <i class="fa fa-2x fa-eye"></i>
        </button>
        <button class="navigation-link" :title="$t(`sub_menu.filter`)" @click="setVisible('filter_visible')">
            <i class="fa fa-2x fa-filter"></i>
        </button>
        <button class="navigation-link" :title="$t(`sub_menu.export`)" @click="setVisible('export_visible')">
            <i class="fa fa-2x fa-file-export"></i>
        </button>
    </div>

    <Sidebar v-model:visible="sidebarVisible" position="right">
        <DisplaySettingsMenu v-if="display_settings_visible"></DisplaySettingsMenu>
        <FilterMenu v-if="filter_visible"></FilterMenu>
        <ExportMenu v-if="export_visible"></ExportMenu>
    </Sidebar>
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';
import Navlink from '@/components/navigation/Navlink.vue'
import DisplaySettingsMenu from '@/components/navigation/submenu/DisplaySettingsMenu.vue'
import FilterMenu from '@/components/navigation/submenu/FilterMenu.vue'
import ExportMenu from '@/components/navigation/submenu/ExportMenu.vue'
import {  DISPLAY_SETTINGS_KEYS, NOVEL_ITEM_KEYS, PARENT_ITEM_KEYS } from '@/store/keys';
import { BaseModel } from '@/models/Base.model';
import { DisplaySettingsService } from '@/service/DisplaySettingsService';
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
</style>

<style scoped>
.vertical-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 80px;
  flex-shrink: 0;
  background: var(--tabmenu-background);
  border-left: 3px solid #2d2b2b94;
  z-index: 1102;
}

.navigation-link{
    height: 5em;
    width: 5em !important;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #efefef7e;
    border: none;
    border-bottom: 1px solid #efefef7e;
    text-decoration: none;
    background: transparent
}

.navigation-link.active {
    color: white;
}
.navigation-link:hover {
    color: white;
    cursor: pointer;
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
