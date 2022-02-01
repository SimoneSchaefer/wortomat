import { BaseModel } from "@/models/Base.model"
import { TagModel } from "@/models/Tag.model";
import { CHILD_ITEM_KEYS, NOVEL_ITEM_KEYS, PARENT_ITEM_KEYS } from "@/store/keys"
import NovelItemKeyAwareMixin from "./NovelItemKeyAwareMixin";

export default abstract class UpdateItemMixin extends NovelItemKeyAwareMixin {  
    protected abstract key: PARENT_ITEM_KEYS | CHILD_ITEM_KEYS;
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
        this.$store.dispatch('updateItem', { 
            key: this.parentKey, 
            novelId: this.novelId,
            oldItem: oldItem,
            overrideValues: overrideValues
        })  
    } 
 }
  