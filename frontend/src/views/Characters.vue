<template>
<SplitView stateKey="characters">
  <template v-slot:leftpanel>
    <FilterMenu :itemKey="itemKey"></FilterMenu>
    <CharacterList></CharacterList>
  </template>
  <template v-slot:content>
    <CharacterSheetList></CharacterSheetList>
  </template>
</SplitView>
<CharacterMenu></CharacterMenu>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import FilterMenu from '@/components/shared/filter/FilterMenu.vue';
import CharacterMenu from '@/components/characters/CharacterMenu.vue';
import CharacterList from '@/components/characters/CharacterList.vue';
import CharacterSheetList from '@/components/characters/CharacterSheetList.vue';

import SplitView from './SplitView.vue';
import { NOVEL_ITEM_KEYS } from '@/store/keys';


@Options({
  components: { 
    EditableLabel, 
    CharacterMenu,
    CharacterList,
    FilterMenu,
    SplitView,
    CharacterSheetList
  }
})
export default class Characters extends Vue {
  mounted(): void {
    this.$store.dispatch('loadItems', { key: this.itemKey, novelId: this.$route.params.id }); 
  }

  get itemKey(): NOVEL_ITEM_KEYS {
    return NOVEL_ITEM_KEYS.CHARACTERS;
  }
}
</script>
