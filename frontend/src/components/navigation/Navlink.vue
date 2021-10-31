<template>
    <router-link
        :to="menuItem.to"
        v-slot="{ href, isActive }" >
        <a class="navigation-link" :class="{ active: isActive }" :title="menuItem.label" :href="href">
            <i v-bind:class="getIconClass(isActive)"></i>
        </a>
    </router-link>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { MenuModel } from '@/models/Menu.model'

export default class Navlink extends Vue {
    @Prop() menuItem: MenuModel;

    getIconClass( isActive: boolean): string {
        return `fa fa-icon ${this.menuItem.icon} ${isActive ? 'fa-3x' : 'fa-2x'}`;
    }
}
</script>

<style scoped>

.navigation-link{
  height: 5em;
  width: 5em !important;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #efefef7e;
  border-bottom: 1px solid #efefef7e;
  text-decoration: none;
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