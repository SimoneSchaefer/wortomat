<template>
    <div class="sheet" v-if="item">
        <div class="header-container">
            <div v-if="displayImages">
                <ImageGallery :novelItemKey="novelItemKey" :imageUrls="images" :uploadUrl="getUploadUrl()" @uploadImage="uploadImage" @deleteImage="deleteImage"></ImageGallery>
            </div>

            <div class="meta">
                <div v-if="displayTitle" class="header"><EditableLabel v-bind:value="item.name" @update-label="updateName" :placeHolderTitle="`fallback_labels.no_name.${novelItemKey}`"></EditableLabel></div>
                <b v-if="displaySummary" class="summary"><EditableLabel v-bind:value="item.summary" @update-label="updateSummary" :placeHolderTitle="`fallback_labels.no_summary`"></EditableLabel></b>
                <span v-if="displayExtendedSummary" class="extended-summary"><EditableLabel v-bind:value="item.extended_summary" @update-label="updateExtendedSummary" :placeHolderTitle="`fallback_labels.no_extended_summary`"></EditableLabel></span>
                <EditableTags v-if="displayTags" :tags="item.tags" @update-tags="updateTags" :novelItemKey="novelItemKey"></EditableTags>
            </div>
        </div>
        <hr>
        <EditableText v-if="displayContent" v-bind:value="item.content" v-bind:header="item.title" @update-text="updateContent"></EditableText>        
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
import { DisplaySettingsKeys, NOVEL_ITEM_KEYS } from '@/store/keys';
import { NovelItemService } from '@/service/NovelItemService';
import { DisplaySettingsService } from '@/service/DisplaySettingsService';
import { TagModel } from '@/models/Tag.model';

@Options({
  components: { EditableLabel, EditableText, EditableTags, NovelItemSheet, ImageGallery }
})
export default class NovelItemSheet extends Vue {
    @Prop() service!: NovelItemService;
    @Prop() item!: BaseModel;
    @Prop() novelItemKey!: NOVEL_ITEM_KEYS;
    private displaySettingService = new DisplaySettingsService();

    deleteImage(image: ImageParam): void {
        this.service.deleteImage(this.novelId, this.item.parentId, this.item.id, image.imageId).then((response) => {
            this.updateImages(response.data.images);
        });
    }

    uploadImage(image: { id: number, name: string }): void {
        const images = this.imagesOrEmpty;
        images.splice(0, 0, image);
        this.updateImages(images);
    }

    get imagesOrEmpty() {
        return [...this.item['images'] || []];
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


    get displayImages() {
        return this.isEnabled(DisplaySettingsKeys.SHOW_IMAGES);
    }

    get displayTitle(): boolean {
        return this.isEnabled(DisplaySettingsKeys.SHOW_TITLE);
    }
    get displaySummary(): boolean {
        return this.isEnabled(DisplaySettingsKeys.SHOW_SUMMARY);
    }
    get displayExtendedSummary(): boolean {
        return this.isEnabled(DisplaySettingsKeys.SHOW_EXTENDED_SUMMARY);
    }
    get displayContent(): boolean {
        return this.isEnabled(DisplaySettingsKeys.SHOW_CONTENT);
    }
    get displayTags(): boolean {
        return this.isEnabled(DisplaySettingsKeys.SHOW_TAGS);
    }

    getUploadUrl(): string {
        return this.service.getUploadUrl(this.novelId, this.item.parentId, this.item.id);
    }

    getImageUrl(fileId: number): string {
        return this.service.getImageUrl(this.novelId, this.item.parentId, this.item.id, fileId);
    }

    isEnabled(view: DisplaySettingsKeys): boolean {
       return this.$store.state.displaySettings[this.novelItemKey][view];
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
            oldItem: this.item,
            overrideValues: overrideValues
        })  
    }
}
</script>

<style scoped>
.sheet {
    border: var(--sheet-border);
    margin: 3em;
    padding: 5em;
    position: relative;
    top: 1em;
    bottom: 3em;
    background: var(--sheet-background);
}

hr {
    border-color: #c8c8c875;
}

.header-container {
    display: flex;
}

.meta {
    flex-grow: 1;
}

.header {
    font-size: 1.2rem;
    font-weight: bold;
}
</style>