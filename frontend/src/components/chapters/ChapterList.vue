<template>
  <DragDropList :novelItemKey="itemKey" :selectedItemsKey="'currentChapters'" :filteredItemsKey="'filteredChapters'">
    <template v-slot="slotProps">
      <div class="p-d-flex">
        <div class="title">
          <MissingValueTolerantLabel :value="slotProps.item.title" fallback="No title yet"></MissingValueTolerantLabel>
        </div>
        <div class="summary">
          <MissingValueTolerantLabel :value="slotProps.item.summary" fallback="No summary yet"></MissingValueTolerantLabel>
        </div>
      </div>
      <div class="badges">
        <Badge v-if="getTodoCount(slotProps.item)" :value="getTodoCount(slotProps.item)" severity="warning"></Badge>
        <Badge v-if="getFixmeCount(slotProps.item)" :value="getFixmeCount(slotProps.item)" severity="danger"></Badge>
        <Badge v-if="getIdeaCount(slotProps.item)" :value="getIdeaCount(slotProps.item)" severity="info"></Badge>
      </div>
    </template>
  </DragDropList>


</template>

<script lang="ts">
import { ChapterModel } from '@/models/Chapter.model';
import { Options, Vue } from 'vue-class-component';
import MissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';
import DragDropList from '@/components/shared/lists/DragDropList.vue';
import draggable from 'vuedraggable'
import { NOVEL_ITEM_KEYS } from '@/store/keys';

@Options({
  components: { draggable, MissingValueTolerantLabel, DragDropList}
})
export default class ChapterList extends Vue {
  get itemKey(): NOVEL_ITEM_KEYS {
    return NOVEL_ITEM_KEYS.CHAPTERS;
  }

  getTodoCount(chapter: ChapterModel): number {
    return this.getMarkerCount(chapter, 'yellow')
  }  
  
  getFixmeCount(chapter: ChapterModel): number {
    return this.getMarkerCount(chapter, '#D32F2F')
  }

  getIdeaCount(chapter: ChapterModel): number {
    return this.getMarkerCount(chapter, 'green')
  }
  
  getMarkerCount(chapter: ChapterModel, color: string): number {
    // TODO: make part of model?
    const regex = new RegExp(`data-background-color="${color}"`, 'g');
    const count = ((chapter.content || '').match(regex) || []).length;
    return count;
  }

  /*isSelected(item: BaseModel): boolean {
    return !!this.$store.getters.currentChapters.find(chapter => chapter.id === item.id);
  }*/
}
</script>

<style scoped>
.title {
  font-weight: bold;
  padding-right: 0.5em;
}

.badges .p-badge {
  font-size: 0.8em;
  min-width: 1.2em;
  height: 1.2em;
  line-height: 1.2em;
  margin-left: 0.3em;
}
</style>