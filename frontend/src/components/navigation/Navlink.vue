<template>

    <router-link :to="menuItem.to"
        v-slot="{ href, isActive }" >
        <div class="navigation-link" :class="{ active: isActive }" :title="$t(`vertical_menu.${menuItem.label}`)" :href="href">
            <i v-bind:class="getIconClass(isActive)"></i> 
            <span class="navigation-link-label">{{ $t(`vertical_menu.${menuItem.label}`) }}</span>
        </div>
    </router-link>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { MenuModel } from '@/models/Menu.model'

export default class Navlink extends Vue {
    @Prop() menuItem: MenuModel;

    getIconClass( isActive: boolean): string {
        return `fa fa-icon ${this.menuItem.icon} ${isActive ? 'fa-2x' : 'fa'}`;
    }
}
</script>

<style scoped>
.navigation-link{
  display: flex;
  justify-content: center;
  align-items: center;
  color: #efefef7e;
  text-decoration: none;
  padding: 0 1em;
}

.navigation-link-label {
    margin-left: 0.5em;
    font-weight: bold;
    text-transform: uppercase;

}

.navigation-link.active {
    color: white;
}
.navigation-link:hover {
    color: white;
}

.vertical-menu .p-button.p-button-secondary, 
.vertical-menu .p-buttonset.p-button-secondary > .p-button, 
.vertical-menu .p-splitbutton.p-button-secondary > .p-button {
  background-color: transparent;
  border: none;
  border-bottom: 1px solid #2d2b2b;
}



</style>