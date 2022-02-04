<template>
<ScrollPanel style="height: 100vh">
  <div class="novels">
    <div class="novel">
      <Card class="dummy-novel novel-card h-100">
        <template #content>
          <div class="p-d-flex p-ai-center p-jc-center">
            <Button data-cy="add-novel" label="Start a novel" class="p-button-text p-button-lg add-button" icon="pi pi-plus" v-on:click="newNovel()"></Button>
          </div>
        </template>
      </Card>
    </div>

    <div class="novel" v-for="novel in novels" :key="novel.id">
      <Novel :novel="novel"></Novel>
    </div>
  </div>
</ScrollPanel>

</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { namespace } from "s-vuex-class";

import { NovelModel } from '@/models/Novel.model';
import Novel from '@/components/novels/Novel.vue'; 

const novelModule = namespace("novel");

@Options({ 
  components: { 
    Novel
  }
})  
export default class NovelList extends Vue {
  @novelModule.State('_novels')
  novels!: Novel[]; 

  newNovel() {
    this.addNovel(new NovelModel());
  }

  @novelModule.Action
  addNovel!: (novel) => Promise<void>;
}
</script>


<style scoped>
.novels {
  margin: 3em;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  overflow: hidden;
}

.novel {
  margin: 3em;
  height: 20em;
  width: 25em;
}

.dummy-novel {
  height: 100%;
  display: flex;
  justify-content: center;
  align-content: center;
  align-items: center;
}

.dummy-novel .p-card-body {
  height: 100%;
}

</style>
