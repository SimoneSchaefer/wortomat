<template>
  <NovelItems :novelItemKey="itemKey" :selectedItemsKey="'currentChapters'" :filteredItemsKey="'filteredChapters'"></NovelItems>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import NovelItems from './NovelItems.vue';
import { NOVEL_ITEM_KEYS } from '@/store/keys';

@Options({
  components: { 
    NovelItems
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
