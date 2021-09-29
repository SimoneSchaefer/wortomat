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
      {label: 'Characters', icon: 'fa fa-users', to: 'characters'},
      {label: 'Research', icon: 'fa fa-flask', to: 'research'},
      // {label: 'Tags', icon: 'fa fa-tags', to: 'tags'},
      {label: 'Export', icon: 'fa fa-file-export', to: 'export'}
    ]
  }
}
</script>

<style scoped>
  .wrapper {
    height: 100vh;
    overflow: hidden;
  }
</style>

<style>

  #nav .p-tabmenu .p-tabmenu-nav {
    color: var(--tabmenu-font-color);
    background: var(--tabmenu-background);
    padding-top: 0.5em;
    overflow: hidden;
    border: none;
  }

  #nav .p-tabmenu .p-tabmenu-nav .p-tabmenuitem,
  #nav .p-tabmenu .p-tabmenu-nav .p-tabmenuitem .p-menuitem-link {
    background-color: transparent;
    color: var(--tabmenu-font-color);
    font-weight: normal;
    border: none;
  }

  #nav .p-tabmenu .p-tabmenu-nav .p-tabmenuitem .p-menuitem-link {
    padding-bottom: 1.2rem;
  }

  #nav .p-tabmenu .p-tabmenu-nav .p-tabmenuitem.p-highlight,
  #nav .p-tabmenu .p-tabmenu-nav .p-tabmenuitem.p-highlight .p-menuitem-link {
    border-color: transparent;
    color: var(--menu-font-color);
    background: var(--menu-background);
    font-weight: 800;
    box-shadow: none;
  }
</style>
