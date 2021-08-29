<template>
    <div class="menu">
      <div class="content-filter">      
        <ContentFilter></ContentFilter>
      </div>
      <div class="tag-filter">      
        <TagFilter></TagFilter>
      </div>
    </div>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import TagFilter from '@/components/shared/filter/TagFilter.vue';
import ContentFilter from '@/components/shared/filter/ContentFilter.vue';

@Options({
  components: { 
    TagFilter,
    ContentFilter
  }
})
export default class ChapterMenu extends Vue { 

 
}
</script>

<style scoped>
.menu {
  display: flex;
  width: 100%;
  background-color: aliceblue;
  border-bottom: 1px solid #efefef;
}

.content-filter {
  width: 2.357rem;
  display: inline;
  vertical-align: middle;
  flex-grow: 0;
}

.content-filter button {
  height: 100%;
}


.tag-filter {
  flex-grow: 1;
}
</style>
