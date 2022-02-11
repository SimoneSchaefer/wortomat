<template>
  <WSidebarOpener icon="fa fa-2x fa-plus" @click="add" />
  <div class="plot">
    <div v-if="!sortedTimelineEvents.length && loading" class="empty">
      <WHelpNote :itemKey="parentKey"></WHelpNote>
    </div>
    <div v-else class="timeline">
        <Splitter style="height: 100%" stateKey="timeline">
          <SplitterPanel>      
              <ScrollPanel style="height: 100%" class="scroll-timeline">
                <WTimeline 
                  :events="sortedTimelineEvents" 
                  :selectedEvents="selectedItems"
                  @update-date="updateDate"
                  @update-name="updateName"
                  @select="select"
                  @deleteEvent="deleteEvent($event)"></WTimeline>
              </ScrollPanel>
          </SplitterPanel>
          <SplitterPanel class="split-content-right sheet-list">
            <ScrollPanel style="height: 100%">
              <div v-if="selectedItems.length" class="selected-item sheet-list"> 
                <div v-for="selectedItem of selectedItems" :key="selectedItem.id">
                  <div v-for="referenceType of allowedReferences" v-bind:key="referenceType">
                    <div v-for="eventReference of getExistingEventReferences(selectedItem, referenceType)" v-bind:key="eventReference.id" class="existing-reference">
                      <NovelItemSheet :novelItemKey="referenceType" :item="eventReference" :service="getService(referenceType)"></NovelItemSheet>
                    </div>
                  </div>  
                </div>                    
              </div>
            </ScrollPanel>
          </SplitterPanel>
        </Splitter>
      </div>
  </div>
</template>

<script lang="ts">
import { mixins, Options } from "vue-class-component";
import { namespace } from "s-vuex-class";

import { childKeyForParentKey, NOVEL_ITEM_KEYS, PARENT_ITEM_KEYS } from "@/store/keys";
import NovelItemSheet from "@/components/shared/novel-item/NovelItemSheet.vue";
import TimelineEventMixin from "@/components/mixins/TimelineEventMixin";
import EditableLabel from "@/components/forms/inline-edit/EditableLabel.vue";
import EditableDate from "@/components/forms/inline-edit/EditableDate.vue";
import WSidebarOpener from "@/components/shared/menu/SidebarOpener.vue";
import WTimeline from "@/components/timeline/Timeline.vue";
import WNovelItemDropdown from '@/components/shared/NovelItemDropdown.vue';
import WHelpNote from '@/components/HelpNote.vue';
import { BaseModel } from "@/models/Base.model";
import { TimelineEventModel } from "@/models/TimelineEvent";

const novelDataModule = namespace("novelData");
const selectionModule = namespace("selection");

@Options({
  components: {
    EditableLabel,
    EditableDate,
    NovelItemSheet,
    WSidebarOpener,
    WTimeline,
    WNovelItemDropdown,
    WHelpNote
  },
})
export default class Plot extends mixins(TimelineEventMixin) {
  @novelDataModule.Action
  loadNovelItems!: ({ view: PARENT_ITEM_KEYS, novelId: number }) => Promise<void>;
  
  @novelDataModule.Action
  addNovelItem!: (payload: { view: PARENT_ITEM_KEYS, novelItem: BaseModel }) => Promise<void>;

  @novelDataModule.Action
  updateNovelItem: (payload: { view: PARENT_ITEM_KEYS, novelItem: BaseModel}) => Promise<void>;

  @novelDataModule.Action
  deleteNovelItem!: (payload: { view: PARENT_ITEM_KEYS, novelItem: BaseModel}) => Promise<void>;

  @selectionModule.Action
  selectItemIds!: ( payload: { view: PARENT_ITEM_KEYS, itemIds: number[]} ) => Promise<void>;

  @selectionModule.State('_selectedItemIds')
  _selectedItemIds!: Map<PARENT_ITEM_KEYS, number[]>;


  @novelDataModule.State('_novelId')
  novelId!: number;   
    
  @novelDataModule.State('_loading')
  loading!: boolean;
    
  @novelDataModule.Getter
  sortedTimelineEvents!: TimelineEventModel[];
  

  allowedReferences = [
    PARENT_ITEM_KEYS.PARTS,
    PARENT_ITEM_KEYS.RESEARCH_GROUPS,
    PARENT_ITEM_KEYS.LOCATION_GROUPS,
    PARENT_ITEM_KEYS.CHARACTER_GROUPS,
  ]

  mounted(): void {
    this.loadNovelItems({ view: PARENT_ITEM_KEYS.TIMELINE, novelId: this.$route.params.id})
    for (let key of this.allowedReferences) {
      this.loadNovelItems({ view: key, novelId: this.$route.params.id})
    }
  }

  add() {
    this.addNovelItem({ view: PARENT_ITEM_KEYS.TIMELINE, novelItem: new TimelineEventModel() });
  }

  getExistingEventReferences(event: TimelineEventModel, key: PARENT_ITEM_KEYS) {
    return this.referencedItems(event, key);
  }

  getParentKey(childKey: NOVEL_ITEM_KEYS) {
    return PARENT_ITEM_KEYS.TIMELINE// TODO
  }

  get parentKey() {
    return NOVEL_ITEM_KEYS.TIMELINE;
  }

  select(item): void {
    this.selectItemIds({ view: PARENT_ITEM_KEYS.TIMELINE, itemIds: [item.id]});
  }

  deleteEvent(event: TimelineEventModel) {
    this.deleteNovelItem({ view: PARENT_ITEM_KEYS.TIMELINE, novelItem: event });
  }

  updateName(update: { newValue: string, item: TimelineEventModel }): void {
    this.updateItem(update.item, { name: update.newValue });   
  } 

  updateDate(update: { newValue: string, item: TimelineEventModel }): void {
    this.updateItem(update.item, { eventDate: update.newValue });   
  }  

  selected(item) {
    return this.selectedItems.find(selected => selected === item.id);
  }
 
  get selectedItemIds(): number[] {
    return this._selectedItemIds.get(PARENT_ITEM_KEYS.TIMELINE) || [];
  }
  get selectedItems(): TimelineEventModel[] {
    return this.sortedTimelineEvents.filter(event => this.selectedItemIds.includes(event.id));
  }

  private updateItem(item, overrideValues): void {
    const newItem =  Object.assign({}, item, overrideValues);  
    this.updateNovelItem({ view: PARENT_ITEM_KEYS.TIMELINE, novelItem: newItem});  
  }

  private referencedItems(event: TimelineEventModel, parentKey: PARENT_ITEM_KEYS, mustInclude = true) {
    const itemIds: number[] = event['references'][childKeyForParentKey(parentKey).toUpperCase()];
    return this.getFlatList(
      parentKey, 
    ).filter(child => itemIds.includes(child.id) === mustInclude);
  }

  get novelItemKey() {
    return NOVEL_ITEM_KEYS.TIMELINE;
  }
}
</script>

<style>

.empty {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
}

.scroll-timeline {
  background: var(--light-background)
}

.p-scrollpanel-wrapper {

  z-index: inherit !important;
}

.reference-options {
  display: flex;
  background: var(--editor-toolbar-background);
}

.sheet-list {
  background: var(--sheet-list-background)
}

.selected-item {
  margin: 1em;
}

.selected-event {
  background-color: pink;
  height: 100%;
}

.split-panel {
  height: 100%;
}
.plot {
  display: flex;
  width: 100%;
}

.timeline-event-container {
  padding: 0.5em 2em;
}

.timeline {
  flex-grow: 2;
  height: calc(100vh);
}

.timeline-wrapper {
  margin-top: 1em;
}

.custom-marker {
  display: flex;
  z-index: 2;
  background-color: #2d2b2b;
  border-radius: 50%;
  width: 1.5em;
  height: 1.5em;
  position: absolute;
  top: 1.5em;
  cursor: pointer;

  justify-content: center;
  align-items: center;

  text-align: center;
  color: white;
}

.event-date {
  display: flex;
  align-items: center;
  width: 100%;
}
</style>

