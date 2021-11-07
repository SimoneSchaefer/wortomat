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
export default class Characters extends Vue {
  mounted(): void {
    this.$store.dispatch('loadItems', { key: this.parentKey, novelId: this.$route.params.id }); 
  }

  get parentKey(): NOVEL_ITEM_KEYS {
    return NOVEL_ITEM_KEYS.LOCATION_GROUPS;
  }
  
  get childKey(): NOVEL_ITEM_KEYS {
    return NOVEL_ITEM_KEYS.LOCATIONS;
  }
}
</script>
