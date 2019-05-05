import { Entity } from 'typeorm';
import { DataType } from '../../../app/message/Message';
import { BaseLoader } from './_baseLoader';
import { BaseEntity } from '../../../app/entity/_baseEntity';
import { SettingsProvider } from '../SettingsProvider';
import { DBService } from '../DBService';
import { ProjectEntity } from '../../../app/entity/ProjectEntity';


export class ProjectLoader extends BaseLoader {
    constructor(connectionName : string, private dbHandler : DBService) {
        super(DataType.PROJECTS, connectionName);
    }


    protected beforeCreate(entity : BaseEntity) : Promise<any> {
        //before saving a new project, we need to create a new db
        return this.dbHandler.createConnection(this.connectionName);
    }
   
    protected getOrderBy() : { [P in keyof ProjectEntity]?: "ASC"|"DESC"|1|-1 } {
       return {["order"] : 'ASC'};
    }
}