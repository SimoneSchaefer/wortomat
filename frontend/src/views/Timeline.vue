<template>
 <ScrollPanel style="height: 100%" class="scroll-timeline">
  <div class="timeline">
    <div class="connection"></div>
    <div class="events">
      <div v-for="event of sortedTimelineEvents" class="row" v-bind:key="event.id">
         <div class="summary">
           {{event.details}}
           {{event.name}}
          </div>
        <div class="thumbnail">
          <img src="/assets/images/dummy-gallery-item/CHARACTERS.jpg" />
        </div>
        <div class="details">{{event.summary}}</div>
      </div>
    </div>
  </div>
 </ScrollPanel>
</template>

<script lang="ts">
import { mixins, Options } from "vue-class-component";
import { namespace } from "s-vuex-class";

import { childKeyForParentKey, PARENT_ITEM_KEYS } from "@/store/keys";

import { BaseModel } from "@/models/Base.model";
import { TimelineEventModel } from "@/models/TimelineEvent";

import NovelItemSheet from "@/components/shared/novel-item/NovelItemSheet.vue";
import TimelineEventMixin from "@/components/mixins/TimelineEventMixin";
import EditableLabel from "@/components/forms/inline-edit/EditableLabel.vue";
import EditableDate from "@/components/forms/inline-edit/EditableDate.vue";
import WSidebarOpener from "@/components/shared/menu/SidebarOpener.vue";
import WTimeline from "@/components/timeline/Timeline.vue";
import WNovelItemDropdown from "@/components/shared/NovelItemDropdown.vue";
import WHelpNote from "@/components/HelpNote.vue";
import WSubMenuLink from "@/components/navigation/submenu/SubMenuLink.vue";

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
    WHelpNote,
    WSubMenuLink,
  },
})
export default class Plot extends mixins(TimelineEventMixin) {
  @novelDataModule.Action
  loadNovelItems!: ({
    view: PARENT_ITEM_KEYS,
    novelId: number,
  }) => Promise<void>;

  @novelDataModule.Action
  addNovelItem!: (payload: {
    view: PARENT_ITEM_KEYS;
    novelItem: BaseModel;
  }) => Promise<void>;

  @novelDataModule.Action
  updateNovelItem: (payload: {
    view: PARENT_ITEM_KEYS;
    novelItem: BaseModel;
  }) => Promise<void>;

  @novelDataModule.Action
  deleteNovelItem!: (payload: {
    view: PARENT_ITEM_KEYS;
    novelItem: BaseModel;
  }) => Promise<void>;

  @selectionModule.Action
  selectItemIds!: (payload: {
    view: PARENT_ITEM_KEYS;
    itemIds: number[];
  }) => Promise<void>;

  @selectionModule.State("_selectedItemIds")
  _selectedItemIds!: Record<PARENT_ITEM_KEYS, number[]>;

  @novelDataModule.State("_loading")
  loading!: boolean;

  @novelDataModule.Getter
  sortedTimelineEvents!: TimelineEventModel[];

  mounted(): void {
    this.loadNovelItems({
      view: PARENT_ITEM_KEYS.TIMELINE,
      novelId: this.$route.params.id,
    });
    for (let key of this.allowedReferences) {
      this.loadNovelItems({ view: key, novelId: this.$route.params.id });
    }
  }

  add() {
    this.addNovelItem({
      view: PARENT_ITEM_KEYS.TIMELINE,
      novelItem: new TimelineEventModel(),
    });
  }

  getExistingEventReferences(event: TimelineEventModel, key: PARENT_ITEM_KEYS) {
    return this.referencedItems(event, key);
  }

  select(item): void {
    this.selectItemIds({ view: PARENT_ITEM_KEYS.TIMELINE, itemIds: [item.id] });
  }

  deleteEvent(event: TimelineEventModel) {
    this.deleteNovelItem({ view: PARENT_ITEM_KEYS.TIMELINE, novelItem: event });
  }

  updateName(update: { newValue: string; item: TimelineEventModel }): void {
    this.updateItem(update.item, { name: update.newValue });
  }

  updateDate(update: { newValue: string; item: TimelineEventModel }): void {
    this.updateItem(update.item, { eventDate: update.newValue });
  }

  selected(item: TimelineEventModel): boolean {
    return !!this.selectedItemIds.find((selected) => selected === item.id);
  }

  private updateItem(item, overrideValues): void {
    const newItem = Object.assign({}, item, overrideValues);
    this.updateNovelItem({
      view: PARENT_ITEM_KEYS.TIMELINE,
      novelItem: newItem,
    });
  }

  private referencedItems(
    event: TimelineEventModel,
    parentKey: PARENT_ITEM_KEYS,
    mustInclude = true
  ) {
    const itemIds: number[] =
      event["references"][childKeyForParentKey(parentKey).toUpperCase()];
    return this.getFlatList(parentKey).filter(
      (child) => itemIds.includes(child.id) === mustInclude
    );
  }

  get parentKey() {
    return PARENT_ITEM_KEYS.TIMELINE;
  }
  get selectedItemIds(): number[] {
    return this._selectedItemIds[PARENT_ITEM_KEYS.TIMELINE] || [];
  }
  get selectedItems(): TimelineEventModel[] {
    return this.sortedTimelineEvents.filter((event) =>
      this.selectedItemIds.includes(event.id)
    );
  }
}
</script>

<style scoped>
.timeline {
  display: flex;
  height: 100%;
  margin: 0 3em;
}

.events {
  width: 100%;
  margin-top: 3em;
}

.row {
  width: 100%;
  display: flex;
  margin: 1em 0;
  background: linear-gradient(
    90deg,
    transparent 20%,
    rgba(224, 224, 224, 0.534) 20%
  );
}

.summary {
  width: 20%;
  margin: 0.5em 0 0.5em 0;
  background-color: #fff;
  border: 3px solid #3e3e3e;
  padding: 0.5em;
  font-size: 1.2em;
}

.details {
  padding-top: 1em;
  color: #fff;
  border: 3px solid #3e3e3e;
  padding-left: 100px;
  flex-grow: 1;
  margin-left: -100px;
}

.thumbnail {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #3e3e3e;
  position: relative;
  left: -50px;
  overflow: hidden;
}

.thumbnail > img {
  object-fit: cover;
  width: 100px;
  height: 100px;
}

.connection {
  width: 3px;
  background-color: #3e3e3e;
  height: 100%;
  left: 20%;
  position: relative;
}
</style>

