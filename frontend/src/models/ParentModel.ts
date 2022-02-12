import { BaseModel } from "./Base.model";
import { ChildModel } from "./ChildModel";

export class ParentModel extends BaseModel {
    children: ChildModel[];
}