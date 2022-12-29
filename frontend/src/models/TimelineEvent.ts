import { BaseModel } from "./Base.model";

export class TimelineEventModel extends BaseModel {
    public title: string;
    public eventDate: Date;
    public details: string;

    public references = new Map<any,any>();
}