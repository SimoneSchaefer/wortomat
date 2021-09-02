<template>
    <Button type="button" @click="toggle" class="p-button-text" icon="fa fa-eye"/>
    <OverlayPanel ref="overlay">
        <Menu :model="menuItems"/>
    </OverlayPanel>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { NOVEL_ITEM_KEYS, VIEWS } from '@/store/keys';
import OverlayPanel from 'primevue/overlaypanel';
import { Prop } from 'vue-property-decorator';
@Options({
  components: { }
})
export default class ContentFitler extends Vue { 
  @Prop() itemKey: NOVEL_ITEM_KEYS;

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
            key: this.itemKey,
            view: view,
            value: !this.isEnabled(view)
          })
        }
    }
  }

  private isEnabled(view: VIEWS): boolean {
    const currentState = this.$store.state.view.get(this.itemKey).get(view);
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