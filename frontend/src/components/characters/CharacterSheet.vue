<template>
    <NovelItemSheet>
        <template v-slot:content>
            <div class="meta">
                <div class="header"><EditableLabel v-bind:value="character.title" @update-label="updateTitle" placeHolderTitle="No title added yet."></EditableLabel></div>
                <EditableTags v-if="displayTags" :tags="character.tags" @update-tags="updateTags"></EditableTags>
            </div>
            <hr>
            <b v-if="displaySummary"><EditableLabel v-bind:value="character.summary" @update-label="updateSummary" placeHolderTitle="No summary added yet."></EditableLabel></b>
            <span v-if="displayExtendedSummary"><EditableLabel v-bind:value="character.extended_summary" @update-label="updateExtendedSummary" placeHolderTitle="No detailed summary added yet."></EditableLabel></span>
            <hr v-if="displaySummary || displayExtendedSummary">
            <EditableText v-if="displayContent" v-bind:value="character.content" v-bind:header="character.title" @update-text="updateContent"></EditableText>        
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
import { CharacterModel } from '@/models/Character.model';
import { NOVEL_ITEM_KEYS, VIEWS } from '@/store/keys';
import { TagModel } from '@/models/Tag.model';

@Options({
  components: { EditableLabel, EditableText, EditableTags, NovelItemSheet }
})
export default class CharacterSheet extends Vue {
    @Prop() character!: CharacterModel;

    get novelItemKey() {
        return NOVEL_ITEM_KEYS.CHARACTERS;
    }

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
       return this.$store.state.view.get(this.novelItemKey).get(view);
    }

    updateTags(newTags: TagModel[]): void {
        this.updateItem({ tags: newTags});
    }
    
    updateTitle(newValue: string): void {
        this.updateItem({ title: newValue });   
    }  

    updateSummary(newValue: string): void {
        this.updateItem({ summary: newValue });   
    }   
    
    updateExtendedSummary(newValue: string): void {
        this.updateItem({ extended_summary: newValue });   
    }

    updateContent(newValue: string): void {
        this.updateItem({ content: newValue });   
    }

    private updateItem(overrideValues): void {
        this.$store.dispatch('updateItem', { 
            key: this.novelItemKey, 
            novelId: this.$store.getters.openNovelId,
            oldItem: this.character,
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
