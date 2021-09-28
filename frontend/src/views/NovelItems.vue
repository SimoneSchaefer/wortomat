<template>
<SplitView :stateKey="novelItemKey">
  <template v-slot:leftpanel>
      <NovelItemMenu :novelItemKey="novelItemKey"></NovelItemMenu>
      <NovelItemList :novelItemKey="novelItemKey" :selectedItemsKey="selectedItemsKey" :filteredItemsKey="filteredItemsKey"></NovelItemList>
  </template>
  <template v-slot:content>
    <NovelItemSheetList :novelItemKey="novelItemKey" :selectedItemsKey="selectedItemsKey" :filteredItemsKey="filteredItemsKey"></NovelItemSheetList>
  </template>
</SplitView>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { NOVEL_ITEM_KEYS } from '@/store/keys';
import NovelItemMenu from '@/components/shared/menu/NovelItemMenu.vue';
import NovelItemList from '@/components/shared/lists/NovelItemList.vue';
import NovelItemSheetList from '@/components/shared/novel-item/NovelItemSheetList.vue';
import SplitView from './SplitView.vue';

@Options({
  components: { 
    NovelItemMenu,
    SplitView,
    NovelItemList,
    NovelItemSheetList
  }
})
export default class NovelItems extends Vue {
    @Prop() novelItemKey: NOVEL_ITEM_KEYS;
    @Prop() selectedItemsKey: string;
    @Prop() filteredItemsKey: string;
}
</script>
