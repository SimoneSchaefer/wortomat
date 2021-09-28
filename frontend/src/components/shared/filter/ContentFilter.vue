<template>
  <Button type="button" @click="toggle" class="p-button-text p-button-secondary" icon="fa fa-eye" label="View" />
  <OverlayPanel ref="overlay">
      <Menu :model="menuItems"/>
  </OverlayPanel>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { NOVEL_ITEM_KEYS, VIEWS } from '@/store/keys';

import OverlayPanel from 'primevue/overlaypanel';
@Options({
  components: { }
})
export default class ContentFitler extends Vue { 
  @Prop() novelItemKey: NOVEL_ITEM_KEYS;

  toggle(event: Event): void {
    (this.$refs.overlay as OverlayPanel).toggle(event);
  }
 
  get menuItems(): Array<{ label: string, icon: string, command: () => void }> {
    return [
        this.getViewMenuItem(VIEWS.SUMMARY),
        this.getViewMenuItem(VIEWS.EXTENDED_SUMMARY),
        this.getViewMenuItem(VIEWS.TAGS),
        this.getViewMenuItem(VIEWS.CONTENT)
    ] 
  }

  private getViewMenuItem(view: VIEWS) {
    return {
        label: view,
        icon: `fa fa-${this.isEnabled(view) ? 'check-square' : 'minus-square'}`,
        command: () => {
          this.$store.dispatch('setView', { 
            key: this.novelItemKey,
            view: view,
            value: !this.isEnabled(view)
          })
        }
    }
  }

  private isEnabled(view: VIEWS): boolean {
    const currentState = this.$store.state.view.get(this.novelItemKey).get(view);
    if (currentState === undefined) {
      return true;
    }
    return !!currentState;
  }
}
</script>

<style scoped>
button {
    height: 100%;
}
</style>