import { namespace } from "s-vuex-class";
import { Vue } from "vue-class-component";

import { BaseModel } from "@/models/Base.model";
import { TimelineEventModel } from "@/models/TimelineEvent";
import { NOVEL_ITEM_KEYS, PARENT_ITEM_KEYS } from "@/store/keys"


const novelDataModule = namespace("novelData");

export default abstract class TimelineEventMixin extends Vue {
    allowedReferences = [
        PARENT_ITEM_KEYS.PARTS,
        PARENT_ITEM_KEYS.RESEARCH_GROUPS,
        PARENT_ITEM_KEYS.LOCATION_GROUPS,
        PARENT_ITEM_KEYS.CHARACTER_GROUPS,
    ]

    @novelDataModule.State('_novelId')
    novelId!: number;

    @novelDataModule.State('_novelItems')
    novelItems!: Map<PARENT_ITEM_KEYS, BaseModel[]>;   
    

    protected getFlatList(parentKey: PARENT_ITEM_KEYS): BaseModel[]{
        let flatList = [];
        for (const group of this.novelItems.get(parentKey)) {
            flatList = flatList.concat(group['children']);
        }
        return flatList;
    }

    protected filterItems(event: TimelineEventModel, parentKey: PARENT_ITEM_KEYS, childKey: NOVEL_ITEM_KEYS) {
        const flatList = this.getFlatList(parentKey);
        const eventItems = [];
        for (const item of (event['references'][childKey.toUpperCase()] || [])) {
            const arg = flatList.find(otherItem => otherItem.id === item);
            if (arg) { eventItems.push(arg); }            
        }
        return eventItems;
    }

    get novelItemKey() {
        return PARENT_ITEM_KEYS.TIMELINE;
      }

  }
  