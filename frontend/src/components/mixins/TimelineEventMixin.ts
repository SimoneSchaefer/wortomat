import { BaseModel } from "@/models/Base.model";
import { TimelineEventModel } from "@/models/TimelineEvent";
import { getAllItems } from "@/store/getters";
import { NOVEL_ITEM_KEYS } from "@/store/keys"
import { Vue } from "vue-class-component";

export default abstract class TimelineEventMixin extends Vue {
        
    getResearchForEvent(event: TimelineEventModel) {
        return this.filterItems(event, NOVEL_ITEM_KEYS.RESEARCH_GROUPS, NOVEL_ITEM_KEYS.RESEARCH);
    }
    
    getChaptersForEvent(event: TimelineEventModel) {
        return this.filterItems(event, NOVEL_ITEM_KEYS.PARTS, NOVEL_ITEM_KEYS.CHAPTERS);
    }

    protected getFlatList(parentKey: NOVEL_ITEM_KEYS): BaseModel[]{
        let flatList = [];
        for (const group of getAllItems(this.$store.state, parentKey)) {
            flatList = flatList.concat(group['children']);
        }
        return flatList;
    }

    private filterItems(event: TimelineEventModel, parentKey: NOVEL_ITEM_KEYS, childKey: NOVEL_ITEM_KEYS) {
        const flatList = this.getFlatList(parentKey);
        const eventItems = [];
        for (const item of (event['references'][childKey.toUpperCase()] || [])) {
            const arg = flatList.find(otherItem => otherItem.id === item);
            if (arg) { eventItems.push(arg); }            
        }
        return eventItems;
    }

  }
  