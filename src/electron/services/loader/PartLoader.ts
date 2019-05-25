import { DataType } from '../../../app/message/Message';
import { BaseLoader } from './_baseLoader';
import { PartEntity } from '../../../app/entity/PartEntity';


export class PartLoader extends BaseLoader {
    constructor(connectionName : string) {
        super(DataType.PARTS, connectionName);
    }
   
    protected getOrderBy() : { [P in keyof PartEntity]?: "ASC"|"DESC"|1|-1 } {
       return {["order"] : 'ASC'};
    }

    protected getRelations() : string[]{
        return ["children"];
    }
}