<template>
  <div class="plot">
    <div class="vertical-menu">
          <Button title="Add new timeline event"
              class="p-button-secondary add-button"
              icon="fa fa-plus fa-2x"
              type="button"
              @click="add" />    
          <Button title="Delete selected event"
              class="p-button-secondary"
              icon="fa fa-trash fa-2x"
              type="button"
    />
    </div>
    <div class="timeline">
      <div class="split-panel">
        <Splitter style="height: 100%" stateKey="timeline">
          <Splitterpanel class="split-content-left">      
              <ScrollPanel style="height: 100%">
                <Timeline :value="events" align="left" class="customized-timeline">
                  <template #opposite="slotProps">
                    <div @click="select(slotProps.item)" v-bind:class="{ 'selected-event': selected(slotProps.item)}" >
                      <EditableDate v-bind:value="slotProps.item.eventDate" @update-label="updateEventDate(slotProps.item, $event)" placeHolderTitle="No date added yet."></EditableDate>
                    </div>
                  </template>
                  <template #marker="slotProps">
                      <div class="custom-marker" @click="select(slotProps.item)" title="Click to select"  v-bind:class="{ 'selected-event': selected(slotProps.item)}" >
                      <i class="fa fa-clock"></i>
                      </div>
                  </template>
                  <template #content="slotProps">
                    <div class="timeline-event-container"  @click="select(slotProps.item)"  v-bind:class="{ 'selected-event': selected(slotProps.item)}" >
                      <EditTimelineEvent :item="slotProps.item"></EditTimelineEvent>
                    </div>
                  </template>
                </Timeline>
              </ScrollPanel>
          </Splitterpanel>
          <Splitterpanel class="split-content-right">
            <ScrollPanel style="height: 100%">

            <div v-if="selectedItem" class="selected-item">
              <Fieldset legend="Referenced chapters">
                <div class="add-reference-form">
                  <Dropdown v-model="selectedChapterReference" :options="chapters" placeholder="Select a chapter" optionLabel="name"  :filter="true">
                  <template #option="slotProps">
                  <div class="p-dropdown-car-option">
                    <span v-if="slotProps.option.name">{{slotProps.option.name}} - {{slotProps.option.summary}} </span>
                    <span v-else><i>No name given</i></span>
                  </div>
                </template>
                </Dropdown>
                <Button title="Add reference to selected Chapter"
                  class="p-button-secondary add-button"
                  icon="fa fa-plus"
                  label="Add reference"
                  type="button"
                  @click="addChapterReference" />
                </div>
              </Fieldset>

              <Accordion :multiple="true">
                <AccordionTab :header="chapter.name" v-for="chapter in selectedItem.chapters" :key="chapter.id">
                  <NovelItemSheet :novelItemKey="chapterNovelItemKey" :item="chapter" :service="chapterService"></NovelItemSheet>
                </AccordionTab>
              </Accordion>

              <Fieldset legend="Referenced research items" style="margin-top: 1em;">
                <div class="add-reference-form">
                  <Dropdown v-model="selectedResearchReference" :options="research" optionLabel="name" placeholder="Select a research item" :filter="true">
                  <template #option="slotProps">
                  <div class="p-dropdown-option">
                    <span v-if="slotProps.option.name">{{slotProps.option.name}}</span>
                    <span v-else><i>No name given</i></span>
                  </div>
                </template>
                </Dropdown>
                <Button title="Add reference to selected research"
                  class="p-button-secondary add-button"
                  icon="fa fa-plus"
                  label="Add reference"
                  type="button"
                  @click="addResearchReference" />
                </div>
              </Fieldset>
            
              <Accordion :multiple="true">
                <AccordionTab :header="research.name" v-for="research in selectedItem.research" :key="research.id">
                  <NovelItemSheet :novelItemKey="researchNovelItemKey" :item="research" :service="researchService"></NovelItemSheet>
                </AccordionTab>
              </Accordion>
            </div> 
            </ScrollPanel>
          </Splitterpanel>

        </Splitter>
      </div>
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
import EditTimelineEvent from "@/components/timeline/EditableTimelineEvent.vue";
import { TimelineEventModel } from "@/models/TimelineEvent";
import { getAllItems, getCurrentSelection, getSortedEvents } from "@/store/getters";
import { ChapterService } from "@/service/Chapter.service";
import { ResearchService } from "@/service/Research.service";

@Options({
  components: {
    NovelItems,
    EditableLabel,
    EditableDate,
    EditTimelineEvent,
    NovelItemSheet
  },
})
export default class Plot extends Vue {
  selectedChapterReference = null; 
  selectedResearchReference = null; 

  add() {
    this.$store.dispatch("addItem", {
      key: this.novelItemKey,
      novelId: this.$store.state.currentNovel?.id,
      item: new TimelineEventModel(),
    });
    var container = this.$el.querySelector(".p-scrollpanel-content");
    container.scrollTop = container.scrollHeight;
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
      key: NOVEL_ITEM_KEYS.CHAPTERS,
      novelId: this.$route.params.id,
    });
    this.$store.dispatch("loadItems", {
      key: NOVEL_ITEM_KEYS.RESEARCH,
      novelId: this.$route.params.id,
    });
  }

  select(item): void {
    this.$store.dispatch('selectItems', { key: this.novelItemKey, items: [item ] });
  }


  updateEventDate(item, newValue: string): void {
    this.updateItem(item, { eventDate: newValue });   
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
    let chapters = getAllItems(this.$store.state, NOVEL_ITEM_KEYS.CHAPTERS);
    return chapters;
  }
  get research() {
    let chapters = getAllItems(this.$store.state, NOVEL_ITEM_KEYS.RESEARCH);
    return chapters;
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

.vertical-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 4em;
  background: var(--tabmenu-background);
  border-right: 1px solid #2d2b2b;
}
.vertical-menu button {
  height: 4em;
  width: 4em !important;
  display: block;
}

.vertical-menu .p-button.p-button-secondary, .p-buttonset.p-button-secondary > .p-button, .p-splitbutton.p-button-secondary > .p-button {
  background-color: transparent;
  border: none;
  border-bottom: 1px solid #2d2b2b;
}

.timeline {
  flex-grow: 2;
  height: calc(100vh - var(--tabmenu-height));
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
  top: 0.5em;
  cursor: pointer;

  justify-content: center;
  align-items: center;

  text-align: center;
  color: white;
}

.p-timeline-event-opposite {
  width: 15em;
  max-width: 15em;
  flex-grow: 1;
  text-align: right;
  padding: 0 !important;

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
  top: 0.5em;
  border-bottom: 1px solid #2d2b2b;
}

.split-content-right {
    background: var(--item-list-background);
}
</style>

<style>
.p-scrollpanel-wrapper {
  z-index: inherit;
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
