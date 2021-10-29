<template>
    <Button type="button"
        :title="title"
        :class="cssClass"
        :icon="icon"
        :label="label"
        @click="click($event)" />
</template>


<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Emit, Prop } from "vue-property-decorator";
@Options({
    emits: ['click']
})
export default class Button extends Vue {
    @Prop() icon: string;
    @Prop() title: string;
    @Prop() label : string;
    @Prop() color: 'primary' | 'secondary' | 'danger' | 'success' = 'primary';

    @Emit('click') 
    click($event) {
        return $event;
    }

    get cssClass() {
        return `p-button-${this.color}`;
    }
}
</script>

<style>
.p-button {
    border-radius: 0 !important;
    min-width: 2.5em;
}
</style>