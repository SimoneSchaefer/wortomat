<template>
    <div class="sheet">
        <h1>                
            <EditableLabel v-bind:value="chapter.title" @update-label="updateTitle"></EditableLabel>
        </h1>
        <EditableLabel v-bind:value="chapter.summary" @update-label="updateSummary"></EditableLabel>
        <EditableLabel v-bind:value="chapter.extended_summary" @update-label="updateExtendedSummary"></EditableLabel>
        <EditableText v-bind:value="chapter.content" v-bind:header="chapter.title" @update-text="updateContent"></EditableText>        
    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/EditableLabel.vue';
import EditableText from '@/components/shared/EditableText.vue';
import { SELECTION_KEYS } from '@/store/store.helper';
import { Prop } from 'vue-property-decorator';
import { ChapterModel } from '@/models/Chapter.model';

@Options({
  components: { EditableLabel, EditableText }
})
export default class SelectedChapters extends Vue {
    @Prop() chapter!: ChapterModel;
    
    updateTitle(newValue: string) {
        this.updateChapter({ title: newValue });   
    }  

    updateSummary(newValue: string) {
        this.updateChapter({ summary: newValue });   
    }   
    
    updateExtendedSummary(newValue: string) {
        this.updateChapter({ extended_summary: newValue });   
    }

    updateContent(newValue: string) {
        this.updateChapter({ content: newValue });   
    }


    private updateChapter(overrideValues) {
        this.$store.dispatch('updateItem', { 
            key: SELECTION_KEYS.CHAPTERS, 
            novelId: this.$store.getters.openNovelId,
            oldItem: this.chapter,
            overrideValues: overrideValues
        })  
    }
}
</script>
