<template>
<div class="itemlist">
  <DragDropList :novelItemKey="novelItemKey">
    <template v-slot="slotProps">
      <div class="p-d-flex">
        <div class="title">
          <MissingValueTolerantLabel :value="slotProps.item.name" fallback="No title yet"></MissingValueTolerantLabel>
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
    return this.getMarkerCount(novelItem, 'green')
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

.badges .p-badge {
  font-size: 0.8em;
  min-width: 1.2em;
  height: 1.2em;
  line-height: 1.2em;
  margin-left: 0.3em;
}

.itemlist {
  background: var(--item-list-background);
}
</style>