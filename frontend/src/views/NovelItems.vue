<template>
<NovelItemMenu :novelItemKey="novelItemKey"></NovelItemMenu>
<Splitter style="height: 100%" :stateKey="novelItemKey">
  <SplitterPanel>
    <ScrollPanel style="height: 100%">        
      <NovelItemList :novelItemKey="novelItemKey"></NovelItemList>
    </ScrollPanel>
  </SplitterPanel>
  <SplitterPanel class="split-content-right">
    <ScrollPanel style="height: 100%">
      <NovelItemSheetList :novelItemKey="novelItemKey"></NovelItemSheetList>
    </ScrollPanel>
  </SplitterPanel>
</Splitter>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import ScrollPanel from 'primevue/scrollpanel';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';

import { NOVEL_ITEM_KEYS } from '@/store/keys';
import NovelItemMenu from '@/components/shared/menu/NovelItemMenu.vue';
import NovelItemList from '@/components/shared/novel-item/NovelItemList.vue';
import NovelItemSheetList from '@/components/shared/novel-item/NovelItemSheetList.vue';


@Options({
  components: { 
    Splitter, 
    SplitterPanel, 
    ScrollPanel,
    NovelItemMenu,
    NovelItemList,
    NovelItemSheetList,
  }
})
export default class NovelItems extends Vue {
    @Prop() novelItemKey: NOVEL_ITEM_KEYS;
}
</script>

<style>
.p-scrollpanel-content {
  overflow-x: hidden;
}

.p-scrollpanel-content {
  padding-right: 0;
}

.p-scrollpanel-bar.p-scrollpanel-bar-y {
  display: none;
}

.p-splitter .p-splitter-gutter {
  background-color: var(--splitter-background-color);
  border-right: 1px solid var(--splitter-border-color);
}

.split-content-right {
  background: var(--sheet-list-background);
  position: relative;
  top: -1px;
}

</style>