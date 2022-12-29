<template>
  <div class="sheet" v-if="item">
    <Ribbon v-if="item.hasOwnProperty('plotline')" :color="getPlotlineColor()" title="Select plotline" :colors="getAllPlotlineColors()" @selectColor="updateColor"></Ribbon>
    <div class="header-container">
      <div v-if="displayImages">
        <ImageGallery :novelItemKey="childKey" :imageUrls="images" :uploadUrl="getUploadUrl()"
          @uploadImage="uploadImage" @deleteImage="deleteImage"></ImageGallery>
      </div>

      <div class="meta">
        <div v-if="displayTitle" class="header">
          <EditableLabel v-bind:value="translatedName" @update-label="updateName(item, $event)"
            :placeHolderTitle="`fallback_labels.no_name.${childKey}`"></EditableLabel>
        </div>
        <b v-if="displaySummary" class="summary">
          <EditableLabel v-bind:value="translatedSummary" @update-label="updateSummary(item, $event)"
            :placeHolderTitle="`fallback_labels.no_summary`"></EditableLabel>
        </b>
        <span v-if="displayExtendedSummary" class="extended-summary">
          <EditableLabel v-bind:value="item.extended_summary" @update-label="updateExtendedSummary(item, $event)"
            :placeHolderTitle="`fallback_labels.no_extended_summary`"></EditableLabel>
        </span>
        <EditableTags v-if="displayTags" :addNewTagPossible="true" :selectedTags="item.tags"
          @update-tags="updateTags(item, $event)" :novelItemKey="parentKey"></EditableTags>
      </div>
    </div>
    <EditableText v-if="displayContent" v-bind:value="translatedContent" v-bind:header="item.name"
      @update-text="updateContent(item, $event)"></EditableText>
  </div>
</template>

<script lang="ts">
import { mixins, Options } from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { namespace } from "s-vuex-class";

import { BaseModel } from "@/models/Base.model";
import { ChildModel } from "@/models/ChildModel";
import { PARENT_ITEM_KEYS } from "@/store/keys";

import { GroupingNovelItemService } from "@/service/GroupingNovelItemService";

import ImageGallery, {
  ImageParam,
} from "@/components/shared/images/ImageGallery.vue";
import EditableLabel from "@/components/forms/inline-edit/EditableLabel.vue";
import EditableText from "@/components/forms/inline-edit/EditableText.vue";
import EditableTags from "@/components/forms/inline-edit/EditableTags.vue";
import DisplaySettingsAwareMixin from "@/components/mixins/DisplaySettingsAwareMixin";
import UpdatableItemMixin from "@/components/mixins/UpdatableItemMixin";
import TranslatableNovelItemMixin from "../../mixins/TranslatableNovelItemMixin";
import Ribbon from './Ribbon.vue';
import { ParentModel } from '@/models/ParentModel';
import { PlotlineModel } from '@/models/Plotline.model';

const novelDataModule = namespace("novelData");

@Options({
  components: {
    EditableLabel,
    EditableText,
    EditableTags,
    NovelItemSheet,
    ImageGallery,
    Ribbon
  },
})
export default class NovelItemSheet extends mixins(
  UpdatableItemMixin,
  DisplaySettingsAwareMixin,
  TranslatableNovelItemMixin
) {
  @Prop() item!: ChildModel;
  @Prop() novelItemKey!: PARENT_ITEM_KEYS;

  @novelDataModule.State('_novelItems')
    _novelItems!: Map<PARENT_ITEM_KEYS, ParentModel[]>;

  // Overriding base view, as this might be included in the timeline view
  get parentKey() {
    return this.novelItemKey;
  }

  private service = new GroupingNovelItemService();

  @novelDataModule.Action
  updateNovelItem!: (payload: {
    view: PARENT_ITEM_KEYS;
    novelItem: BaseModel;
  }) => Promise<void>;

  getPlotlineColor() {
    return this.item.plotline?.color || '#d2d2d2';
  }

  getAllPlotlineColors() {
    return this.plotlines.map((p) => (p as PlotlineModel).color) || [];
  }

  get plotlines() {
    return this._novelItems.get(PARENT_ITEM_KEYS.PLOTLINES) as PlotlineModel[] || [];
  }

  updateColor(color: string) {
    const plotline = this.plotlines.find(p => p.color === color);
    this.updateItem(this.item, { plotline: plotline});
  }

  deleteImage(image: ImageParam): void {
    this.service
      .deleteImage(
        this.parentKey,
        this.novelId,
        this.item.parentId,
        this.item.id,
        image.imageId
      )
      .then((response) => {
        this.updateImages(this.item, response.data.images);
      });
  }

  uploadImage(image: { id: number; name: string }): void {
    const images = this.imagesOrEmpty;
    images.splice(0, 0, image);
    this.updateImages(this.item, images);
  }

  get imagesOrEmpty(): { id: number; name: string }[] {
    return [...(this.item["images"] || [])];
  }

  get images(): Array<ImageParam> {
    return this.imagesOrEmpty.map((image) => {
      const obj = {
        imageUrl: this.getImageUrl(image.id),
        imageId: image.id,
      };
      return obj;
    });
  }

  getUploadUrl(): string {
    return this.service.getUploadUrl(
      this.parentKey,
      this.novelId,
      this.item.parentId,
      this.item.id
    );
  }

  getImageUrl(fileId: number): string {
    return this.service.getImageUrl(
      this.parentKey,
      this.novelId,
      this.item.parentId,
      this.item.id,
      fileId
    );
  }
}
</script>

<style>
.header .underline {
  font-size: 2rem;
}
</style>

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