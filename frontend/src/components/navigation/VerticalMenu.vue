<template>
    <div class="vertical-menu">
        <Navlink v-for="menuItem in menuItems" :key="menuItem.label" :menuItem="menuItem"></Navlink>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { MenuModel } from '@/models/Menu.model'
import Navlink from '@/components/navigation/Navlink.vue'


@Options({
    components: { Navlink }
})
export default class VerticalMenu extends Vue {
    @Prop() menuItems: MenuModel[];
}
</script>

<style scoped>
.vertical-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 45m;
  flex-shrink: 0;
  background: var(--tabmenu-background);
  border-right: 3px solid #2d2b2b;
}

</style>
