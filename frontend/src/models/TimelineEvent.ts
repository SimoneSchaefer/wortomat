import { BaseModel } from "./Base.model";

export class TimelineEventModel extends BaseModel {
    public title: string;
    public summary: string; 
    public date: Date;
    public references = new Map<any,any>();
}