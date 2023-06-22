<template>
    <Button type="button"
        :disabled="disabled"
        :title="title ? $t(title) : ''"
        :class="cssClass"
        :icon="icon"
        :label="label ? $t(label) : ''"
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
    @Prop() disabled = false;
    @Prop() color: 'primary' | 'secondary' | 'danger' | 'success';
    @Prop() type: 'button' | 'text';
    @Prop() rounded = false;

    @Emit('click') 
    click($event) {
        return $event;
    }

    get cssClass() {
        return `p-button-${this.type || 'text'} p-button-${this.color || 'primary'} ${this.rounded ? 'p-button-rounded' : ''}`;
    }
}
</script>

<style scoped>
.p-button {
    border-radius: 0;
}
</style>