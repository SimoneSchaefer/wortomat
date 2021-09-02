<template>
<SplitView stateKey="chapters">
  <template v-slot:leftpanel>
    <FilterMenu :itemKey="itemKey"></FilterMenu>
    <ChapterList></ChapterList>
  </template>
  <template v-slot:content>
    <ChapterSheetList></ChapterSheetList>
  </template>
</SplitView>
<ChapterMenu></ChapterMenu>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import FilterMenu from '@/components/shared/filter/FilterMenu.vue';
import ChapterList from '@/components/chapters/ChapterList.vue';
import ChapterMenu from '@/components/chapters/ChapterMenu.vue';
import ChapterSheetList from '@/components/chapters/ChapterSheetList.vue';
import SplitView from './SplitView.vue';
import { NOVEL_ITEM_KEYS } from '@/store/keys';

@Options({
  components: { 
    EditableLabel, 
    ChapterList, 
    ChapterSheetList, 
    ChapterMenu,
    FilterMenu,
    SplitView
  }
})
export default class Chapters extends Vue {
  mounted(): void {
    this.$store.dispatch('loadItems', { key: NOVEL_ITEM_KEYS.CHAPTERS, novelId: this.$route.params.id }); 
  }

  get itemKey(): NOVEL_ITEM_KEYS {
    return NOVEL_ITEM_KEYS.CHAPTERS;
  }
}
</script>
