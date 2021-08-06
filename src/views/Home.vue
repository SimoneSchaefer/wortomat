<template>
  <NovelList v-bind:novels="novels" />
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import NovelList from '@/components/novels/NovelList.vue'; 
import { NovelModel} from '@/models/Novel.model';

@Options({
  components: {
    NovelList
  },
})
export default class BooksOverview extends Vue {
  mounted () {
    this.$store.dispatch('loadNovels', this.$route.params.id)
  }

  get novels(): NovelModel[] {
    return this.$store.state.novels;
  }
}
</script>
