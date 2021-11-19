<template>
    <div class="sheet" v-if="item">
        <div class="header-container">
            <div v-if="includeImageUpload">
                <ImageGallery :imageUrls="images" :uploadUrl="getUploadUrl()" @uploadImage="uploadImage" @deleteImage="deleteImage"></ImageGallery>
            </div>

            <div class="meta">
                <div class="header"><EditableLabel v-bind:value="item.name" @update-label="updateName" :placeHolderTitle="`fallback_labels.no_name.${novelItemKey}`"></EditableLabel></div>
                <b v-if="displaySummary"><EditableLabel v-bind:value="item.summary" @update-label="updateSummary" :placeHolderTitle="`fallback_labels.no_summary`"></EditableLabel></b>
                <span v-if="displayExtendedSummary"><EditableLabel v-bind:value="item.extended_summary" @update-label="updateExtendedSummary" :placeHolderTitle="`fallback_labels.no_extended_summary`"></EditableLabel></span>

                <!--<EditableTags v-if="displayTags" :tags="item.tags" @update-tags="updateTags" :service="service"></EditableTags>-->
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
import { NOVEL_ITEM_KEYS, VIEWS } from '@/store/keys';
import { NovelItemService } from '@/service/NovelItemService';
import { TagModel } from '@/models/Tag.model';

@Options({
  components: { EditableLabel, EditableText, EditableTags, NovelItemSheet, ImageGallery }
})
export default class NovelItemSheet extends Vue {
    @Prop() service!: NovelItemService;
    @Prop() item!: BaseModel;
    @Prop() novelItemKey!: NOVEL_ITEM_KEYS;

    get includeImageUpload() {
        return Object.keys(this.item).includes('images');
    }

    deleteImage(image: ImageParam): void {
        this.service.deleteImage(this.novelId, this.item.id, image.imageId).then((response) => {
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

    getUploadUrl(): string {
        return this.service.getUploadUrl(this.novelId, this.item.id);
    }

    getImageUrl(fileId: number): string {
        return this.service.getImageUrl(this.novelId, this.item.id, fileId);
    }

    isEnabled(view: VIEWS): boolean {
        if (this.$store.state.view?.get(this.novelItemKey) === undefined) {
            return true;
        }
       return this.$store.state.view?.get(this.novelItemKey)?.get(view);
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
    border-color: var(--sheet-separator-color);
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