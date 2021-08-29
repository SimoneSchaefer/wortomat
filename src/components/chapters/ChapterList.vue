<template>
  <draggable 
    v-model="chapters" 
    group="chapters" 
    @start="drag=true" 
    @end="drag=false" 
    item-key="id">
    <template #item="{element}">
      <div class="item p-jc-between" v-on:click="selectChapter(element, $event)" v-bind:class="{ active: isSelected(element)}">
          <div class="p-d-flex">
            <div class="title">
              <MissingValueTolerantLabel :value="element.title" fallback="No title yet"></MissingValueTolerantLabel>
            </div>
            <div class="summary">
              <MissingValueTolerantLabel :value="element.summary" fallback="No summary yet"></MissingValueTolerantLabel>
            </div>
          </div>
          <div class="badges">
            <Badge v-if="getTodoCount(element)" :value="getTodoCount(element)" severity="warning"></Badge>
            <Badge v-if="getFixmeCount(element)" :value="getFixmeCount(element)" severity="danger"></Badge>
            <Badge v-if="getIdeaCount(element)" :value="getIdeaCount(element)" severity="info"></Badge>
          </div>            
        </div>
    </template>
  </draggable>
</template>

<script lang="ts">
import { BaseModel } from '@/models/Base.model';
import { ChapterModel } from '@/models/Chapter.model';
import { Options, Vue } from 'vue-class-component';
import MissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';
import draggable from 'vuedraggable'
import { NOVEL_ITEM_KEYS } from '@/store/keys';

@Options({
  components: { draggable, MissingValueTolerantLabel}
})
export default class ChapterList extends Vue {
  private lastChecked: BaseModel = null; 

  get chapters(): ChapterModel[] {
    return this.$store.getters.filteredChapters || [];
  }

  set chapters(value: ChapterModel[]) {
    this.$store.dispatch('updateOrder', { key: NOVEL_ITEM_KEYS.CHAPTERS, novelId: this.$store.getters.openNovelId, newOrder: value});
  }

  getTodoCount(chapter: ChapterModel) {
    return this.getMarkerCount(chapter, 'yellow')
  }  
  
  getFixmeCount(chapter: ChapterModel) {
    return this.getMarkerCount(chapter, '#D32F2F')
  }

  getIdeaCount(chapter: ChapterModel) {
    return this.getMarkerCount(chapter, 'green')
  }
  
  getMarkerCount(chapter: ChapterModel, color: string) {
    // TODO: make part of model?
    const regex = new RegExp(`data-background-color="${color}"`, 'g');
    const count = ((chapter.content || '').match(regex) || []).length;
    return count;
  }

  isSelected(item: BaseModel) {
    return this.$store.getters.currentChapters.find(chapter => chapter.id === item.id);
  }

  selectChapter(selected: BaseModel, $event)  {
    let selectedItems = [];
    if ($event.shiftKey) {
      selectedItems = this.handleShift(selected);
    } else if ($event.ctrlKey) {
      selectedItems = this.handleCtrl(selected);
    } else {
      selectedItems = [selected];
    }
    if (selectedItems.find(selectedItem => selectedItem.id === selected.id)) {
      this.lastChecked = selected;
    }
    this.$store.dispatch('selectItems', { key: NOVEL_ITEM_KEYS.CHAPTERS, items: selectedItems });
  }

  handleCtrl(selected: BaseModel): BaseModel[]  {
    let selectedItems = this.$store.getters.currentChapters;
    const index = selectedItems.findIndex(selectedItem => selectedItem.id === selected.id);
    if (index >= 0) {
      selectedItems.splice(index, 1);
    } else {
      selectedItems.push(selected);
    }
    return selectedItems;
  }
  
  handleShift(selected: BaseModel): BaseModel[] {
    if (!this.lastChecked) {
      return [selected];
    }
    let selectedItems = this.$store.getters.filteredChapters;
    const start = selectedItems.findIndex(selectedItem => selectedItem.id === selected.id);
    const end = selectedItems.findIndex(selectedItem => selectedItem.id === this.lastChecked.id);
    selectedItems = this.$store.getters.filteredChapters.slice(Math.min(start,end), Math.max(start,end)+ 1);
    return selectedItems;
  }
}
</script>

<style scoped>
.item {
  display: flex;
  font-size: smaller;
  padding: 0.5em;
}

.item.active {
  cursor: pointer;
  background-color: #bad8f6a6;
}

.item:hover {
  cursor: pointer;
  background-color: #d0e7ff7c;
}

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