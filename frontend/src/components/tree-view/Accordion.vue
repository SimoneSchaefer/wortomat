<template>
    <div class="accordion-header">
        <div class="toggle-button fa"  v-bind:class="{ 'fa-chevron-down': open, 'fa-chevron-right': !open }" @click="toggle"></div>
        <slot name="header"></slot>
    </div>
    <div v-if="open">
        <slot name="content"></slot>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';

@Options({
  components: {},
  emits: ['toggle']
})
export default class Accordion extends Vue {
    @Prop() open: boolean;

    @Emit('toggle')
    toggle() {
        return !this.open;
    }
}
</script>


<style scoped>
.accordion-header {
  display: flex;
  width: 100%;
  align-items: center;
  font-weight: 600;
  background: var(--middle-background);
  border-bottom: 1px solid rgba(53, 53, 53, 0.178);
  border-top: 1px solid rgba(53, 53, 53, 0.178);
  padding-right:1em;
  border-right: 1px solid rgba(80, 80, 80, 0.39);
}

.accordion-header .group-options {
  display: flex; 
}

.toggle-button {
    padding: 1em;
}

.toggle-button:hover {
    cursor: pointer;
}
</style>
