<template>
  <div id="nav">
    <TabMenu :model="menuItems" />    
  </div>
  <div class="wrapper">
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component';
export default class OpenedNovel extends Vue {
  mounted(): void {
    this.$store.dispatch('openNovel', this.$route.params.id) 
  }

  get menuItems(): Array<{ label: string, icon: string, to: string}> {
    return [
      {label: 'Home', icon: 'fa fa-home', to: '/'},
      {label: 'Chapters', icon: 'fa fa-book', to: 'chapters'},
      {label: 'Tags', icon: 'fa fa-tags', to: 'tags'},
      {label: 'Export', icon: 'fa fa-file-export', to: 'export'}
    ]
  }
}
</script>

<style scoped>
  .wrapper {
    height: calc(100vh - 70px);
    overflow: hidden;
  }
</style>
