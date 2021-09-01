<template>
<SplitView stateKey="research">
  <template v-slot:leftpanel>
    RESEARCH
  </template>
  <template v-slot:content>
    RRRRESEARCH
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
import SelectedChapters from '@/components/chapters/SelectedChapters.vue';
import SplitView from './SplitView.vue';
import { NOVEL_ITEM_KEYS } from '@/store/keys';


@Options({
  components: { 
    EditableLabel, 
    ChapterList, 
    SelectedChapters, 
    ChapterMenu,
    FilterMenu,
    SplitView
  }
})
export default class Research extends Vue {
  mounted(): void {
    this.$store.dispatch('loadItems', { key: NOVEL_ITEM_KEYS.RESEARCH, novelId: this.$route.params.id }); 
  }
}
</script>
