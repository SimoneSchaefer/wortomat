<template>
    <div class="spinner" v-if="isLoading()">
        <ProgressSpinner />
    </div> 
</template>    

<script lang="ts">
import { Options, Vue } from "vue-class-component";

@Options({})
export default class Spinner extends Vue {
    isLoading(): boolean {
        return this.$store.state.loading;
    }
}
</script>

<style scoped>
.spinner {
  position: fixed;
  pointer-events: none;
  z-index: 999;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-content: center;
  align-items: center;
  background-color: var(--spinner-background-color);
  opacity: 0.3;
}

.spinner > * {
    pointer-events: none;
}
</style>