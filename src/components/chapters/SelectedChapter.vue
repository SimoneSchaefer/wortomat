<template>
    <div class="sheet">
        <h1><EditableLabel v-bind:value="chapter.title" @update-label="updateTitle" placeHolderTitle="No title added yet."></EditableLabel></h1>
        <EditableTags v-if="displayTags" :tags="chapter.tags" @update-tags="updateTags"></EditableTags>
        <b v-if="displaySummary"><EditableLabel v-bind:value="chapter.summary" @update-label="updateSummary" placeHolderTitle="No summary added yet."></EditableLabel></b>
        <i v-if="displayExtendedSummary"><EditableLabel v-bind:value="chapter.extended_summary" @update-label="updateExtendedSummary" placeHolderTitle="No detailed summary added yet."></EditableLabel></i>
        <EditableText v-if="displayContent" v-bind:value="chapter.content" v-bind:header="chapter.title" @update-text="updateContent"></EditableText>        
    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import EditableText from '@/components/shared/inline-edit/EditableText.vue';
import EditableTags from '@/components/shared/inline-edit/EditableTags.vue';
import { Prop } from 'vue-property-decorator';
import { ChapterModel } from '@/models/Chapter.model';
import { NOVEL_ITEM_KEYS, VIEWS } from '@/store/keys';
import { TagModel } from '@/models/Tag.model';

@Options({
  components: { EditableLabel, EditableText, EditableTags }
})
export default class SelectedChapters extends Vue {
    @Prop() chapter!: ChapterModel;

    get displaySummary() {
        return this.$store.state.view.get(VIEWS.SUMMARY);
    }
    get displayExtendedSummary() {
        return this.$store.state.view.get(VIEWS.EXTENDED_SUMMARY);
    }
    get displayContent() {
        return this.$store.state.view.get(VIEWS.CONTENT);
    }
    get displayTags() {
        return this.$store.state.view.get(VIEWS.TAGS);
    }

    updateTags(newTags: TagModel[]) {
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

<style scoped>
hr {
    opacity: 0.7;
    border: 1px solid #efefef;
}
</style>
