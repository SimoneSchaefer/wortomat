import { Entity } from 'typeorm';
import { DataType } from '../../../app/message/Message';
import { BaseLoader } from './_baseLoader';


export class ProjectLoader extends BaseLoader {
    constructor() {
        super(DataType.PROJECTS);
    }

   /* protected getRelations() : string[]{
        return ["parts", "parts.chapters", "parts.chapters.scenes"];
    }*/

   /* protected getOrderBy() : { [P in keyof PartEntity]?: "ASC"|"DESC"|1|-1 } {
        return {["order"] : 'ASC'};
    }*/
}