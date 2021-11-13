<template>
  <Dialog :visible="displayDialog" :closable="false" :modal="true" style="width: 50em">
    <template #header>
      <div class="header">
        <h3>{{ $t("timeline.manage_references") }}</h3>
        <WButton @click="close" type="text" icon="fa fa-times" title="timeline.select_reference_type.close"/>
      </div>

    </template>
    <div class="existing-references">
      <div v-for="chapter of getChaptersForEvent(event)" v-bind:key="chapter.id" class="existing-reference">
          <div><i class="fa fa-book-open"></i>&nbsp;<WMissingValueTolerantLabel :value="chapter.name" :fallback="$t(`fallback_labels.no_name.${chapterNovelItemKey}`)"></WMissingValueTolerantLabel></div>
          <div><WButton color="danger" type="text"
            @click="deleteReference(chapter, chapterNovelItemKey)" 
            :title="`timeline.select_reference_type.delete`" 
            icon="fa fa-trash" />
          </div>
      </div>      
      <div v-for="research of getResearchForEvent(event)" v-bind:key="research.id" class="existing-reference">
          <div><i class="fa fa-flask"></i>&nbsp;<WMissingValueTolerantLabel :value="research.name" :fallback="$t(`fallback_labels.no_name.${researchNovelItemKey}`)"></WMissingValueTolerantLabel></div>
          <div><WButton color="danger" type="text"
            @click="deleteReference(research, researchNovelItemKey)" 
            :title="`timeline.select_reference_type.delete`" 
            icon="fa fa-trash" />
          </div>
      </div>
    </div>
    <div class="add-reference-form">
      <Dropdown
        v-model="selectedItemType"
        :options="itemTypes"
        optionLabel="name"
        :placeholder="$t('timeline.select_reference_type.select_item_type')">
        <template #value="slotProps">
            <div v-if="slotProps.value">
                {{ $t(`timeline.select_reference_type.${slotProps.value}`) }}
            </div>
        </template>       
         <template #option="slotProps">
            {{ $t(`timeline.select_reference_type.${slotProps.option}`) }}
        </template>
      </Dropdown>

      <WNovelItemDropdown v-if="selectedItemType === chapterNovelItemKey"
        @change="selectedChapter = $event"
        :items="chapters"
        :selectedItem="selectedChapter"
        :novelItemKey="chapterNovelItemKey"
        placeHolder="timeline.select_chapter" >
      </WNovelItemDropdown>

      <WNovelItemDropdown v-if="selectedItemType === researchNovelItemKey"
        @change="selectedResearch = $event"
        :items="research"
        :novelItemKey="researchNovelItemKey"
        placeHolder="timeline.select_research" >
      </WNovelItemDropdown>

      <div class="option-groups">
        <WButton :disabled="!validReference" type="text"
          @click="addReference" 
          :title="`timeline.select_reference_type.add_locally`" 
          icon="fa fa-plus" />
      </div>
    </div>
  </Dialog>
</template>

<script lang="ts">
import { NOVEL_ITEM_KEYS } from "@/store/keys";
import { mixins, Options, } from "vue-class-component";
import { Emit, Prop } from "vue-property-decorator";

import { TimelineEventModel } from "@/models/TimelineEvent";
import { BaseModel } from "@/models/Base.model";
import { ChapterModel } from "@/models/Chapter.model";
import { ResearchModel } from "@/models/Research.model";

import EditableDate from "@/components/shared/inline-edit/EditableDate.vue";
import EditableLabel from "@/components/shared/inline-edit/EditableLabel.vue";
import WButton from "@/components/shared/Button.vue";
import WConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import WNovelItemDropdown from "@/components/shared/NovelItemDropdown.vue";
import TimelineEventMixin from "@/components/mixins/TimelineEventMixin";
import WMissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';

@Options({
  components: {
    EditableDate,
    EditableLabel,
    WButton,
    WConfirmDialog,
    WNovelItemDropdown,
    WMissingValueTolerantLabel
  },
  emits: ["close"],
})
export default class WReferenceDialog extends  mixins(TimelineEventMixin)  {
  @Prop() event: TimelineEventModel;
  @Prop() displayDialog = false;

  selectedItemType = null;
  selectedResearch : ResearchModel = null;
  selectedChapter : ChapterModel = null;

  @Emit("close")
  close() {
    return true;
  }

  deleteReference(item: BaseModel, key: NOVEL_ITEM_KEYS) {
    this.$store.dispatch('deleteReference', { 
      novelId: this.novelId,
      event: this.event,
      item: item,
      key: key
    });   
  }

  addReference() {
    if (!this.validReference) return;
    const item = this.selectedItemType === NOVEL_ITEM_KEYS.CHAPTERS ? this.selectedChapter : this.selectedResearch;
    this.$store.dispatch('addReference', { 
      novelId: this.novelId,
      event: this.event,
      item: item,
      key: this.selectedItemType
    });  
    this.selectedChapter = null;
    this.selectedResearch = null;       
  }

  get validReference() {
    return (this.selectedItemType === NOVEL_ITEM_KEYS.CHAPTERS && this.selectedChapter) ||
            (this.selectedItemType === NOVEL_ITEM_KEYS.RESEARCH && this.selectedResearch);    
  }

  get itemTypes(): NOVEL_ITEM_KEYS[] {
    return [NOVEL_ITEM_KEYS.CHAPTERS, NOVEL_ITEM_KEYS.RESEARCH];
  }

  get chapters() {
    return this.referencedItems(NOVEL_ITEM_KEYS.PARTS, NOVEL_ITEM_KEYS.CHAPTERS)
  }

  get research() {
    return this.referencedItems(NOVEL_ITEM_KEYS.RESEARCH_GROUPS, NOVEL_ITEM_KEYS.RESEARCH)
  }

  get novelItemKey() {
    return NOVEL_ITEM_KEYS.TIMELINE;
  }

  get chapterNovelItemKey() {
    return NOVEL_ITEM_KEYS.CHAPTERS;
  }

  get researchNovelItemKey() {
    return NOVEL_ITEM_KEYS.RESEARCH;
  }

  private get novelId(): number {
      return this.$store.getters.openNovelId;
  }

  private referencedItems(parentKey: NOVEL_ITEM_KEYS, childKey: NOVEL_ITEM_KEYS) {
    const itemIds: number[] = this.event[childKey].map(c => c['id']);
    return this.getFlatList(
      parentKey, 
      childKey
    ).filter(chapter => !itemIds.includes(chapter.id));
  }
}
</script>

<style scoped>
.header {
  display: flex;
  width: 100%;
  justify-content: space-between;
}
.add-reference-form {
    display: flex;
    width: 100%;
    justify-content: space-between;
    border-left: 1px solid #e2e2e2;
    border-right: 1px solid #e2e2e2;
    border-bottom: 1px solid #e2e2e2;
}

.add-reference-form .p-dropdown,
.add-reference-form button {
    flex-grow:  1;
    margin: 1em;
}

.existing-reference {
  padding: 1em;
  display: flex;
  width: 100%;
  justify-content: space-between;
  border-right: 1px solid #e2e2e2;
  border-left: 1px solid #e2e2e2;
  border-bottom: 1px solid #e2e2e2;
}

.existing-references .existing-reference:first-child {
  border-top: 1px solid #e2e2e2;
}

</style>
