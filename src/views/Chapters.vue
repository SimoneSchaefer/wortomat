<template>
  <Splitter style="height: 100%">
    <SplitterPanel>
      <ChapterList></ChapterList>     
    </SplitterPanel>
    <SplitterPanel class="bg-gray">
      <SelectedChapters></SelectedChapters>
    </SplitterPanel>
  </Splitter>
</template>

<script lang="ts">
import { SELECTION_KEYS } from '@/store/store.helper';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/EditableLabel.vue';
import ChapterList from '@/components/chapters/ChapterList.vue';
import SelectedChapters from '@/components/chapters/SelectedChapters.vue';

@Options({
  components: { Splitter, SplitterPanel, EditableLabel, ChapterList, SelectedChapters }
})
export default class Chapters extends Vue {
  get chapters() {
    return this.$store.state.currentNovel?.chapters || [];
  }
  get currentChapters() {
    return this.$store.getters.currentChapters;
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