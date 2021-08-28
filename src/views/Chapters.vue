<template>
  <Splitter style="height: 100%" stateKey="chapters-splitter">
    <SplitterPanel>
      <ScrollPanel>
        <TagFilter></TagFilter>
        <ChapterList></ChapterList>
      </ScrollPanel>
    </SplitterPanel>
    <SplitterPanel class="bg-gray">
      <ScrollPanel style="height: 100%">
        <SelectedChapters></SelectedChapters>
      </ScrollPanel>
    </SplitterPanel>
  </Splitter>
  <ChapterMenu></ChapterMenu>
</template>

<script lang="ts">
import ScrollPanel from 'primevue/scrollpanel';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import TagFilter from '@/components/shared/TagFilter.vue';
import ChapterList from '@/components/chapters/ChapterList.vue';
import ChapterMenu from '@/components/chapters/ChapterMenu.vue';
import SelectedChapters from '@/components/chapters/SelectedChapters.vue';
import { NOVEL_ITEM_KEYS } from '@/store/keys';


@Options({
  components: { 
    Splitter, 
    SplitterPanel, 
    ScrollPanel,
    EditableLabel, 
    ChapterList, 
    SelectedChapters, 
    ChapterMenu,
    TagFilter 
  }
})
export default class Chapters extends Vue {
  mounted() {
    this.$store.dispatch('loadItems', { key: NOVEL_ITEM_KEYS.CHAPTERS, novelId: this.$route.params.id }); 
  }
}

</script>
