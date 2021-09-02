<template>
    <div v-for="currentResearch in currentResearchItems" :key="currentResearch.id">
        <ResearchSheet v-bind:research="currentResearch"></ResearchSheet>
    </div>

</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import ResearchSheet from '@/components/research/ResearchSheet.vue';
import { BaseModel } from '@/models/Base.model';

@Options({
  components: { 
    EditableLabel, 
    ResearchSheet 
  }
})
export default class SelectedResearchItem extends Vue {
  get currentResearchItems(): BaseModel[] {
    return this.$store.getters.currentResearch;
  }
}
</script>
