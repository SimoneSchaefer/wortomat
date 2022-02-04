<template>
    <div class="sheet" v-if="item">
        <div class="header-container">
            <div v-if="displayImages">
                <ImageGallery :novelItemKey="childKey" :imageUrls="images" :uploadUrl="getUploadUrl()" @uploadImage="uploadImage" @deleteImage="deleteImage"></ImageGallery>
            </div>

            <div class="meta">
                <div v-if="displayTitle" class="header"><EditableLabel v-bind:value="item.name" @update-label="updateName(item, $event)" :placeHolderTitle="`fallback_labels.no_name.${childKey}`"></EditableLabel></div>
                <b v-if="displaySummary" class="summary"><EditableLabel v-bind:value="item.summary" @update-label="updateSummary(item, $event)" :placeHolderTitle="`fallback_labels.no_summary`"></EditableLabel></b>
                <span v-if="displayExtendedSummary" class="extended-summary"><EditableLabel v-bind:value="item.extended_summary" @update-label="updateExtendedSummary(item, $event)" :placeHolderTitle="`fallback_labels.no_extended_summary`"></EditableLabel></span>
                <EditableTags v-if="displayTags" :tags="item.tags" @update-tags="updateTags(item, $event)" :novelItemKey="childKey"></EditableTags>
            </div>
        </div>
        <hr>
        <EditableText v-if="displayContent" v-bind:value="item.content" v-bind:header="item.title" @update-text="updateContent(item, $event)"></EditableText>        
    </div>
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { BaseModel } from '@/models/Base.model';

import ImageGallery, { ImageParam } from '@/components/shared/images/ImageGallery.vue';
import EditableLabel from '@/components/forms/inline-edit/EditableLabel.vue';
import EditableText from '@/components/forms/inline-edit/EditableText.vue';
import EditableTags from '@/components/forms/inline-edit/EditableTags.vue';
import DisplaySettingsAwareMixin from '@/components/mixins/DisplaySettingsAwareMixin';
import UpdatableItemMixin from '@/components/mixins/UpdatableItemMixin';
import { NovelItemService } from '@/service/NovelItemService';
import { CHILD_ITEM_KEYS, PARENT_TO_CHILD } from '@/store/keys';

@Options({
  components: { EditableLabel, EditableText, EditableTags, NovelItemSheet, ImageGallery }
})
export default class NovelItemSheet extends mixins(DisplaySettingsAwareMixin, UpdatableItemMixin) {
    @Prop() service!: NovelItemService;
    @Prop() item!: BaseModel;

    protected get key(): CHILD_ITEM_KEYS {
        return PARENT_TO_CHILD.get(this.$store.state.activeParentKey);
    }

    deleteImage(image: ImageParam): void {
        this.service.deleteImage(this.novelId, this.item.parentId, this.item.id, image.imageId).then((response) => {
            this.updateImages(this.item, response.data.images);
        });
    }

    uploadImage(image: { id: number, name: string }): void {
        const images = this.imagesOrEmpty;
        images.splice(0, 0, image);
        this.updateImages(this.item, images);
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
 

    getUploadUrl(): string {
        return this.service.getUploadUrl(this.novelId, this.item.parentId, this.item.id);
    }

    getImageUrl(fileId: number): string {
        return this.service.getImageUrl(this.novelId, this.item.parentId, this.item.id, fileId);
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