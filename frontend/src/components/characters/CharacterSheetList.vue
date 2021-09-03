<template>
    <div v-for="selectedCharacter in selectedCharacters" :key="selectedCharacter.id">
        <CharacterSheet v-bind:character="selectedCharacter"></CharacterSheet>
    </div>

</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import CharacterSheet from '@/components/characters/CharacterSheet.vue';
import { BaseModel } from '@/models/Base.model';

@Options({
  components: { 
    EditableLabel, 
    CharacterSheet 
  }
})
export default class CharacterSheetList extends Vue {
  get selectedCharacters(): BaseModel[] {
    return this.$store.getters.selectedCharacters;
  }
}
</script>
