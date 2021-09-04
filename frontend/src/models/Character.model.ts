import { BaseModel } from "./Base.model";
import { TagModel } from "./Tag.model";
export class CharacterModel extends BaseModel {
    public title: string;
    public images: Array<{ id: number, name: string}>;
    public summary: string;
    public extended_summary: string;
    public content: string; 
    public novelId: number;  
    public tags: TagModel[];
}