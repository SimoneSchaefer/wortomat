<template>
    <div class="speed-dial">
      <SpeedDial showIcon="fa fa-bars" hideIcon="pi pi-times" :radius="100" direction="up-right" type="quarter-circle" :model="menuItems" />     
  </div>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { ChapterModel } from '@/models/Chapter.model';
import { SELECTION_KEYS } from '@/store/store.helper';
@Options({
  components: {  }
})
export default class ChapterMenu extends Vue {

  addChapter() {
    const chapter = new ChapterModel();
    const novelId = this.$store.getters.openNovelId;
    chapter.novelId = novelId;
    const chapters = this.$store.state.currentNovel?.chapters || [];
    const maxOrder = Math.max.apply(Math, chapters.map(function(o) { return o.order; }))
    chapter.order = maxOrder;
    this.$store.dispatch('addItem', { key: SELECTION_KEYS.CHAPTERS, novelId: novelId, item: chapter });
  }
  get menuItems() {
    return [
    
    {
        label: 'Delete',
        icon: 'fa fa-trash',
        command: () => {
            const selectedItems = this.$store.getters.currentChapters;
            if (!selectedItems.length) {
                console.log('not possible')
                this.$toast.add({severity:'error', summary: 'Action not possible', detail:'No chapters have been selected', life: 3000});
            } else {
                this.$confirm.require({
                    message: 'Are you sure you want to proceed?',
                    header: 'Confirmation',
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.$store.dispatch('deleteItems', { key: SELECTION_KEYS.CHAPTERS, items: this.$store.getters.currentChapters} )
                    }
                })
            }
           
        }
    }, {
        label: 'Add',
        icon: 'fa fa-plus',
        command: () => {
          this.addChapter();
        }
    },
    ] 
  }
}
</script>



<style scoped>
  .speed-dial {
    position:fixed;
    width:64px;
    height:64px; 
    bottom: 20px; 
    left: 20px;
  }
</style>