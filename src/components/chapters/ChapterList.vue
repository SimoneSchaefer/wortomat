<template>
    <OrderList @selection-change="selectChapters" v-model="chapters" dataKey="id">
        <template #item="slotProps">
            <div class="item">
                <div>
                    <span class="title">{{slotProps.item.title}}</span>
                    <span class="summary">{{slotProps.item.summary}}</span>
                    <span class="todos">{{ getTodoCount(slotProps.item) }}</span>
                </div>
            </div>
        </template>
    </OrderList>
</template>

<script lang="ts">
import { ChapterModel } from '@/models/Chapter.model';
import { SELECTION_KEYS } from '@/store/store.helper';
import { Options, Vue } from 'vue-class-component';

@Options({})
export default class ChapterList extends Vue {
  get chapters() {
    return this.$store.state.currentNovel?.chapters || [];
  }

  getTodoCount(chapter: ChapterModel) {
    // TODO: make part of model?
    const count = ((chapter.content || '').match(/<\/mark>/g) || []).length;
    return count;
  }

  selectChapters(event)  {
    const selected = [...event.value];
    this.$store.dispatch('selectItems', { key: SELECTION_KEYS.CHAPTERS, items: selected });
  }  
}
</script>

<style scoped>

.title {
  font-weight: bold;
}
.item {
  text-align: left;
}


</style>