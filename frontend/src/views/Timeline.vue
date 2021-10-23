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
                    <div  @click="select(slotProps.item)">
                      <EditableDate v-bind:value="slotProps.item.eventDate" @update-label="updateEventDate(slotProps.item, $event)" placeHolderTitle="No date added yet."></EditableDate>
                    </div>
                  </template>
                  <template #marker="slotProps">
                    <div class="custom-marker" @click="select(slotProps.item)" title="Click to select">
                      <i class="fa fa-clock"></i>
                      </div>
                  </template>
                  <template #content="slotProps">
                    <div  @click="select(slotProps.item)">
                      <EditTimelineEvent :item="slotProps.item"></EditTimelineEvent>
                    </div>
                  </template>
                </Timeline>
              </ScrollPanel>
          </Splitterpanel>
          <Splitterpanel class="split-content-right">
            <ScrollPanel style="height: 100%">

            <div v-if="selectedItem">
              Select referenced chapter
              <Dropdown v-model="selectedChapterReference" :options="chapters" optionLabel="name" placeholder="Select a chapter" :filter="true">
                <template #option="slotProps">
                <div class="p-dropdown-car-option">
                  <span v-if="slotProps.option.name">{{slotProps.option.name}}</span>
                  <span v-else><i>No name given</i></span>
                </div>
              </template>
              </Dropdown>
              <Button title="Add reference to selected Chapter"
                class="p-button-secondary add-button"
                icon="fa fa-plus"
                type="button"
                @click="addChapterReference" /> 


             Select referenced research
              <Dropdown v-model="selectedResearchReference" :options="research" optionLabel="name" placeholder="Select a research" :filter="true">
                <template #option="slotProps">
                <div class="p-dropdown-car-option">
                  <span v-if="slotProps.option.name">{{slotProps.option.name}}</span>
                  <span v-else><i>No name given</i></span>
                </div>
              </template>
              </Dropdown>
              <Button title="Add reference to selected research"
                class="p-button-secondary add-button"
                icon="fa fa-plus"
                type="button"
                @click="addResearchReference" /> 

                            {{ selectedItem }} 

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
import EditableLabel from "@/components/shared/inline-edit/EditableLabel.vue";
import EditableDate from "@/components/shared/inline-edit/EditableDate.vue";
import EditTimelineEvent from "@/components/timeline/EditableTimelineEvent.vue";
import { TimelineEventModel } from "@/models/TimelineEvent";
import { getAllItems, getCurrentSelection, getSortedEvents } from "@/store/getters";

@Options({
  components: {
    NovelItems,
    EditableLabel,
    EditableDate,
    EditTimelineEvent,
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

  get chapters() {
    let chapters = getAllItems(this.$store.state, NOVEL_ITEM_KEYS.CHAPTERS);
    return chapters;
  }
  get research() {
    let chapters = getAllItems(this.$store.state, NOVEL_ITEM_KEYS.RESEARCH);
    return chapters;
  }

  get selectedItem() {
    return (getCurrentSelection(this.$store.state, this.novelItemKey) || [{}])[0];
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
  background-color: #2d2b2b;
  border-radius: 50%;
  width: 1.5em;
  height: 1.5em;
  cursor: pointer;

  justify-content: center;
  align-items: center;

  text-align: center;
  color: white;
}

.p-timeline-event-opposite {
  width: 12em;
  max-width: 12em;
  flex-grow: 1;
  text-align: right;

}

.p-timeline-event-content {
  flex-grow: 2;
  position: relative;
}

.p-timeline-event-content:before {
  content: '';
  position:absolute;
  width: 5em;
  height: 10px;
  left: 0;
  top: 0;
  border-bottom: 1px solid #2d2b2b;
}

.split-content-right {
    background: var(--item-list-background);
}
</style>

<style>
.p-timeline {
  padding-top: 2em;
}

.p-timeline-event .p-timeline-event-separator .p-timeline-event-connector {
  background-color: #2d2b2b;
}
</style>
