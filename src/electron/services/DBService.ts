
import "reflect-metadata";
import { SettingsProvider } from './SettingsProvider'
import { Logger } from './Logger'
import { createConnection, getConnection, Connection, getConnectionManager } from "typeorm";
import * as fs from 'fs';
import { ProjectEntity } from "../../app/entity/ProjectEntity";


export class DBService {

    constructor(private settingsHandler: SettingsProvider) {}


    createConnection(dbName? : string): Promise<Connection> {
        let $this = this;
        let dbPath = dbName? this.settingsHandler.settings.dbpath + '/' + dbName : this.settingsHandler.getDBPath();
        let name =  dbName ? dbName : "main";
        let shouldSync = this.shouldSync(dbPath);
        Logger.debug(`Try to connect to database: ${dbPath}, sync is: ${shouldSync}`);

        if (getConnectionManager().has(name)) {
            return Promise.resolve(getConnectionManager().get(name));
        } else {
            return createConnection({
                name : name,
                type: "sqlite",
                database: dbPath,
                entities: [
                    ProjectEntity
                ],    
                synchronize: shouldSync,
                logging: true
            });
        } 
    }

    private shouldSync(path : string) {
        return !fs.existsSync(path) || fs.statSync(path).size == 0;
    }
}