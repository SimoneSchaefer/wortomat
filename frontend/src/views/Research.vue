<template>
<SplitView stateKey="research">
  <template v-slot:leftpanel>
    <FilterMenu :itemKey="itemKey"></FilterMenu>
    <ResearchList></ResearchList>
  </template>
  <template v-slot:content>
    <ResearchSheetList></ResearchSheetList>
  </template>
</SplitView>
<ResearchMenu></ResearchMenu>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import FilterMenu from '@/components/shared/filter/FilterMenu.vue';
import ResearchMenu from '@/components/research/ResearchMenu.vue';
import ResearchList from '@/components/research/ResearchList.vue';
import ResearchSheetList from '@/components/research/ResearchSheetList.vue';

import SplitView from './SplitView.vue';
import { NOVEL_ITEM_KEYS } from '@/store/keys';


@Options({
  components: { 
    EditableLabel, 
    ResearchMenu,
    ResearchList,
    FilterMenu,
    SplitView,
    ResearchSheetList
  }
})
export default class Research extends Vue {
  mounted(): void {
    this.$store.dispatch('loadItems', { key: NOVEL_ITEM_KEYS.RESEARCH, novelId: this.$route.params.id }); 
  }

  get itemKey(): NOVEL_ITEM_KEYS {
    return NOVEL_ITEM_KEYS.RESEARCH;
  }
}
</script>
