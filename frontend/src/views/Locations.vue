<template>
  <GroupingNovelItem :novelItemKey="parentKey"></GroupingNovelItem>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

import { PARENT_ITEM_KEYS } from '@/store/keys';

import GroupingNovelItem from './GroupingNovelItem.vue';

@Options({
  components: { 
    GroupingNovelItem
  }
})
export default class Locations extends Vue {
  get parentKey(): PARENT_ITEM_KEYS {
    return PARENT_ITEM_KEYS.LOCATION_GROUPS;
  }
}
</script>
