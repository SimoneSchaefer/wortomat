<template>
  <div class="plot">
    <div class="vertical-menu">
          <Button title="Add new timeline event"
              class="p-button-secondary"
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
            {{ selectedItem }}  
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
import { getCurrentSelection, getSortedEvents } from "@/store/getters";

@Options({
  components: {
    NovelItems,
    EditableLabel,
    EditableDate,
    EditTimelineEvent,
  },
})
export default class Plot extends Vue {
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
  }

  select(item): void {
    this.$store.dispatch('selectItems', { key: this.novelItemKey, items: [item ] });
  }


  updateEventDate(item, newValue: string): void {
    this.updateItem(item, { eventDate: newValue });   
  }  

  get selectedItem() {
    console.log('SELECTED', this.$store.state)
    return getCurrentSelection(this.$store.state, this.novelItemKey);
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
  width: 5em;
  background: var(--tabmenu-background);
  border-right: 1px solid #2d2b2b;
}
.vertical-menu button {
  height: 5em;
  width: 5em !important;
  display: block;
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
