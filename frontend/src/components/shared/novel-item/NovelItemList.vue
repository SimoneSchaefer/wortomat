<template>
<div class="itemlist">
  <DragDropList :novelItemKey="novelItemKey">
    <template v-slot="slotProps">
      <div class="p-d-flex item">
        <div class="title">
          <MissingValueTolerantLabel :value="slotProps.item.name" fallback="No title yet"></MissingValueTolerantLabel>
        </div>
        <div class="summary">
          <MissingValueTolerantLabel :value="slotProps.item.summary" fallback="No summary yet"></MissingValueTolerantLabel>
        </div>
        <div class="tags">
          <div v-for="tag in slotProps.item.tags" :key="tag.id" class="tag-chip">
            <Chip>
                {{ tag.name }}
            </Chip>
          </div>
        </div>
        <div class="badges">
        <Badge v-if="getTodoCount(slotProps.item)" :value="getTodoCount(slotProps.item)" severity="warning"></Badge>
        <Badge v-if="getFixmeCount(slotProps.item)" :value="getFixmeCount(slotProps.item)" severity="danger"></Badge>
        <Badge v-if="getIdeaCount(slotProps.item)" :value="getIdeaCount(slotProps.item)" severity="info"></Badge>
      </div>
    </div>
   
    </template>
  </DragDropList>
</div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import draggable from 'vuedraggable'

import MissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';
import DragDropList from '@/components/shared/lists/DragDropList.vue';
import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { BaseModel } from '@/models/Base.model';

@Options({
  components: { draggable, MissingValueTolerantLabel, DragDropList}
})
export default class NovelItemList extends Vue {
  @Prop() novelItemKey: NOVEL_ITEM_KEYS;

  getTodoCount(novelItem: BaseModel): number {
    return this.getMarkerCount(novelItem, 'yellow')
  }  
  
  getFixmeCount(novelItem: BaseModel): number {
    return this.getMarkerCount(novelItem, '#D32F2F')
  }

  getIdeaCount(novelItem: BaseModel): number {
    return this.getMarkerCount(novelItem, 'blue')
  }
  
  getMarkerCount(novelItem: BaseModel, color: string): number {
    // TODO: make part of model?
    const regex = new RegExp(`data-background-color="${color}"`, 'g');
    const count = ((novelItem.content || '').match(regex) || []).length;
    return count;
  }
}
</script>

<style scoped>
.title {
  font-weight: bold;
  padding-right: 0.5em;
}

.tags {
  margin-left: 1rem;
  font-size: 0.8rem;
  display: flex;
}

.tags > * {
  margin-right: 0.2rem;
}

.p-chip {
  font-size: 0.8rem;
}

.badges .p-badge {
  font-size: 0.8em;
  min-width: 1.2em;
  height: 1.2em;
  line-height: 1.2em;
  margin-left: 0.3em;
}


.p-d-flex {
  flex-wrap: wrap;
}

.p-d-flex.item > div {
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
  white-space: nowrap;
}

.itemlist {
  height: 100%;
}

</style>