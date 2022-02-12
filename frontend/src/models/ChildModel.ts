import { BaseModel } from "./Base.model";
import { TagModel } from "./Tag.model";

export class ChildModel extends BaseModel {
    tags: TagModel[];
}