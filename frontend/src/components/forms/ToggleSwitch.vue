<template>
    <div class="toggle-switch">
        <InputSwitch v-bind:modelValue="enabled" @input="toggle($event)"></InputSwitch>
        <div class="label" @click="toggle(!enabled)">{{ $t(label) }}</div>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';

@Options({
    emits: [ 'toggle'],
})
export default class ToggleSwitch extends Vue {
    @Prop() label: string;
    @Prop() enabled: boolean;

    @Emit('toggle')
    toggle($event: boolean) {
        return $event;
    }
 }
</script>

<style scoped>
.toggle-switch {
    line-height: 3.0em;
    display: flex;
    align-items: center;
}

.toggle-switch .label {
    margin-left: 1em;;
}
.toggle-switch .label:hover {
    cursor: pointer;
}
</style>