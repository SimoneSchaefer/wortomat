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
    console.log('OPEN NOVEL', this.$route.params.id)
    this.$store.dispatch('openNovel', this.$route.params.id) 
  }

  get menuItems(): Array<MenuModel> {
    return [
      {label: 'Home', icon: 'fa fa-home', to: '/'},
      {label: 'Timeline', icon: 'fa fa-clock', to: 'plot'},
      {label: 'Chapters', icon: 'fa fa-book', to: 'chapters'},
      {label: 'Characters', icon: 'fa fa-users', to: 'characters'},
      {label: 'Research', icon: 'fa fa-flask', to: 'research'},
      {label: 'Export', icon: 'fa fa-file-export', to: 'export'},
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