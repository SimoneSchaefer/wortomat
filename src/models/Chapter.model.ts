import { BaseModel } from "./Base.model";

export class ChapterModel extends BaseModel {
    public title: string;
    public summary: string;
    public extended_summary: string;
    public content: string; 
    public novelId: number;  
}