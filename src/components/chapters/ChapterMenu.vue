<template>
    <div class="menu">
      <Button type="button" @click="toggle" class="p-button-raised p-button-rounded" icon="fa fa-bars"/>
      <Menu ref="menu" :model="menuItems" :popup="true"/>
  </div>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { ChapterModel } from '@/models/Chapter.model';
import { NOVEL_ITEM_KEYS, VIEWS } from '@/store/keys';
@Options({
  components: {  }
})
export default class ChapterMenu extends Vue {
  addChapter() {
    this.$store.dispatch('addItem', { 
      key: NOVEL_ITEM_KEYS.CHAPTERS, 
      novelId: this.$store.state.currentNovel?.id, 
      item: new ChapterModel() 
    });
  }

  toggle(event) {
    (this.$refs.menu as any).toggle(event);
  }
 
  get menuItems() {
    return [{
      label: 'Modify',
      items: [
        {
            label: 'Add chapter',
            icon: 'fa fa-plus',
            command: () => {
              this.addChapter();
            }
        },
        {
            label: 'Delete selected',
            icon: 'fa fa-trash',
            command: () => {
                const selectedItems = this.$store.getters.currentChapters;
                if (!selectedItems.length) {
                    this.$toast.add({severity:'error', summary: 'Action not possible', detail:'No chapters have been selected', life: 3000});
                } else {
                    this.$confirm.require({
                        message: 'Are you sure you want to proceed?',
                        header: 'Confirmation',
                        icon: 'pi pi-exclamation-triangle',
                        accept: () => {
                            this.$store.dispatch('deleteItems', { 
                              key: NOVEL_ITEM_KEYS.CHAPTERS, 
                              novelId: this.$store.state.currentNovel?.id,
                              items: this.$store.getters.currentChapters
                            })
                        }
                    })
                }
              
            }
        }
      ]}, {
      label: 'View', 
      items: [
        this.getViewMenuItem(VIEWS.SUMMARY),
        this.getViewMenuItem(VIEWS.EXTENDED_SUMMARY),
        this.getViewMenuItem(VIEWS.TAGS),
        this.getViewMenuItem(VIEWS.CONTENT),
      ]
    }] 
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