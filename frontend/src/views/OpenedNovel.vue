<template>
  <div class="opened-novel">
    <VerticalMenu :menuItems="menuItems"></VerticalMenu>    
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import VerticalMenu from '@/components/navigation/VerticalMenu.vue';
import { MenuModel } from '@/models/Menu.model';

@Options({
  components: { VerticalMenu }
})
export default class OpenedNovel extends Vue {
  mounted(): void {
    this.$store.dispatch('openNovel', this.$route.params.id) 
  }

  get menuItems(): Array<MenuModel> {
    return [
      {label: 'home', icon: 'fa fa-book', to: '/'},
      {label: 'timeline', icon: 'fa fa-clock', to: 'plot'},
      {label: 'chapters', icon: 'fa fa-book-open', to: 'chapters'},
      {label: 'characters', icon: 'fa fa-users', to: 'characters'},
      {label: 'research', icon: 'fa fa-flask', to: 'research'},
      {label: 'export', icon: 'fa fa-file-export', to: 'export'},
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