<template>
    <div class="vertical-menu">
        <button class="navigation-link" :title="$t(`sub_menu.add`)" @click="addParent">
            <i class="fa fa-2x fa-plus"></i>
        </button>
        <button class="navigation-link" :title="$t(`sub_menu.aaa`)" @click="setVisible('display_settings_visible')">
            <i class="fa fa-2x fa-eye"></i>
        </button>
        <button class="navigation-link" :title="$t(`sub_menu.filter`)" @click="setVisible('filter_visible')">
            <i class="fa fa-2x fa-filter"></i>
        </button>
        <button class="navigation-link" :title="$t(`sub_menu.export`)" @click="setVisible('export_visible')">
            <i class="fa fa-2x fa-file-export"></i>
        </button>
  </div>


  <Sidebar v-model:visible="display_settings_visible" position="right">
      <h1>Display settings</h1>
      - coming soon - 
  </Sidebar>

  <Sidebar v-model:visible="filter_visible" position="right">
      <h1>Filter Options</h1>
      - coming soon - 
  </Sidebar>

  <Sidebar v-model:visible="export_visible" position="right">
      <h1>Export Options</h1>
      - coming soon - 
  </Sidebar>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { MenuModel } from '@/models/Menu.model'
import Navlink from '@/components/navigation/Navlink.vue'
import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { BaseModel } from '@/models/Base.model';


type visible_flags = '' | 'filter_visible' | 'export_visible' | 'display_settings_visible';

@Options({
    components: { Navlink }
})
export default class SubMenu extends Vue {
    @Prop() parentKey: NOVEL_ITEM_KEYS;

    filter_visible = false;
    export_visible = false;
    display_settings_visible = false;

    setVisible(flag: visible_flags) {
        this.filter_visible = false;
        this.export_visible = false;
        this.display_settings_visible = false;
        this[flag] = true;
    }


    addParent(): void {
      this.$store.dispatch('addItem', { 
          key: this.parentKey, 
          novelId: this.novelId, 
          item: new BaseModel() 
      });
    }


    get novelId(): number {
        return this.$store.getters.openNovelId;
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

</style>
