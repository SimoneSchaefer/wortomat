import { BaseModel } from "./Base.model";

export class NovelModel extends BaseModel {
    public title: string;
    public summary: string; 
    public chapters: [];  
    public tags: [];  

}