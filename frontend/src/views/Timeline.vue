<template>
  <WTimelineSidebarMenu :parentKey="parentKey"/>
  <div class="plot">
    <div class="timeline">
        <Splitter style="height: 100%" stateKey="timeline">
          <SplitterPanel>      
              <ScrollPanel style="height: 100%">
                <WTimeline 
                  :events="events" 
                  :selectedEvent="selectedItem"
                  @update-date="updateDate"
                  @update-name="updateName"
                  @select="select"></WTimeline>
              </ScrollPanel>
          </SplitterPanel>
          <SplitterPanel class="split-content-right sheet-list">
            <ScrollPanel style="height: 100%">
              <div class="reference-options">
                <div class="add-reference-form">
                <WNovelItemDropdown :items="chapters" @change="onChapterChange" :novelItemKey="chapterNovelItemKey" placeHolder="timeline.select_chapter"></WNovelItemDropdown>

                <Button title="Add reference to selected Chapter"
                  class="p-button-secondary add-button"
                  icon="fa fa-plus"
                  label="Add"
                  type="button"
                  @click="addChapterReference" />
                </div>

                <div class="add-reference-form">
               
                <WNovelItemDropdown :items="research" @change="onResearchChange" :novelItemKey="researchNovelItemKey" placeHolder="timeline.select_research"></WNovelItemDropdown>

                <Button title="Add reference to selected research"
                  class="p-button-secondary add-button"
                  icon="fa fa-plus"
                  label="Add"
                  type="button"
                  @click="addResearchReference" />
                </div>

              </div>

            <div v-if="selectedItem" class="selected-item">
              <div class="sheet-list" v-for="chapter in getChaptersForEvent(selectedItem)" :key="chapter.id">
                <NovelItemSheet :novelItemKey="chapterNovelItemKey" :item="chapter" :service="chapterService"></NovelItemSheet>
              </div>

              <div class="sheet-list" v-for="research in getResearchForEvent(selectedItem)" :key="research.id">
                <NovelItemSheet :novelItemKey="researchNovelItemKey" :item="research" :service="researchService"></NovelItemSheet>
              </div>

           
            </div> 
            </ScrollPanel>
          </SplitterPanel>

        </Splitter>
      </div>
  </div>
</template>

<script lang="ts">
import { NOVEL_ITEM_KEYS } from "@/store/keys";
import { Options, Vue } from "vue-class-component";
import NovelItems from "./NovelItems.vue";
import NovelItemSheet from "@/components/shared/novel-item/NovelItemSheet.vue";
import EditableLabel from "@/components/shared/inline-edit/EditableLabel.vue";
import EditableDate from "@/components/shared/inline-edit/EditableDate.vue";
import WTimelineSidebarMenu from "@/components/shared/menu/TimelineSidebarMenu.vue";
import EditTimelineEvent from "@/components/timeline/EditableTimelineEvent.vue";
import { TimelineEventModel } from "@/models/TimelineEvent";
import { getAllItems, getCurrentSelection, getSortedEvents } from "@/store/getters";
import { ChapterService } from "@/service/Chapter.service";
import { ResearchService } from "@/service/Research.service";
import WTimeline from "@/components/timeline/Timeline.vue";
import WNovelItemDropdown from '@/components/shared/NovelItemDropdown.vue';

@Options({
  components: {
    NovelItems,
    EditableLabel,
    EditableDate,
    EditTimelineEvent,
    NovelItemSheet,
    WTimelineSidebarMenu,
    WTimeline,
    WNovelItemDropdown
  },
})
export default class Plot extends Vue {
  selectedChapterReference = null; 
  selectedResearchReference = null;

  getChaptersForEvent(event: TimelineEventModel) {
    // TODO: get only list of IDs from backend
    let flatList = [];
    for (const part of getAllItems(this.$store.state, NOVEL_ITEM_KEYS.PARTS)) {
      flatList = flatList.concat(part.chapters);
    }
    const eventChapters = [];
    for (const chapter of event.chapters) {
      eventChapters.push(flatList.find(otherChapter => otherChapter.id === chapter['id']));
    }
    return eventChapters;
  }
  getResearchForEvent(event: TimelineEventModel) {
    // TODO: get only list of IDs from backend
    let flatList = [];
    for (const group of getAllItems(this.$store.state, NOVEL_ITEM_KEYS.RESEARCH_GROUPS)) {
      flatList = flatList.concat(group.research);
    }

    const eventResearch = [];
    for (const research of event.research) {
      const bla = flatList.find(otherresearch => otherresearch.id === research['id']);
      if (bla) {
      eventResearch.push(flatList.find(otherresearch => otherresearch.id === research['id']));

      }
    }

    return eventResearch || [];
  }
  
  onChapterChange($event) {
    this.selectedChapterReference = $event;
  }  
  onResearchChange($event) {
    this.selectedResearchReference = $event;
  }

  add() {
    this.$store.dispatch("addItem", {
      key: this.novelItemKey,
      novelId: this.$store.state.currentNovel?.id,
      item: new TimelineEventModel(),
    });
    var container = this.$el.querySelector(".p-scrollpanel-content");
    container.scrollTop = container.scrollHeight;
  }

  get parentKey() {
    return NOVEL_ITEM_KEYS.TIMELINE;
  }
  get chapterNovelItemKey() {
    return NOVEL_ITEM_KEYS.CHAPTERS;
  }
  get researchNovelItemKey() {
    return NOVEL_ITEM_KEYS.RESEARCH;
  }
  get chapterService() {
    return new ChapterService();
  }
  get researchService() {
    return new ResearchService();
  }

  mounted(): void {
    this.$store.dispatch("loadItems", {
      key: NOVEL_ITEM_KEYS.TIMELINE,
      novelId: this.$route.params.id,
    });
    this.$store.dispatch("loadItems", {
      key: NOVEL_ITEM_KEYS.PARTS,
      novelId: this.$route.params.id,
    });
    this.$store.dispatch("loadItems", {
      key: NOVEL_ITEM_KEYS.RESEARCH_GROUPS,
      novelId: this.$route.params.id,
    });
  }

  select(item): void {
    this.$store.dispatch('selectItems', { key: this.novelItemKey, items: [item ] });
  }


  updateName(update: { newValue: string, item: TimelineEventModel }): void {
    this.updateItem(update.item, { name: update.newValue });   
  } 

  updateDate(update: { newValue: string, item: TimelineEventModel }): void {
    console.log('UPDATE DAE', update)
    this.updateItem(update.item, { name: update.newValue });   
  }  

  addChapterReference() {
        this.$store.dispatch('addChapterReference', { 
          novelId: this.novelId,
          event: this.selectedItem,
          chapter: this.selectedChapterReference
      }) 

  }
  addResearchReference() {
        this.$store.dispatch('addResearchReference', { 
          novelId: this.novelId,
          event: this.selectedItem,
          research: this.selectedResearchReference
      }) 

  }

  selected(item) {
    return this.selectedItem?.id === item.id;
  }

  get chapters() {
    let flatList = [];
    let groups = getAllItems(this.$store.state, NOVEL_ITEM_KEYS.PARTS); //.map(part => part.research);
    for (let group of groups) {
      flatList = flatList.concat(group.chapters);
    }
    return flatList;
  }

  get research() {
    let flatList = [];
    let groups = getAllItems(this.$store.state, NOVEL_ITEM_KEYS.RESEARCH_GROUPS); //.map(part => part.research);
    for (let group of groups) {
      flatList = flatList.concat(group.research);
    }
    return flatList;
  }

  get selectedItem() {
    return (getCurrentSelection(this.$store.state, this.novelItemKey) || [{ id: undefined}])[0];
  }

  private updateItem(item, overrideValues): void {
      this.$store.dispatch('updateItem', { 
          key: NOVEL_ITEM_KEYS.TIMELINE, 
          novelId: this.novelId,
          oldItem: item,
          overrideValues: overrideValues
      })  
  }

  private get novelId(): number {
      return this.$store.getters.openNovelId;
  }

  get events() {
    return getSortedEvents(this.$store.state);
  }

  get novelItemKey() {
    return NOVEL_ITEM_KEYS.TIMELINE;
  }
}
</script>

<style>

.reference-options {
  display: flex;
  background: var(--editor-toolbar-background);
}

.sheet-list {
  background: var(--sheet-list-background)
}

.add-reference-form {
  margin-top: 1em;
}
.selected-item {
  margin: 1em;
}

.selected-event {
  background-color: pink;
  height: 100%;
}
.add-button {
  border-top: 1px solid #2d2b2b !important;
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


.sidebar-opener {
  position: fixed; 
  right: 0;
  top: 50px;
  width: 5em !important;
  height: 5em;
  z-index: 9999;
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

.p-timeline-event-opposite {
  width: 13em;
  max-width: 13em;
  flex-grow: 1;
  text-align: right;
  padding: 0 !important;
  display: flex;

}

.p-timeline-event-content {
  flex-grow: 2;
  position: relative;
  padding: 0 !important;
}

.p-timeline-event-content:before {
  content: '';
  position:absolute;
  width: 5em;
  height: 10px;
  left: 0;
  top: 1.5em;
  border-bottom: 1px solid #2d2b2b;
}


.event-date {
  display: flex;
  align-items: center;
  width: 100%;
}
</style>

<style>

.p-timeline-event:hover {
  background-color: pink;
  cursor: pointer;
}
.p-scrollpanel-wrapper {
  z-index: inherit !important;
}
.p-timeline {
  padding-top: 2em;
  padding-bottom: 70px;
}

.p-timeline-event .p-timeline-event-separator .p-timeline-event-connector {
  background-color: #2d2b2b;
}

.p-timeline-event-separator {
  width: 3em;
}
</style>
