import { BaseModel } from "./Base.model";
import { PlotlineModel } from './Plotline.model';
import { TagModel } from "./Tag.model";

export class ChildModel extends BaseModel {
    tags: TagModel[];
    plotline?: PlotlineModel;
}