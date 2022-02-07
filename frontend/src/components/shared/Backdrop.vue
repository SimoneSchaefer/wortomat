<template>
    <div class="backdrop" v-if="modalOpen"></div>
</template>


<script lang="ts">

import { namespace } from "s-vuex-class";
import { Options, Vue } from "vue-class-component";

const applicationStateModule = namespace("applicationState");

@Options({})  
export default class Backdrop extends Vue {
    @applicationStateModule.State('_modalOpen')
    modalOpen!: boolean;   
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