<template>
  <div class="opened-novel">
    <MainMenu></MainMenu>    
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { namespace } from 's-vuex-class';

import MainMenu from '@/components/navigation/MainMenu.vue';
import { MenuModel } from '@/models/Menu.model';

const novelDataModule = namespace("novelData");

@Options({
  components: { MainMenu }
})
export default class OpenedNovel extends Vue {
  mounted(): void {
    this.openNovel(Number(this.$route.params.id));
    this.loadSettings();
  }

  @novelDataModule.Action
  openNovel: (novelId: number) => Promise<void>;


  @novelDataModule.Action
  private loadSettings!: () => Promise<void>;

  get menuItems(): Array<MenuModel> {
    return [
      { label: 'home', icon: 'fa fa-book', to: '/' },
      { label: 'chapters', icon: 'fa fa-book-open', to: 'chapters' },
      { label: 'characters', icon: 'fa fa-users', to: 'characters' },
      { label: 'research', icon: 'fa fa-flask', to: 'research' },
      { label: 'location', icon: 'fa fa-map', to: 'location' },
      { label: 'timeline', icon: 'fa fa-clock', to: 'plot' },
    ]
  }
}
</script>

<style scoped>
.opened-novel {
  height: 100vh; 
  display: flex;
  flex-direction: column;
}
</style>