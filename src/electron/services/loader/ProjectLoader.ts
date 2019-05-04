import { Entity } from 'typeorm';
import { DataType } from '../../../app/message/Message';
import { BaseLoader } from './_baseLoader';
import { BaseEntity } from '../../../app/entity/_baseEntity';
import { SettingsProvider } from '../SettingsProvider';
import { DBService } from '../DBService';
import { ProjectEntity } from '../../../app/entity/ProjectEntity';


export class ProjectLoader extends BaseLoader {
    constructor(private _settingsHandler : SettingsProvider, private dbHandler : DBService) {
        super(DataType.PROJECTS);
    }


    protected beforeCreate(entity : BaseEntity) : Promise<any> {
        //before saving a new project, we need to create a new db
        let dbName = entity.name.replace(" ", "_") + '.db';
        return this.dbHandler.createConnection(this._settingsHandler.getDbNameForProject(entity as ProjectEntity));
    }

   /* protected getRelations() : string[]{
        return ["parts", "parts.chapters", "parts.chapters.scenes"];
    }*/

   /* protected getOrderBy() : { [P in keyof PartEntity]?: "ASC"|"DESC"|1|-1 } {
        return {["order"] : 'ASC'};
    }*/
}