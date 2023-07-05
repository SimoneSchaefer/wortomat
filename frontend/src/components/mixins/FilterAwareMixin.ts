import { namespace } from "s-vuex-class";
import { mixins } from "vue-class-component";

import { PARENT_ITEM_KEYS } from "@/store/keys"
import NovelItemKeyAwareMixin from "./NovelItemKeyAwareMixin";
import { MARKER, MarkerFilterSetting, StatusFilterSetting, TagFilterSetting } from "@/store/FilterModule";
import { ParentModel } from "@/models/ParentModel";
import { ChildModel } from "@/models/ChildModel";
import TodoMarkerAwareMixin from "./TodoMarkerAwareMixin";
import { STATUS } from '@/models/Status';


const filterModule = namespace("filter");
const novelDataModule = namespace("novelData");

export default abstract class FilterAwareMixin extends mixins(NovelItemKeyAwareMixin, TodoMarkerAwareMixin) {
     
    @filterModule.State('_tagFilterSettings')
    _tagFilterSettings!: Record<PARENT_ITEM_KEYS, TagFilterSetting>;
     
    @filterModule.State('_markerFilterSettings')
    _markerFilterSettings!: Record<PARENT_ITEM_KEYS, MarkerFilterSetting>;

    @filterModule.State('_statusFilterSettings')
    _statusFilterSettings!: Record<PARENT_ITEM_KEYS, StatusFilterSetting>;

    @novelDataModule.State('_novelItems')
    _novelItems!: Map<PARENT_ITEM_KEYS, ParentModel[]>;
    
    getFilteredItems(novelItems?: ParentModel[] ) {
        const allParents = novelItems || this._novelItems?.get(this.parentKey) || [];
        console.log('ALL PARENTS', allParents)
        if (!this.tagFilterEnabled && !this._markerFilterSettings) {
            return allParents;
        }  
        const filteredItems = [];
        for (const parent of allParents) {
            const newParent = {...parent};
            newParent.children = [];

            for (const child of parent.children) {
                if (this.isChildVisible(child)) {
                    newParent.children.push(child);
                }
            }
            // if (newParent.children.length > 0) 
            {
                filteredItems.push(newParent);
            }
        }
        return filteredItems;
    }
    
    
    hasVisibleChildren(parent: ParentModel) {   
        const children = parent.children || [];
        for (const child of children) {
            if (this.isChildVisible(child)) {
                return true;
            }
        }
        return false;
    }

    isChildVisible(child: ChildModel) {
        const visibleByTag = this.visibleByTag(child);
        if (!visibleByTag) {
            return false;
        }
        const visibleByMarker = this.visibleByMarker(child);
        if (!visibleByMarker) {
            return false;
        }
        return this.visibleByStatus(child);
    }


    visibleByStatus(child: ChildModel) {
        if (!this._statusFilterSettings) {
            return true;
        }
        if (this.selectedStatus.length === 0) {
            return true;
        }
        const cleanStatus = child.status || 0;
        return this.selectedStatus.includes(cleanStatus);
    }

    visibleByMarker(child: ChildModel) {
        if (!this._markerFilterSettings) {
            return true;
        }
        if (!this._markerFilterSettings[this.parentKey]?.enabled) {
            return true;
        }
        const todoMarker = this.getTodoCount(child.content);
        const fixmeMarker = this.getFixmeCount(child.content);
        const ideaMarker = this.getIdeaCount(child.content);
        // in case no marker have been selected, we only display the children that do 
        // not have any marker
        if (this.selectedMarker.length === 0 && todoMarker === 0 && fixmeMarker === 0 && ideaMarker === 0) {
            return true;
        }
        if (this.selectedMarker.includes(MARKER.TODO) && todoMarker > 0) {
            return true;
        }
        if (this.selectedMarker.includes(MARKER.FIXME) && fixmeMarker > 0) {
            return true;
        }
        if (this.selectedMarker.includes(MARKER.IDEA) && ideaMarker > 0) {
            return true;
        }
        return false;
    }

    visibleByTag(child: ChildModel) {
        if (!this.tagFilterEnabled) {
            return true;
        }
         // when no filter tags have been specified, display all items without any tag
         if (this.selectedTags.length === 0 && child.tags.length === 0) {
            return true;
        }

        for (const tag of this.selectedTags) {
            const foundTag = child.tags.find(t => t.id === tag.id);
            if (foundTag) {
                return true;
            }
        }
        return false;
    }

    get selectedTags() {
        return this._tagFilterSettings[this.parentKey]?.tags || [];
    }

    get selectedMarker() {
        return this._markerFilterSettings[this.parentKey]?.status || [];
    }

    get selectedStatus() {
        return this._statusFilterSettings[this.parentKey]?.status || [];
    }

    get tagFilterEnabled() {
        if (Object.keys(this._tagFilterSettings).includes(this.parentKey)) {
            return this._tagFilterSettings[this.parentKey]?.enabled;
        }
        return false;
    }  

    get markerFilterEnabled() {
        if (Object.keys(this._markerFilterSettings).includes(this.parentKey)) {
            return this._markerFilterSettings[this.parentKey]?.enabled;
        }
        return false;
    }  
    get statusFilterEnabled() {
        if (Object.keys(this._statusFilterSettings).includes(this.parentKey)) {
            return this._statusFilterSettings[this.parentKey]?.enabled;
        }
        return false;
    }  
}
  