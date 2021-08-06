<template>
  <router-view></router-view>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

@Options({})
export default class OpenedNovel extends Vue {
  mounted() {
    this.$store.dispatch('openNovel', this.$route.params.id) 
  }
}
</script>
