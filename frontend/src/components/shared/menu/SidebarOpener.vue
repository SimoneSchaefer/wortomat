<template>
    <WButton class="w-sidebar-opener" color="primary" title="side_bar.add_item" icon="fa fa-2x fa-bars" @click="click" />
</template>


<script lang="ts">
import { Options, Vue } from "vue-class-component";
import WButton from '@/components/forms/Button.vue';
import { Emit } from "vue-property-decorator";

@Options({
  components: { WButton },
  emits: [ 'click']
})
export default class WSidebarOpener extends Vue {
    @Emit('click') 
    click($event) {
        return $event;
    }
}
</script>

<style scoped>
.w-sidebar-opener {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 5em !important;
    height: 5em;
    z-index: 10;
    border-left: 1px solid #1a1a1a;
    display: flex;
    margin: auto 0;
    background-color: transparent !important;
    border: 0px !important;
    border-top: 1px solid gray !important;
}
</style>