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
  mounted() {
    this.$store.dispatch('openNovel', this.$route.params.id) 
  }

  get menuItems() {
    return [
      {label: 'Home', icon: 'fa fa-home', to: '/'},
      {label: 'Chapters', icon: 'fa fa-book', to: 'chapters'},
      {label: 'Characters', icon: 'fa fa-users', to: 'characters'}
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
