<template>
<div class="w-timeline">
<div v-for="(event) of events" :key="event.id">
    <div class="w-timeline-event" v-bind:class="{ 'w-timeline-selected-event': selected(event)}">
        <div class="w-timeline-details w-timeline-details-left">
             <div class="w-timeline-details-frame">
                <div class="w-timeline-event-date">
                    <EditableDate v-bind:value="event.eventDate" @update-label="updateDate(event, $event)" placeHolderTitle="No date added yet."></EditableDate>
                 </div>
                 <div class="w-timeline-separator">
                    <div class="w-timeline-connector">&nbsp;</div>
                    <div class="w-timeline-marker" @click="select(event)">&nbsp;</div>
                 </div>
                <div class="w-timeline-event-name">
                    <EditableLabel v-bind:value="event.name" @update-label="updateName(event, $event)" placeHolderTitle="No title added yet."></EditableLabel>
                </div>
            </div>
        </div>
    </div>
</div>
</div>
 
</template>

<script lang="ts">
import { NOVEL_ITEM_KEYS } from "@/store/keys";
import { Options, mixins } from "vue-class-component";
import { TimelineEventModel } from "@/models/TimelineEvent";
import { Emit, Prop } from "vue-property-decorator";
import EditableDate from "@/components/shared/inline-edit/EditableDate.vue";
import EditableLabel from "@/components/shared/inline-edit/EditableLabel.vue";
import UpdatableItemMixin from '@/components/mixins/UpdatableItemMixin';

@Options({
  components: {
      EditableDate,
      EditableLabel
  },
  emits: [ 'select', 'update-date', 'update-name']
})
export default class WTimeline extends mixins(UpdatableItemMixin) {
    @Prop() events: TimelineEventModel[];
    @Prop() selectedEvent: TimelineEventModel;
    
    @Emit('select')
    select(item: TimelineEventModel): TimelineEventModel {
        return item;
    }

    @Emit('update-date')
    updateDate(item: TimelineEventModel, newValue: string): { item: TimelineEventModel, newValue: string } {
        return { item, newValue };
    }

    @Emit('update-name')
    updateName(item: TimelineEventModel, newValue: string): { item: TimelineEventModel, newValue: string } {
        return { item, newValue };
    }

    selected(item: TimelineEventModel) {
        return (this.selectedEvent?.id === item.id);
    }


    get novelItemKey() {
        return NOVEL_ITEM_KEYS.TIMELINE;
    }
}
</script>

<style>

.w-timeline {
    padding: 3em;
    height: 100%;;
}

.w-timeline-event {
    display: flex;
    min-height: 4em;
}

.w-timeline-selected-event .w-timeline-details-frame {
    background-color: pink;
}
.w-timeline-selected-event .w-timeline-marker,
.w-timeline-selected-event .w-timeline-connector{
    background-color: purple;
}

.w-timeline-separator {
    height: 100%;    
}

.w-timeline-details-frame {
    position: relative;
    margin-bottom: 1em;
}
.w-timeline-event-date,
.w-timeline-event-name {
    box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px;
}


.w-timeline-details-left .w-timeline-event-date,
.w-timeline-details-left .w-timeline-event-name {
    margin-right: 1em;
    background-color: #fff;

}

.w-timeline-details-right .w-timeline-event-date,
.w-timeline-details-right .w-timeline-event-name {
    margin-left: 1em;
    background-color: #fff;
}

.w-timeline-separator {
    display: flex;
    justify-content: space-between;
    align-content: center;
    align-items: center;
    background-color: #fff;
}

.w-timeline-marker {
    position: absolute;
    cursor: pointer;
    width: 1em;
    height: 1em;
    background-color: rgba(150, 206, 255, 0.733);
    border-radius: 50%;
    z-index: 5;
}

.w-timeline-details-left .w-timeline-marker {
    right: -0.5em; 
}
.w-timeline-details-right .w-timeline-marker {
    left: -0.5em;    
}

.w-timeline-connector {
    background-color: rgba(150, 206, 255, 0.733);
    height: 5px;   
    flex-grow: 2;
}

.w-timeline-details {
    width: 100%;
    top: -2em;
    position: relative;
}

.w-timeline-details-left {
    text-align: right;
    border-right: 2px solid #d2d2d2;
}
.w-timeline-details-right {
    text-align: left;
    border-left: 2px solid #e0e0e0;
}

.p-scrollpanel-left {
     background-color:#ececec;
}
</style>