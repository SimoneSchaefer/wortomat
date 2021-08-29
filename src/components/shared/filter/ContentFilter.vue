<template>
    <Button type="button" @click="toggle" class="p-button-text" icon="fa fa-eye"/>
    <OverlayPanel ref="overlay">
        <Menu :model="menuItems"/>
    </OverlayPanel>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import { NOVEL_ITEM_KEYS, VIEWS } from '@/store/keys';
import OverlayPanel from 'primevue/overlaypanel';
@Options({
  components: { ConfirmDialog }
})
export default class ChapterMenu extends Vue { 

  toggle(event: Event): void {
    (this.$refs.overlay as OverlayPanel).toggle(event);
  }

  deleteSelected(): void {
    this.$store.dispatch('deleteItems', { 
      key: NOVEL_ITEM_KEYS.CHAPTERS, 
      novelId: this.$store.state.currentNovel?.id,
      items: this.$store.getters.currentChapters
    })
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
        icon: `fa fa-${this.$store.state.view.get(view) ? 'check-square' : 'minus-square'}`,
        command: () => {
          this.$store.dispatch('setView', { 
            view: view,
            value: !this.$store.state.view.get(view)
          })
        }
    }
  }
}
</script>

<style scoped>
button {
    height: 100%;
}
</style>