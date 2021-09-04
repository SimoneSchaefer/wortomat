<template>
    <NovelItemSheet>
        <template v-slot:content>
            <div class="p-flex-d">
                <ImageGallery v-model:activeIndex="activeIndex" :imageUrls="images" :uploadUrl="getUploadUrl()" @uploadImage="uploadImage" @deleteImage="deleteImage"></ImageGallery>

                <div class="meta">
                    <div class="header"><EditableLabel v-bind:value="character.title" @update-label="updateTitle" placeHolderTitle="No title added yet."></EditableLabel></div>
                    <EditableTags v-if="displayTags" :tags="character.tags" @update-tags="updateTags"></EditableTags>
                </div>
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
import { Prop } from 'vue-property-decorator';

import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import EditableText from '@/components/shared/inline-edit/EditableText.vue';
import EditableTags from '@/components/shared/inline-edit/EditableTags.vue';
import NovelItemSheet from '@/components/shared/novel-item/NovelItemSheet.vue';
import ImageGallery, { ImageParam } from '@/components/shared/images/ImageGallery.vue';
import { CharacterModel } from '@/models/Character.model';
import { NOVEL_ITEM_KEYS, VIEWS } from '@/store/keys';
import { TagModel } from '@/models/Tag.model';
import { CharacterService } from '@/service/Character.service';

@Options({
  components: { EditableLabel, EditableText, EditableTags, NovelItemSheet, ImageGallery }
})
export default class CharacterSheet extends Vue {
    @Prop() character!: CharacterModel;
    activeIndex = 0;

    deleteImage(image: ImageParam) {
        new CharacterService().deleteImage(this.novelId, this.character.id, image.imageId).then((response) => {
            this.updateImages(response.data.images);
            this.activeIndex = 0;
        });
    }

    uploadImage(image: { id: number, name: string }) {
        const images = [...this.character.images];
        images.splice(0, 0, image);
        this.updateImages(images);
        this.activeIndex = 0;
    }

    get images(): Array<ImageParam> {
        return (this.character.images || []).map(image => {
            const obj = {
                imageUrl: this.getImageUrl(image.id),
                imageId: image.id
            }
            return obj;
        }); 
    }

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

    getUploadUrl() {
        return new CharacterService().getUploadUrl(this.novelId, this.character.id);
    }

    getImageUrl(fileId: number) {
        return new CharacterService().getImageUrl(this.novelId, this.character.id, fileId);
    }

    isEnabled(view: VIEWS): boolean {
       return this.$store.state.view.get(this.novelItemKey).get(view);
    }

    updateImages(images: Array<{ id: number, name: string }>): void {
        this.updateItem({ images: images});
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
            novelId: this.novelId,
            oldItem: this.character,
            overrideValues: overrideValues
        })  
    }

    private get novelId(): number {
        return this.$store.getters.openNovelId;
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