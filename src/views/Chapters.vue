<template>
  <Splitter style="height: 100%" stateKey="chapters-splitter">
    <SplitterPanel>
      <ScrollPanel style="height: 100%">
        <ChapterList></ChapterList>     
      </ScrollPanel>
    </SplitterPanel>
    <SplitterPanel class="bg-gray h-100">
      <ScrollPanel style="height: 100%" class="custom">
        <SelectedChapters></SelectedChapters>
      </ScrollPanel>
    </SplitterPanel>
  </Splitter>
</template>

<script lang="ts">
import ScrollPanel from 'primevue/scrollpanel';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/EditableLabel.vue';
import ChapterList from '@/components/chapters/ChapterList.vue';
import SelectedChapters from '@/components/chapters/SelectedChapters.vue';

@Options({
  components: { Splitter, SplitterPanel, EditableLabel, ChapterList, SelectedChapters, ScrollPanel }
})
export default class Chapters extends Vue {}
</script>