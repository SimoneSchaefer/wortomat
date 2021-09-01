<template>
  <NovelItemMenu :novelItemKey="itemKey" :items="items"></NovelItemMenu>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import NovelItemMenu from '@/components/shared/menu/NovelItemMenu.vue'
import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { BaseModel } from '@/models/Base.model';

@Options({
  components: { NovelItemMenu }
})
export default class ResearchMenu extends Vue {
  get itemKey(): NOVEL_ITEM_KEYS {
    return NOVEL_ITEM_KEYS.RESEARCH;
  }

  get items(): BaseModel[] {
    return this.$store.getters.currentResearch;
  }
}
</script>