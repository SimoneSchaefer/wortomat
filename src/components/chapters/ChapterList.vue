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
            <div class="title">{{element.title}}</div>
            <div class="summary">{{element.summary}}</div>
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
import { SELECTION_KEYS } from '@/store/store.helper';
import { Options, Vue } from 'vue-class-component';
import draggable from 'vuedraggable'

@Options({
  components: draggable
})
export default class ChapterList extends Vue {
  get chapters() {
    return this.$store.state.currentNovel?.chapters || [];
  }

  set chapters(value) {
    this.$store.dispatch('updateOrder', { key: SELECTION_KEYS.CHAPTERS, newOrder: value});
  }

  getTodoCount(chapter: ChapterModel) {
    return this.getMarkerCount(chapter, 'yellow')
  }  
  
  getFixmeCount(chapter: ChapterModel) {
    return this.getMarkerCount(chapter, 'red')
  }

  getIdeaCount(chapter: ChapterModel) {
    return this.getMarkerCount(chapter, 'green')
  }
  
  getMarkerCount(chapter: ChapterModel, color: string) {
    // TODO: make part of model?
    const regex = new RegExp(`data-color="${color}"`, 'g');
    const count = ((chapter.content || '').match(regex) || []).length;
    return count;
  }

  isSelected(item: BaseModel) {
    return this.$store.getters.currentChapters.find(chapter => chapter.id === item.id);
  }

  selectChapter(selected: BaseModel, $event)  {
    const selectedItems = $event.ctrlKey ? this.$store.getters.currentChapters : []
    selectedItems.push(selected);
    this.$store.dispatch('selectItems', { key: SELECTION_KEYS.CHAPTERS, items: selectedItems });
  }  
}
</script>

<style scoped>
.item {
  display: flex;
  font-size: smaller;
  padding: 0.5em;
}

.item.active,.item:hover {
  cursor: pointer;
  background-color: #bad8f6a6;
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