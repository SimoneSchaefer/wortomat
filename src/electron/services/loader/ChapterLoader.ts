import { Entity } from 'typeorm';
import { DataType } from '../../../app/message/Message';
import { BaseLoader } from './_baseLoader';
import { BaseEntity } from '../../../app/entity/_baseEntity';
import { SettingsProvider } from '../SettingsProvider';
import { DBService } from '../DBService';
import { ProjectEntity } from '../../../app/entity/ProjectEntity';
import { PartEntity } from '../../../app/entity/PartEntity';
import { ChapterEntity } from '../../../app/entity/ChapterEntity';


export class ChapterLoader extends BaseLoader {
    constructor(connectionName : string) {
        super(DataType.CHAPTERS, connectionName);
    }
   
    protected getOrderBy() : { [P in keyof ChapterEntity]?: "ASC"|"DESC"|1|-1 } {
       return {["order"] : 'ASC'};
    }

    protected getRelations() : string[]{
        return ["part"];
    }
}