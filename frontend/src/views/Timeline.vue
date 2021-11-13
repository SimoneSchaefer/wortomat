<template>
  <WSidebarMenu :parentKey="parentKey"/>


  <div class="plot">
    <div v-if="!events.length && !isLoading()" class="empty">
      <WHelpNote :itemKey="parentKey"></WHelpNote>
    </div>
    <div v-else class="timeline">
        <Splitter style="height: 100%" stateKey="timeline">
          <SplitterPanel>      
              <ScrollPanel style="height: 100%">
                <WTimeline 
                  :events="events" 
                  :selectedEvent="selectedItem"
                  @update-date="updateDate"
                  @update-name="updateName"
                  @select="select"
                  @deleteEvent="deleteEvent($event)"></WTimeline>
              </ScrollPanel>
          </SplitterPanel>
          <SplitterPanel class="split-content-right sheet-list">
            <ScrollPanel style="height: 100%">
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
import { mixins, Options, Vue } from "vue-class-component";
import NovelItems from "./NovelItems.vue";
import NovelItemSheet from "@/components/shared/novel-item/NovelItemSheet.vue";
import TimelineEventMixin from "@/components/mixins/TimelineEventMixin";
import EditableLabel from "@/components/shared/inline-edit/EditableLabel.vue";
import EditableDate from "@/components/shared/inline-edit/EditableDate.vue";
import WSidebarMenu from "@/components/shared/menu/SidebarMenu.vue";
import { TimelineEventModel } from "@/models/TimelineEvent";
import { getAllItems, getCurrentSelection, getSortedEvents } from "@/store/getters";
import { ChapterService } from "@/service/Chapter.service";
import { ResearchService } from "@/service/Research.service";
import WTimeline from "@/components/timeline/Timeline.vue";
import WNovelItemDropdown from '@/components/shared/NovelItemDropdown.vue';
import WHelpNote from '@/components/HelpNote.vue';
import { ChapterModel } from "@/models/Chapter.model";
import { ResearchModel } from "@/models/Research.model";

@Options({
  components: {
    NovelItems,
    EditableLabel,
    EditableDate,
    NovelItemSheet,
    WSidebarMenu,
    WTimeline,
    WNovelItemDropdown,
    WHelpNote
  },
})
export default class Plot extends mixins(TimelineEventMixin) {

  add() {
    this.$store.dispatch("addItem", {
      key: this.novelItemKey,
      novelId: this.$store.state.currentNovel?.id,
      item: new TimelineEventModel(),
    });
    var container = this.$el.querySelector(".p-scrollpanel-content");
    container.scrollTop = container.scrollHeight;
  }

  isLoading(): boolean {
    return this.$store.state.loading;
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

  deleteEvent(event: TimelineEventModel) {
    this.$store.dispatch('deleteItems', { 
        key: this.novelItemKey, 
        novelId: this.$store.state.currentNovel?.id,
        items: [event]
    });
  }


  updateName(update: { newValue: string, item: TimelineEventModel }): void {
    this.updateItem(update.item, { name: update.newValue });   
  } 

  updateDate(update: { newValue: string, item: TimelineEventModel }): void {
    this.updateItem(update.item, { eventDate: update.newValue });   
  }  


  /*addReference($event) {
    const event = $event.event;
    console.log('add references for ', $event)
    for (const chapter of $event.reference.chapters) {
      this.addChapterReference(event, chapter);
    }
    for (const research of $event.reference.research) {
      this.addResearchReference(event, research);
    }

  }*/
 

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

.empty {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
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

