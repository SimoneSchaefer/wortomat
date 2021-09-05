<template>
    <div class="sheet" v-if="baseModel">
        <div class="header-container">
            <div v-if="includeImageUpload">
                <ImageGallery :imageUrls="images" :uploadUrl="getUploadUrl()" @uploadImage="uploadImage" @deleteImage="deleteImage"></ImageGallery>
            </div>

            <div class="meta">
                <div class="header"><EditableLabel v-bind:value="baseModel.name" @update-label="updateName" placeHolderTitle="No name added yet."></EditableLabel></div>
                <EditableTags v-if="displayTags" :tags="baseModel.tags" @update-tags="updateTags"></EditableTags>
            </div>
        </div>
        <hr>
        <b v-if="displaySummary"><EditableLabel v-bind:value="baseModel.summary" @update-label="updateSummary" placeHolderTitle="No summary added yet."></EditableLabel></b>
        <span v-if="displayExtendedSummary"><EditableLabel v-bind:value="baseModel.extended_summary" @update-label="updateExtendedSummary" placeHolderTitle="No detailed summary added yet."></EditableLabel></span>
        <hr v-if="displaySummary || displayExtendedSummary">
        <EditableText v-if="displayContent" v-bind:value="baseModel.content" v-bind:header="baseModel.title" @update-text="updateContent"></EditableText>        

    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { BaseModel } from '@/models/Base.model';

import ImageGallery, { ImageParam } from '@/components/shared/images/ImageGallery.vue';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import EditableText from '@/components/shared/inline-edit/EditableText.vue';
import EditableTags from '@/components/shared/inline-edit/EditableTags.vue';
import { NOVEL_ITEM_KEYS, VIEWS } from '@/store/keys';
import { NovelItemService } from '@/service/NovelItemService';
import { TagModel } from '@/models/Tag.model';

@Options({
  components: { EditableLabel, EditableText, EditableTags, NovelItemSheet, ImageGallery }
})
export default class NovelItemSheet extends Vue {
    @Prop() includeImageUpload = true;
    @Prop() service!: NovelItemService;
    @Prop() baseModel!: BaseModel;
    @Prop() novelItemKey!: NOVEL_ITEM_KEYS;


    deleteImage(image: ImageParam) {
        this.service.deleteImage(this.novelId, this.baseModel.id, image.imageId).then((response) => {
            this.updateImages(response.data.images);
        });
    }

    uploadImage(image: { id: number, name: string }) {
        const images = this.imagesOrEmpty;
        images.splice(0, 0, image);
        this.updateImages(images);
    }

    get imagesOrEmpty() {
        return [...this.baseModel['images'] || []];
    }

    get images(): Array<ImageParam> {
        return this.imagesOrEmpty.map(image => {
            const obj = {
                imageUrl: this.getImageUrl(image.id),
                imageId: image.id
            }
            return obj;
        }); 
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
        return this.service.getUploadUrl(this.novelId, this.baseModel.id);
    }

    getImageUrl(fileId: number) {
        return this.service.getImageUrl(this.novelId, this.baseModel.id, fileId);
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
    
    updateName(newValue: string): void {
        this.updateItem({ name: newValue });   
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


    private get novelId(): number {
        return this.$store.getters.openNovelId;
    }

    private updateItem(overrideValues): void {
        this.$store.dispatch('updateItem', { 
            key: this.novelItemKey, 
            novelId: this.novelId,
            oldItem: this.baseModel,
            overrideValues: overrideValues
        })  
    }
}
</script>