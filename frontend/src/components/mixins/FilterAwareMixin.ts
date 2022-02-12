import { namespace } from "s-vuex-class";
import { mixins } from "vue-class-component";

import { PARENT_ITEM_KEYS } from "@/store/keys"
import NovelItemKeyAwareMixin from "./NovelItemKeyAwareMixin";
import { TagFilterSetting } from "@/store/FilterModule";
import { ParentModel } from "@/models/ParentModel";
import { ChildModel } from "@/models/ChildModel";


const filterModule = namespace("filter");
const novelDataModule = namespace("novelData");

export default abstract class FilterAwareMixin extends mixins(NovelItemKeyAwareMixin) {
     
    @filterModule.State('_tagFilterSettings')
    _tagFilterSettings!: Record<PARENT_ITEM_KEYS, TagFilterSetting>;

    @novelDataModule.State('_novelItems')
    _novelItems!: Map<PARENT_ITEM_KEYS, ParentModel[]>;
    
    getFilteredItems(novelItems?: ParentModel[] ) {
        const allParents = novelItems || this._novelItems?.get(this.parentKey) || [];
        if (!this.tagFilterEnabled) {
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
            if (newParent.children.length > 0) {
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
    }

    get selectedTags() {
        return this._tagFilterSettings[this.parentKey]?.tags || [];
    }

    get tagFilterEnabled() {
        if (Object.keys(this._tagFilterSettings).includes(this.parentKey)) {
            return this._tagFilterSettings[this.parentKey]?.enabled;
        }
        return false;
    }  
}
  