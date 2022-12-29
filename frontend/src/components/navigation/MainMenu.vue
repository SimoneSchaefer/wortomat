<template>
    <div class="main-menu">
      <div class="tabs">
        <Navlink :menuItem="{ label: 'chapters', to: 'chapters', icon: 'fa fa-book'}"></Navlink>
        <Navlink :menuItem="{ label: 'characters', to: 'characters', icon: 'fa fa-users'}"></Navlink>
        <Navlink :menuItem="{ label: 'research', to: 'research', icon: 'fa fa-flask'}"></Navlink>
        <Navlink :menuItem="{ label: 'location', to: 'location', icon: 'fa fa-map'}"></Navlink>
        <Navlink :menuItem="{ label: 'plotlines', to: 'plot', icon: 'fa fa-clock'}"></Navlink>
      <!--  <Navlink :menuItem="{ label: 'timeline', to: 'timeline', icon: 'fa fa-calendar'}"></Navlink> -->
      </div>
      <div class="home">
        <Navlink :menuItem="{ label: 'home', to: '/', icon: 'fa fa-sign-out-alt'}"></Navlink>
      </div>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import Navlink from '@/components/navigation/Navlink.vue'

@Options({
    components: { Navlink }
})
export default class MainMenu extends Vue {}
</script>

<style scoped>
.main-menu {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  height: 5rem;
  width: 100%;
  flex-shrink: 0;
  flex-grow: 0;
  background: var(--tabmenu-background);
	box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5)  ; 
	-webkit-box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5)  ; 
	-moz-box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5)  ; 
  z-index: 2;
}

.main-menu > div {
  display: flex;
  flex-direction: row;
  align-items: center;
}

</style>
