<template>
    <div v-for="currentChapter in currentChapters" :key="currentChapter.id">
        <SelectedChapter v-bind:chapter="currentChapter"></SelectedChapter>
    </div>

</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import SelectedChapter from '@/components/chapters/SelectedChapter.vue';
import { BaseModel } from '@/models/Base.model';

@Options({
  components: { EditableLabel, SelectedChapter }
})
export default class SelectedChapters extends Vue {
  get currentChapters(): BaseModel[] {
    return this.$store.getters.currentChapters;
  }
}
</script>
