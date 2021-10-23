<template>
  <!--<div class="menubar">
      <div class="menu">
          <Button class="p-button-text p-button-secondary" icon="fa fa-file" type="button" label="File" @click="toggle" />
          <Menu ref="menu" :model="menuItems" :popup="true" />
      </div>
  </div>-->
    <ScrollPanel style="height: 100%">
      <Timeline :value="events" align="alternate" class="customized-timeline">
        <template #marker="slotProps">
          <div v-if="isNew(slotProps.item)">
            <Button
              class="p-button-primary"
              icon="fa fa-plus"
              type="button"
              label="Add"
              @click="add"
            />
          </div>
          <div v-else>
            <div class="custom-marker">
              <i class="fa fa-clock"></i>
            </div>
          </div>
        </template>
        <template #content="slotProps">
          <EditTimelineEvent :item="slotProps.item"></EditTimelineEvent>
        </template>
      </Timeline>
    </ScrollPanel>
</template>

<script lang="ts">
import { NOVEL_ITEM_KEYS } from "@/store/keys";
import { Options, Vue } from "vue-class-component";
import NovelItems from "./NovelItems.vue";
import EditableLabel from "@/components/shared/inline-edit/EditableLabel.vue";
import EditTimelineEvent from "@/components/timeline/EditableTimelineEvent.vue";
import { TimelineEventModel } from "@/models/TimelineEvent";
import { getAllItems } from "@/store/getters";
import Menu from "primevue/menu";

@Options({
  components: {
    NovelItems,
    EditableLabel,
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
  }

  mounted(): void {
    this.$store.dispatch("loadItems", {
      key: NOVEL_ITEM_KEYS.TIMELINE,
      novelId: this.$route.params.id,
    });
  }

  toggle(event) {
    (this.$refs.menu as Menu).toggle(event);
  }

  isNew(item) {
    return item.id === undefined;
  }

  get menuItems(): Array<{ label: string; icon: string; command? }> {
    return [
      {
        label: "Add",
        icon: "fa fa-plus",
        command: () => {
          // this.addItem();
        },
      },
      //this.getDeleteMenuItem()
    ];
  }

  get events() {
    console.log("getting events...");
    const events = getAllItems(this.$store.state, this.novelItemKey);
    events.splice(0, 0, new TimelineEventModel());
    return events;
  }

  get novelItemKey() {
    return NOVEL_ITEM_KEYS.TIMELINE;
  }
}
</script>

<style>
.timeline-wrapper {
  margin-top: 1em;
}
.custom-marker {
  display: flex;
  background-color: #2d2b2b;
  border-radius: 50%;
  width: 1.5em;
  height: 1.5em;

  justify-content: center;
  align-items: center;

  text-align: center;
  color: white;
}
</style>

<style>
.p-timeline-event .p-timeline-event-separator .p-timeline-event-connector {
  background-color: #2d2b2b;
}
</style>
