<template>
    <div class="sheet">
        <h1><EditableLabel v-bind:value="chapter.title" @update-label="updateTitle"></EditableLabel></h1>
        <b><EditableLabel v-bind:value="chapter.summary" @update-label="updateSummary" placeHolderTitle="Summary"></EditableLabel></b>
        <EditableTags :tags="chapter.tags" @update-tags="updateTags"></EditableTags>
        <i><EditableLabel v-bind:value="chapter.extended_summary" @update-label="updateExtendedSummary" placeHolderTitle="Detailed summary"></EditableLabel></i>
        <EditableText v-bind:value="chapter.content" v-bind:header="chapter.title" @update-text="updateContent"></EditableText>        
    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import EditableText from '@/components/shared/inline-edit/EditableText.vue';
import EditableTags from '@/components/shared/inline-edit/EditableTags.vue';
import { Prop } from 'vue-property-decorator';
import { ChapterModel } from '@/models/Chapter.model';
import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { TagModel } from '@/models/Tag.model';

@Options({
  components: { EditableLabel, EditableText, EditableTags }
})
export default class SelectedChapters extends Vue {
    @Prop() chapter!: ChapterModel;

    updateTags(newTags: TagModel[]) {
        console.log('NEW TAGS', newTags)
        this.updateChapter({ tags: newTags});
    }
    
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
            key: NOVEL_ITEM_KEYS.CHAPTERS, 
            novelId: this.$store.getters.openNovelId,
            oldItem: this.chapter,
            overrideValues: overrideValues
        })  
    }
}
</script>
