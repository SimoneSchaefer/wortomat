<template>
  <GroupingNovelItem :parentKey="parentKey" :childKey="childKey"></GroupingNovelItem>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import GroupingNovelItem from './GroupingNovelItem.vue';
import { NOVEL_ITEM_KEYS } from '@/store/keys';

@Options({
  components: { 
    GroupingNovelItem
  }
})
export default class Research extends Vue {
  get parentKey(): NOVEL_ITEM_KEYS {
    return NOVEL_ITEM_KEYS.RESEARCH_GROUPS;
  }
  
  get childKey(): NOVEL_ITEM_KEYS {
    return NOVEL_ITEM_KEYS.RESEARCH;
  }
}
</script>
