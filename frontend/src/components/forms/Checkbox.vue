<template>
    <div class="checkbox">
        <Checkbox :binary="true" :name="name" v-bind:modelValue="enabled" @input="toggle($event)"></Checkbox>
        <div class="label" @click="toggle(!enabled)">{{ $t(label) }}</div>
    </div>
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
export default class Checkbox extends Vue {
    @Prop() label: string;
    @Prop() name: string;
    @Prop() value: any;
    @Prop() enabled: boolean;    

    @Emit('toggle')
    toggle($event: boolean) {
        return $event;
    }
 }
</script>

<style scoped>
.checkbox {
    line-height: 2.0em;
    display: flex;
    align-items: center;
}

.checkbox .label {
    margin-left: 1em;;
}
.checkbox .label:hover {
    cursor: pointer;
}
</style>