<template>
  <NovelList />
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import NovelList from '@/components/novels/NovelList.vue'; 
import { NovelModel} from '@/models/Novel.model';
import { namespace } from "s-vuex-class";

const novelModule = namespace("novelData");

@Options({
  components: {
    NovelList
  },
})
export default class BooksOverview extends Vue {
  @novelModule.State('_novels')
  novels!: NovelModel[];

  mounted(): void {
    this.loadNovels();
  }

  @novelModule.Action
  private loadNovels!: () => Promise<void>;
}
</script>
