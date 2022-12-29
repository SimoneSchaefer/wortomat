<template>
    <Rating v-model="status" :stars="5" onIcon="pi pi-heart-fill" offIcon="pi pi-heart" cancelIcon="pi pi-times"/>
</template>
  
<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Emit, Prop } from "vue-property-decorator";

@Options({
    components: {},
    emits: ['select-status']
})
export default class Status extends Vue {
    @Prop()
    selected: number | undefined;

    get status() {
        return this.selected;
    }

    set status(status: number) {
        this.selectStatus(status);
    }

    @Emit('select-status')
    selectStatus(status: number) {       
        return status;
    }


}

</script>
  
  
<style scoped>

</style>