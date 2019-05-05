
import "reflect-metadata";
import { SettingsProvider } from './SettingsProvider'
import { Logger } from './Logger'
import { createConnection, getConnection, Connection, getConnectionManager } from "typeorm";
import * as fs from 'fs';
import { ProjectEntity } from "../../app/entity/ProjectEntity";
import { PartEntity } from "../../app/entity/PartEntity";
import { ChapterEntity } from "../../app/entity/ChapterEntity";


export class DBService {

    constructor(private settingsHandler: SettingsProvider) {}


    closeConnection(name : string) : Promise<void>{
        if (getConnectionManager().has(name)) {
            return getConnectionManager().get(name).close();
        } else {
            return Promise.resolve();
        }
    }


    createConnection(dbName? : string): Promise<Connection> {
        let $this = this;
        let dbPath = dbName? this.settingsHandler.settings.dbpath + '/' + dbName : this.settingsHandler.getDBPath();
        let name =  dbName ? dbName : "main";
        let shouldSync = this.shouldSync(dbPath);
        Logger.debug(`Try to connect to database: ${dbPath}, sync is: ${shouldSync}`);
        let entities = name === 'main' ? [ProjectEntity] : [PartEntity, ChapterEntity];

        if (getConnectionManager().has(name)) {
            let connection = getConnectionManager().get(name);
            if (connection.isConnected) {
                return Promise.resolve(connection);
            } else {
                return connection.connect();
            }
        } else {
            return createConnection({
                name : name,
                type: "sqlite",
                database: dbPath,
                entities: entities,    
                synchronize: shouldSync,
                logging: true
            });
        } 
    }

    private shouldSync(path : string) {
        return !fs.existsSync(path) || fs.statSync(path).size == 0;
    }
}