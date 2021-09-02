<template>
    <div v-for="currentChapter in currentChapters" :key="currentChapter.id">
        <ChapterSheet v-bind:chapter="currentChapter"></ChapterSheet>
    </div>

</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import ChapterSheet from '@/components/chapters/ChapterSheet.vue';
import { BaseModel } from '@/models/Base.model';

@Options({
  components: { EditableLabel, ChapterSheet }
})
export default class ChapterSheetList extends Vue {
  get currentChapters(): BaseModel[] {
    return this.$store.getters.currentChapters;
  }
}
</script>
