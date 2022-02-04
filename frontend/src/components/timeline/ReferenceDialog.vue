<template>
  <Dialog :visible="displayDialog" :closable="false" :modal="true" style="width: 50em">
    <template #header>
      <div class="header">
        <h3>{{ $t("timeline.manage_references") }}</h3>
        <WButton @click="close" type="text" icon="fa fa-times" title="timeline.select_reference_type.close"/>
      </div>
    </template>

    <div class="existing-references">
      <div v-for="referenceType of allowedReferences" v-bind:key="referenceType">
        <div v-for="eventReference of getExistingEventReferences(referenceType)" v-bind:key="eventReference.id" class="existing-reference">
          <div class="details">
            <i class="type-indicator" v-bind:class="`fa fa-${getIconForType(referenceType)}`"></i>
            <WMissingValueTolerantLabel :value="eventReference.name" :fallback="$t(`fallback_labels.no_name.${referenceType}`)"></WMissingValueTolerantLabel>
          </div>
          <WButton color="danger" type="text"
            @click="deleteReference(eventReference, referenceType)" 
            :title="`timeline.select_reference_type.delete`" 
            icon="fa fa-trash" />
        </div>
      </div>
    </div>

    <div class="add-reference-form">
      <Dropdown
        v-model="selectedReferenceType"
        :options="allowedReferences"
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

      <WNovelItemDropdown v-if="selectedReferenceType"
        @change="selectReferenceItem($event)"
        :items="selectableReferenceItems"
        :selectedItem="selectedReferenceItem"
        :novelItemKey="selectedReferenceType"
        :placeHolder="`timeline.select_${selectedReferenceType}`" >
      </WNovelItemDropdown>


      <div class="option-groups">
        <WButton :disabled="!selectedReferenceItem" type="text"
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

import EditableDate from "@/components/forms/inline-edit/EditableDate.vue";
import EditableLabel from "@/components/forms/inline-edit/EditableLabel.vue";
import WButton from "@/components/forms/Button.vue";
import WConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import WNovelItemDropdown from "@/components/shared/NovelItemDropdown.vue";
import TimelineEventMixin from "@/components/mixins/TimelineEventMixin";
import WMissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';
import { KEY_TO_CHILD } from "@/store/store-api-adapter";

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

  allowedReferences = [
    NOVEL_ITEM_KEYS.CHAPTERS,
    NOVEL_ITEM_KEYS.RESEARCH,
    NOVEL_ITEM_KEYS.LOCATIONS,
    NOVEL_ITEM_KEYS.CHARACTERS,
  ]
  selectedReferenceType: NOVEL_ITEM_KEYS = null;
  selectedReferenceItems = new Map();


  @Emit("close")
  close() {
    return true;
  }

  selectReferenceItem(baseModel: BaseModel) {
    this.selectedReferenceItems.set(this.selectedReferenceType, baseModel);
  }

  getExistingEventReferences(key: NOVEL_ITEM_KEYS) {
    return this.referencedItems(this.getParentKey(key), key);
  }

  getIconForType(key: NOVEL_ITEM_KEYS) {
    switch (key) { 
      case NOVEL_ITEM_KEYS.CHAPTERS:
        return 'book-open'
      case NOVEL_ITEM_KEYS.CHARACTERS:
        return 'users'
      case NOVEL_ITEM_KEYS.LOCATIONS:
        return 'map'
      case NOVEL_ITEM_KEYS.RESEARCH:
        return 'flask'     
    }
    return 'question-mark';
  }

  get selectedReferenceItem() {
    return this.selectedReferenceItems.get(this.selectedReferenceType);
  }

  get selectableReferenceItems() {
    return this.referencedItems(this.getParentKey(this.selectedReferenceType), this.selectedReferenceType, false);
  }

  getParentKey(childKey: NOVEL_ITEM_KEYS) {
    return [...KEY_TO_CHILD].find(([_key, value]) => childKey === value)[0];
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
    const item = this.selectedReferenceItem;
    this.$store.dispatch('addReference', { 
      novelId: this.novelId,
      event: this.event,
      item: item,
      key: this.selectedReferenceType
    });  
    this.selectedReferenceItems = new Map();      
  }

  get novelItemKey() {
    return NOVEL_ITEM_KEYS.TIMELINE;
  }

  private get novelId(): number {
      return this.$store.getters.openNovelId;
  }

  private referencedItems(parentKey: NOVEL_ITEM_KEYS, childKey: NOVEL_ITEM_KEYS, mustInclude = true) {
    const itemIds: number[] = this.event['references'][childKey.toUpperCase()];
    return this.getFlatList(
      parentKey, 
    ).filter(child => itemIds.includes(child.id) === mustInclude);
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

.type-indicator {
  opacity: 0.8;
  padding-right: 1em;
}

.existing-references {
  border-top: 1px solid #e2e2e2;
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

.existing-reference .details {
  display: flex;
  align-items: center;
}
</style>
