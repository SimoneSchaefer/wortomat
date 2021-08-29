import { BaseModel } from "./Base.model";
import { TagModel } from "./Tag.model";
export class ChapterModel extends BaseModel {
    public title: string;
    public summary: string;
    public extended_summary: string;
    public content: string; 
    public novelId: number;  
    public tags: TagModel[];
}