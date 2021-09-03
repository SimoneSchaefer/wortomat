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
export default class CharacterMenu extends Vue {
  get itemKey(): NOVEL_ITEM_KEYS {
    return NOVEL_ITEM_KEYS.CHARACTERS;
  }

  get items(): BaseModel[] {
    return this.$store.getters.selectedCharacters;
  }
}
</script>