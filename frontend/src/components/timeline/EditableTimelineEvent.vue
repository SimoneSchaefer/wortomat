<template>
<div class="timeline-event" v-if="!isNew()">
    <div class="event-meta">
        <div class="event-name">
            <EditableLabel v-bind:value="item.name" @update-label="updateName" placeHolderTitle="No title added yet."></EditableLabel>
        </div>
      <!--  <div class="event-date">
            <EditableDate v-bind:value="item.eventDate" @update-label="updateEventDate" placeHolderTitle="No eventDate added yet."></EditableDate>
        </div>-->
    </div>
    <!--<div class="event-details">
        <EditableLabel v-bind:value="item.summary" @update-label="updateSummary" placeHolderTitle="No summary added yet."></EditableLabel>
    </div>-->
  </div>
</template>    

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import EditableDate from '@/components/shared/inline-edit/EditableDate.vue';
import { TimelineEventModel } from "@/models/TimelineEvent";
import { Prop } from "vue-property-decorator";
import { NOVEL_ITEM_KEYS } from "@/store/keys";

@Options({
  components: { 
    EditableLabel, EditableDate
  }
})
export default class EditTimelineEvent extends Vue {
    @Prop() item!: TimelineEventModel;

    editing = false;

    isNew() {
        return this.item.id === undefined;                
    }

    updateName(newValue: string): void {
        this.updateItem({ name: newValue });   
    } 

    updateEventDate(newValue: string): void {
        this.updateItem({ eventDate: newValue });   
    }  

    updateSummary(newValue: string): void {
        this.updateItem({ summary: newValue });   
    }  

    private updateItem(overrideValues): void {
        this.$store.dispatch('updateItem', { 
            key: NOVEL_ITEM_KEYS.TIMELINE, 
            novelId: this.novelId,
            oldItem: this.item,
            overrideValues: overrideValues
        })  
    }

    private get novelId(): number {
        return this.$store.getters.openNovelId;
    }
    
}
</script>


<style scoped>
.timeline-event {
    background-color: white;
    padding: 5px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border: 1px solid #2d2b2b;
    position: relative;
}



.event-meta {
    display: flex;
    justify-content: space-between;
}
.event-name {
    flex-grow: 2;
}
.event-date {
    color: gray;
    font-size: 0.8em;
    width: 18em;
}

.event-details {
    display: flex;
    flex-direction: row;
}
</style>