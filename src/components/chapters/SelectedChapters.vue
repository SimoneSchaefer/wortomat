<template>
    <div v-for="currentChapter in currentChapters" :key="currentChapter.id">
        <SelectedChapter v-bind:chapter="currentChapter"></SelectedChapter>
    </div>

</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/EditableLabel.vue';
import SelectedChapter from '@/components/chapters/SelectedChapter.vue';

@Options({
  components: { EditableLabel, SelectedChapter }
})
export default class SelectedChapters extends Vue {
  get currentChapters() {
    return this.$store.getters.currentChapters;
  }
}
</script>
