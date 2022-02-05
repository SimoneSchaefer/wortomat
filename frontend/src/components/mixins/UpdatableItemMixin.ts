import { BaseModel } from "@/models/Base.model"
import { TagModel } from "@/models/Tag.model";
import { PARENT_ITEM_KEYS } from "@/store/keys"

import NovelItemKeyAwareMixin from "./NovelItemKeyAwareMixin";

export default abstract class UpdateItemMixin extends NovelItemKeyAwareMixin { 

    // This needs to be implemented in the base component, as the auto-injection of @Action does not work in mixins
    abstract updateNovelItem: (payload: { view: PARENT_ITEM_KEYS, novelItem: BaseModel}) => Promise<void>;

    updateTags(oldItem: BaseModel, newTags: TagModel[]): void {
        this.updateItem(oldItem, { tags: newTags});
    }
    
    updateName(oldItem: BaseModel, newValue: string): void {
        this.updateItem(oldItem, { name: newValue });   
    }  

    updateSummary(oldItem: BaseModel, newValue: string): void {
        this.updateItem(oldItem, { summary: newValue });   
    }   
    
    updateExtendedSummary(oldItem: BaseModel, newValue: string): void {
        this.updateItem(oldItem, { extended_summary: newValue });   
    }

    updateContent(oldItem: BaseModel, newValue: string): void {
        this.updateItem(oldItem, { content: newValue });   
    }

    updateImages(oldItem: BaseModel, images: Array<{ id: number, name: string }>): void {
        this.updateItem(oldItem, { images: images});
    }   

    updateItem (oldItem: BaseModel, overrideValues: Record<string,any> ) {  
        const newItem =  Object.assign({}, oldItem, overrideValues);  
        this.updateNovelItem({  view: this.parentKey, novelItem: newItem });  
    }     
 }
  