import { STATUS } from "./Status";
import { TagModel } from "./Tag.model";

export class BaseModel {
    public id: number;
    public position: number;
    public status: STATUS;
    public tags: TagModel[];
}