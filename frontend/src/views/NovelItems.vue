<template>
<NovelItemMenu :novelItemKey="novelItemKey"></NovelItemMenu>
<Splitter style="height: 100%" :stateKey="novelItemKey">
  <SplitterPanel class="split-content-left">
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
  padding-right: 0;
}

.split-content-left {
  background: var(--item-list-background);
}

.split-content-left .p-scrollpanel-bar.p-scrollpanel-bar-y {
  background: #d1d1d1a9;
}

.split-content-right .p-scrollpanel-bar.p-scrollpanel-bar-y {
  background: #797979;
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