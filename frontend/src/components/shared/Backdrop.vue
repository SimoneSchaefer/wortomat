<template>
    <div class="backdrop" v-if="modalIsOpen"></div>
</template>


<script lang="ts">
import { Options, Vue } from "vue-class-component";

@Options({})  
export default class Backdrop extends Vue {
    get modalIsOpen(): boolean {
        return this.$store.state.modalIsOpen;
    }
}
</script>

<style scoped>
div.backdrop {
    background-color: rgba(0, 0, 0, 0.404);
    position: fixed; 
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    z-index: var(--z-modal-backdrop);
}
</style>