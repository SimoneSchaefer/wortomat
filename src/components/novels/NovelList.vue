<template>
  <div class="p-grid">
    <div class="p-col-4">
      <Card class="dummy-novel h-100">
        <template #content>
          <div class="p-d-flex p-ai-center p-jc-center">
            <Button label="Start a novel" class="p-button-text p-button-lg add-button" icon="pi pi-plus" v-on:click="startAddMode()"></Button>
          </div>
        </template>
      </Card>
    </div>

    <div class="p-col-4" v-for="novel in novels" :key="novel.id">
      <Novel v-bind:novel="novel"></Novel>
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
  @Prop() novels!: any 

  startAddMode() {
    this.$store.dispatch('addNovel', new NovelModel());
  }
}
</script>


<style scoped>
.dummy-novel {
  height: 500px;
}

.dummy-novel .p-card-body {
  height: 100%;
}

</style>
