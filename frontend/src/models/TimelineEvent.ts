import { BaseModel } from "./Base.model";

export class TimelineEventModel extends BaseModel {
    public title: string;
    public summary: string; 
    public eventDate: Date;
    public references = new Map<any,any>();
}