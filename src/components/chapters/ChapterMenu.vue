<template>
    <div class="menu">
      <Button type="button" @click="toggle" class="p-button-raised p-button-rounded" icon="fa fa-bars"/>
      <Menu ref="menu" :model="menuItems" :popup="true"/>
      <ConfirmDialog ref="confirm" @accept="deleteSelected" message="Are you sure you want to delete the selected chapters?"></ConfirmDialog>
  </div>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { ChapterModel } from '@/models/Chapter.model';
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import { NOVEL_ITEM_KEYS } from '@/store/keys';
@Options({
  components: { ConfirmDialog }
})
export default class ChapterMenu extends Vue {
  addChapter(): void {
    this.$store.dispatch('addItem', { 
      key: NOVEL_ITEM_KEYS.CHAPTERS, 
      novelId: this.$store.state.currentNovel?.id, 
      item: new ChapterModel() 
    });
  }

  toggle(event: Event): void {
    (this.$refs.menu as any).toggle(event);
  }

  deleteSelected(): void {
    this.$store.dispatch('deleteItems', { 
      key: NOVEL_ITEM_KEYS.CHAPTERS, 
      novelId: this.$store.state.currentNovel?.id,
      items: this.$store.getters.currentChapters
    })
  }
 
  get menuItems(): Array<{ label: string, icon: string, command: () => void}> {
    return [
      this.getAddMenuItem(),
      this.getDeleteMenuItem()
    ] 
  }

  private getAddMenuItem() {
    return {
      label: 'Add chapter',
      icon: 'fa fa-plus',
      command: () => {
        this.addChapter();
      }
    }
  }

  private getDeleteMenuItem() {
    return {
      label: 'Delete selected',
      icon: 'fa fa-trash',
      disabled: this.$store.getters.currentChapters.length === 0,
      command: () => {
        const selectedItems = this.$store.getters.currentChapters;
        if (!selectedItems.length) {
            this.$toast.add({severity:'error', summary: 'Action not possible', detail:'No chapters have been selected', life: 3000});
        } else {
          (this.$refs.confirm as ConfirmDialog).getDecision();
        }          
      }
    }
  }
}
</script>



<style scoped>
  .menu {
    position:fixed;
    bottom: 20px; 
    left: 20px;
    display: flex;
    width: 20em;
    height: 2.3em;
  }

  .menu Button {
    margin-right: 1em;
  }
</style>