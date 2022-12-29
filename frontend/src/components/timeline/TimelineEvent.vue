<template>
  <div class="row timeline-event-row">
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
  </div>
</template>

<script lang="ts">
import EditableDate from "@/components/forms/inline-edit/EditableDate.vue";
import EditableLabel from "@/components/forms/inline-edit/EditableLabel.vue";
import WHelpNote from "@/components/HelpNote.vue";
import TimelineEventMixin from "@/components/mixins/TimelineEventMixin";
import WSubMenuLink from "@/components/navigation/submenu/SubMenuLink.vue";
import WSidebarOpener from "@/components/shared/menu/SidebarOpener.vue";
import NovelItemSheet from "@/components/shared/novel-item/NovelItemSheet.vue";
import WNovelItemDropdown from "@/components/shared/NovelItemDropdown.vue";
import WTimeline from "@/components/timeline/Timeline.vue";
import { TimelineEventModel } from "@/models/TimelineEvent";
import { BACKEND_URL } from "@/service/Env";
import { mixins, Options } from "vue-class-component";
import { Prop } from "vue-property-decorator";

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
export default class TimelineEvent extends mixins(TimelineEventMixin) {
  @Prop() event!: TimelineEventModel;

  customUpload(event) { // TODO: avoid code duplication
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    for (const file of event.files) {
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
  }
}
</script>

<style scoped>
.row {
  width: 100%;
  display: flex;
  margin: 1em 0;
  height: 8rem;
}

.summary {
  width: 30%;
  margin: 0.5em 0 0.5em 0;
  background-color: #fff;
  border: 3px solid #3e3e3e;
  padding: 0.5em;
}

.summary .date h1 {
  font-size: 1.2em;
  margin: 0;
}

.details {
  padding-top: 1em;
  color: #fff;
  margin: 0.5em 0 0.5em 0;
  border: 3px solid #3e3e3e;
  padding-left: 100px;
  flex-grow: 1;
  margin-left: -103px;
    background-color: rgba(224, 224, 224, 0.534);

}

.thumbnail {
  width: 9rem;
  height: 9rem;
  border-radius: 50%;
  border: 3px solid #3e3e3e;
  position: relative;
  left: -50px;
  overflow: hidden;
}

.thumbnail > img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

</style>

