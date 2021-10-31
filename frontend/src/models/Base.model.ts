import { STATUS } from "./Status";

export class BaseModel {
    public id: number;
    public position: number;
    public status: STATUS;
    public content: string;
    public parentId?: number;
}