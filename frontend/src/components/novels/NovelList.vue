<template>
<div class="novels">
  <div class="p-grid">
    <div class="p-col-3">
      <Card class="dummy-novel h-100">
        <template #content>
          <div class="p-d-flex p-ai-center p-jc-center">
            <Button label="Start a novel" class="p-button-text p-button-lg add-button" icon="pi pi-plus" v-on:click="startAddMode()"></Button>
          </div>
        </template>
      </Card>
    </div>

    <div class="p-col-3" v-for="novel in novels" :key="novel.id">
      <Novel v-bind:novel="novel"></Novel>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { NovelModel } from '@/models/Novel.model';
import Novel from '@/components/novels/Novel.vue'; 

@Options({ 
  components: { 
    Novel
  }
})  
export default class NovelList extends Vue {
  @Prop() novels!: Novel[]; 

  startAddMode(): void {
    this.$store.dispatch('addNovel', new NovelModel());
  }
}
</script>


<style scoped>
.novels {
  margin: 3em;
}
.dummy-novel {
  height: 300px;
  display: flex;
  justify-content: center;
  align-content: center;
  align-items: center;
}

.dummy-novel .p-card-body {
  height: 100%;
}

</style>
