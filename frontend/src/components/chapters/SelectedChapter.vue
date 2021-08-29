<template>
    <div class="sheet">
        <div class="meta">
            <div class="header"><EditableLabel v-bind:value="chapter.title" @update-label="updateTitle" placeHolderTitle="No title added yet."></EditableLabel></div>
            <EditableTags v-if="displayTags" :tags="chapter.tags" @update-tags="updateTags"></EditableTags>
        </div>
        <hr>
        <b v-if="displaySummary"><EditableLabel v-bind:value="chapter.summary" @update-label="updateSummary" placeHolderTitle="No summary added yet."></EditableLabel></b>
        <span v-if="displayExtendedSummary"><EditableLabel v-bind:value="chapter.extended_summary" @update-label="updateExtendedSummary" placeHolderTitle="No detailed summary added yet."></EditableLabel></span>
        <hr v-if="displaySummary || displayExtendedSummary">
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

    get displaySummary(): boolean {
        return this.$store.state.view.get(VIEWS.SUMMARY);
    }
    get displayExtendedSummary(): boolean {
        return this.$store.state.view.get(VIEWS.EXTENDED_SUMMARY);
    }
    get displayContent(): boolean {
        return this.$store.state.view.get(VIEWS.CONTENT);
    }
    get displayTags(): boolean {
        return this.$store.state.view.get(VIEWS.TAGS);
    }

    updateTags(newTags: TagModel[]): void {
        this.updateChapter({ tags: newTags});
    }
    
    updateTitle(newValue: string): void {
        this.updateChapter({ title: newValue });   
    }  

    updateSummary(newValue: string): void {
        this.updateChapter({ summary: newValue });   
    }   
    
    updateExtendedSummary(newValue: string): void {
        this.updateChapter({ extended_summary: newValue });   
    }

    updateContent(newValue: string): void {
        this.updateChapter({ content: newValue });   
    }

    private updateChapter(overrideValues): void {
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

.header {
    font-size: 2em;
}
</style>
