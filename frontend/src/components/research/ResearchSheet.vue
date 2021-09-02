<template>
    <NovelItemSheet>
        <template v-slot:content>
            <div class="meta">
                <div class="header"><EditableLabel v-bind:value="research.title" @update-label="updateTitle" placeHolderTitle="No title added yet."></EditableLabel></div>
                <EditableTags v-if="displayTags" :tags="research.tags" @update-tags="updateTags"></EditableTags>
            </div>
            <hr>
            <b v-if="displaySummary"><EditableLabel v-bind:value="research.summary" @update-label="updateSummary" placeHolderTitle="No summary added yet."></EditableLabel></b>
            <span v-if="displayExtendedSummary"><EditableLabel v-bind:value="research.extended_summary" @update-label="updateExtendedSummary" placeHolderTitle="No detailed summary added yet."></EditableLabel></span>
            <hr v-if="displaySummary || displayExtendedSummary">
            <EditableText v-if="displayContent" v-bind:value="research.content" v-bind:header="research.title" @update-text="updateContent"></EditableText>        
        </template>
    </NovelItemSheet>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import EditableText from '@/components/shared/inline-edit/EditableText.vue';
import EditableTags from '@/components/shared/inline-edit/EditableTags.vue';
import NovelItemSheet from '@/components/shared/novel-item/NovelItemSheet.vue';
import { Prop } from 'vue-property-decorator';
import { ResearchModel } from '@/models/Research.model';
import { NOVEL_ITEM_KEYS, VIEWS } from '@/store/keys';
import { TagModel } from '@/models/Tag.model';

@Options({
  components: { EditableLabel, EditableText, EditableTags, NovelItemSheet }
})
export default class ResearchSheet extends Vue {
    @Prop() research!: ResearchModel;

    get displaySummary(): boolean {
        return this.isEnabled(VIEWS.SUMMARY);
    }
    get displayExtendedSummary(): boolean {
        return this.isEnabled(VIEWS.EXTENDED_SUMMARY);
    }
    get displayContent(): boolean {
        return this.isEnabled(VIEWS.CONTENT);
    }
    get displayTags(): boolean {
        return this.isEnabled(VIEWS.TAGS);
    }

    isEnabled(view: VIEWS): boolean {
       return this.$store.state.view.get(NOVEL_ITEM_KEYS.RESEARCH).get(view);
    }

    updateTags(newTags: TagModel[]): void {
        this.updateResearch({ tags: newTags});
    }
    
    updateTitle(newValue: string): void {
        this.updateResearch({ title: newValue });   
    }  

    updateSummary(newValue: string): void {
        this.updateResearch({ summary: newValue });   
    }   
    
    updateExtendedSummary(newValue: string): void {
        this.updateResearch({ extended_summary: newValue });   
    }

    updateContent(newValue: string): void {
        this.updateResearch({ content: newValue });   
    }

    private updateResearch(overrideValues): void {
        this.$store.dispatch('updateItem', { 
            key: NOVEL_ITEM_KEYS.RESEARCH, 
            novelId: this.$store.getters.openNovelId,
            oldItem: this.research,
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
