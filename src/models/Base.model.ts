import { STATUS } from "./Status";
import { TagModel } from "./Tag.model";

export class BaseModel {
    public id: number;
    public order: number;
    public status: STATUS;
    public tags: TagModel[];
}