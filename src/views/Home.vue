<template>
  <NovelList 
    v-bind:novels="novels"
    @delete-novel="deleteNovel"/>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import axios from 'axios'

import NovelList from '@/components/novels/NovelList.vue'; 

@Options({
  components: {
    NovelList
  },
})
export default class BooksOverview extends Vue {
  private novels = [];

  mounted () {
    axios.get('http://localhost:3000/novels')
      .then(response => {
        this.novels = response.data; 
      });
  }

  deleteNovel(novel: any) {
    console.log('Top level says: BE gone!')
  }
}
</script>
