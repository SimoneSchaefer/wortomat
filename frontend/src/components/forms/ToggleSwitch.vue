<template>
    <InputSwitch v-bind:modelValue="enabled" @input="toggle($event)"></InputSwitch>
    <div class="label" @click="toggle(!enabled)">{{ $t(label) }}</div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';

import Navlink from '@/components/navigation/Navlink.vue'
import DisplaySettingsMenu from '@/components/navigation/submenu/DisplaySettingsMenu.vue'

@Options({
    emits: [ 'toggle'],
    components: { Navlink, DisplaySettingsMenu }
})
export default class FilterMenu extends Vue {
    @Prop() label: string;
    @Prop() enabled: boolean;

    @Emit('toggle')
    toggle($event: boolean) {
        return $event;
    }
 }
</script>

<style scoped>
.label {
    margin-left: 1em;
}

.label:hover {
    cursor: pointer;
}
</style>