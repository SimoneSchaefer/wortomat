<template>
  <div class="opened-novel">
    <VerticalMenu :menuItems="menuItems"></VerticalMenu>    
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { namespace } from 's-vuex-class';

import VerticalMenu from '@/components/navigation/VerticalMenu.vue';
import { MenuModel } from '@/models/Menu.model';

const novelDataModule = namespace("novelData");

@Options({
  components: { VerticalMenu }
})
export default class OpenedNovel extends Vue {
  mounted(): void {
    this.openNovel(Number(this.$route.params.id));
  }

  @novelDataModule.Action
  openNovel: (novelId: number) => Promise<void>;

  get menuItems(): Array<MenuModel> {
    return [
      { label: 'home', icon: 'fa fa-book', to: '/' },
      { label: 'chapters', icon: 'fa fa-book-open', to: 'chapters' },
      { label: 'characters', icon: 'fa fa-users', to: 'characters' },
      { label: 'research', icon: 'fa fa-flask', to: 'research' },
      { label: 'location', icon: 'fa fa-map', to: 'location' },
//      { label: 'timeline', icon: 'fa fa-clock', to: 'plot' },
      { label: 'export', icon: 'fa fa-file-export', to: 'export' },
    ]
  }
}
</script>

<style scoped>
.opened-novel {
  height: 100vh; 
  display: flex;
}
</style>