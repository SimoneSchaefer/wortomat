<!-- template -->
<template>
  <div class="p-grid">
    <div class="p-col-4">
      <Card class="dummy-novel">
        <template #content>
          <div class="p-d-flex p-ai-center p-jc-center">
            <Button label="Start a novel" class="p-button-text p-button-lg add-button" icon="pi pi-plus" v-on:click="startAddMode()"></Button>
          </div>
        </template>
      </Card>

    </div>

    <div class="p-col-4" v-for="novel in novels" :key="novel.id">
      <Novel 
        v-bind:novel="novel"
        @delete-novel="deleteNovel"
      ></Novel>
    </div>
  </div>
</template>



<!-- code -->
<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';
import Novel from '@/components/novels/Novel.vue'; 
import NovelModel from '@/models/Novel.model';

@Options({ 
  components: { 
    Novel
  }
})  
export default class NovelList extends Vue {
  @Prop() novels!: any 

  startAddMode() {
    console.log('start adding')
    const novel = new NovelModel();
    novel.id = Date.now();
    novel.title = 'Ein Buch! ' + Math.random();
    this.$store.dispatch('addNovel', novel);
  }

  @Emit('delete-novel')
  deleteNovel(novel: any) {
    return novel;    
  }
}
</script>


<!-- style -->
<style scoped>
.dummy-novel {
  height: 500px;
}

.dummy-novel .p-card-body {
  height: 100%;
}

</style>
