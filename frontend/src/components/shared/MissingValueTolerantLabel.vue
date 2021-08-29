<template>
    <span v-bind:class="{ dummy: !hasValue}" >{{ displayValue }}</span>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
export default class MissingValueTolerantLabel extends Vue {
    @Prop() value!: string;
    @Prop() fallback!: string;

    get displayValue(): string {
        return (this.hasValue ? this.value : this.fallback); 
    }

    get fallbackValue(): string {
        return this.fallback?.length ? this.fallback : 'No content yet';
    }

    get hasValue(): boolean {
        return !!this.value && (this.value.length > 0);
    }
}
</script>


<style scoped>
.dummy {
    color: rgba(128, 128, 128, 0.5);
}
</style>