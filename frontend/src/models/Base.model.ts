import { STATUS } from "./Status";

export class BaseModel {
    public id: number;
    public name: string;
    public position: number;
    public status: STATUS;
    public content: string;
    public parentId?: number;
    public containsTranslation?: boolean;
    public summary: string;
}