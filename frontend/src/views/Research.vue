<template>
<SplitView stateKey="research">
  <template v-slot:leftpanel>
    RESEARCH
  </template>
  <template v-slot:content>
    RRRRESEARCH
  </template>
</SplitView>
<ResearchMenu></ResearchMenu>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import FilterMenu from '@/components/shared/filter/FilterMenu.vue';
import ResearchMenu from '@/components/research/ResearchMenu.vue';
import SplitView from './SplitView.vue';
import { NOVEL_ITEM_KEYS } from '@/store/keys';


@Options({
  components: { 
    EditableLabel, 
    ResearchMenu,
    FilterMenu,
    SplitView
  }
})
export default class Research extends Vue {
  mounted(): void {
    this.$store.dispatch('loadItems', { key: NOVEL_ITEM_KEYS.RESEARCH, novelId: this.$route.params.id }); 
  }
}
</script>
