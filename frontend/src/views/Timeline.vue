<template>
  <ScrollPanel style="height: 100%" class="scroll-timeline">
    <div class="timeline">
      <div class="connection"></div>
      <div class="events">
        <draggable
          :list="sortedTimelineEvents"
          class="list-group"
          ghost-class="ghost"
          drag-class="dragging"
          group="children"
          @end="moved($event)"
          :id="`events`"
        >
          <transition-group type="transition" :name="'flip-list'">
            <div
              v-for="event of sortedTimelineEvents"
              class="row"
              :id="event.id"
              v-bind:key="event.id"
            >
            <WTimelineEvent :event="event"></WTimelineEvent>
            <!--
              <div class="summary">
                <div class="date">
                  <h1>
                    <EditableLabel
                      v-bind:value="event.details"
                      @update-label="updateDetails(event, $event)"
                      :placeHolderTitle="`fallback_labels.no_name.TIMELINE_DATE`"
                    ></EditableLabel>
                  </h1>
                </div>
                <div class="name">
                  <EditableLabel
                    v-bind:value="event.name"
                    @update-label="updateName(event, $event)"
                    :placeHolderTitle="`fallback_labels.no_name.TIMELINE`"
                  ></EditableLabel>
                </div>
              </div>
              <div class="thumbnail">
                <FileUpload
                  ref="fileupload"
                  name="upload[]"
                  mode="basic"
                  accept="image/*"
                  :auto="true"
                  :customUpload="true"
                  @uploader="customUpload"
                  :chooseLabel="''"
                ></FileUpload>

                <img src="/assets/images/dummy-gallery-item/CHARACTERS.jpg" />
              </div>
              <div class="details">{{ event.summary }}</div>-->
            </div>
          
          </transition-group>
        </draggable>
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
import WTimelineEvent from "@/components/timeline/TimelineEvent.vue";
import { TimelineService } from "@/service/TimelineService";
import { BACKEND_URL } from "@/service/Env";

const novelDataModule = namespace("novelData");
const selectionModule = namespace("selection");

@Options({
  components: {
    EditableLabel,
    EditableDate,
    NovelItemSheet,
    WSidebarOpener,
    WTimeline,
    WTimelineEvent,
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

  moved($event) {
    console.log("moved", $event.newIndex, $event.clone.id);
    new TimelineService()
      .move(this.novelId, $event.clone.id, $event.newIndex)
      .then(() => {
        this.loadNovelItems({
          view: PARENT_ITEM_KEYS.TIMELINE,
          novelId: this.$route.params.id,
        });
      });
  }

  /*customUpload(event) {
    let xhr = new XMLHttpRequest();
    let formData = new FormData();

    for (let file of event.files) {
      formData.append("upload[]", file, file.name);
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          this.$emit("upload-image", JSON.parse(xhr.response));
        } else {
          this.$toast.add({
            severity: "error",
            summary: "Could not upload image",
            life: 10000,
          });
        }
        (this.$refs.fileupload as any).clear();
      }
    };

    xhr.open("POST", this.uploadUrl(1), true);
    xhr.withCredentials = false;
    xhr.send(formData);
  }

  private uploadUrl(eventId: number) {
    return `${BACKEND_URL}/novels/${this.novelId}/timeline/${eventId}/files/upload`;
  }*/

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

  updateName(item, $event): void {
    this.updateItem(item, { name: $event });
  }

  updateDetails(item, $event): void {
    console.log(item, $event);
    this.updateItem(item, { details: $event });
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

.connection {
  width: 3px;
  background-color: #3e3e3e;
  height: 100%;
  left: 30%;
  position: relative;
}
</style>

