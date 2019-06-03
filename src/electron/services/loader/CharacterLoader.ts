import { DataType } from '../../../app/message/Message';
import { BaseLoader } from './_baseLoader';
import { ChapterEntity } from '../../../app/entity/ChapterEntity';


export class CharacterLoader extends BaseLoader {
    constructor(connectionName : string) {
        super(DataType.CHARACTERS, connectionName);
    }
   
    protected getOrderBy() : { [P in keyof ChapterEntity]?: "ASC"|"DESC"|1|-1 } {
       return {["order"] : 'ASC'};
    }

    protected getRelations() : string[]{
        return ["parent"];
    }
}