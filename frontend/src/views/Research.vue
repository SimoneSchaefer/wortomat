<template>
  <GroupingNovelItem :novelItemKey="parentKey"></GroupingNovelItem>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import GroupingNovelItem from './GroupingNovelItem.vue';
import { PARENT_ITEM_KEYS } from '@/store/keys';

@Options({
  components: { 
    GroupingNovelItem
  }
})
export default class Research extends Vue {
  get parentKey(): PARENT_ITEM_KEYS {
    return PARENT_ITEM_KEYS.RESEARCH_GROUPS;
  }
}
</script>
