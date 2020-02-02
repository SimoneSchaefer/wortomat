
import "reflect-metadata";
import { SettingsProvider } from './SettingsProvider'
import { Logger } from './Logger'
import { createConnection, getConnection, Connection, getConnectionManager } from "typeorm";
import * as fs from 'fs';
import { ProjectEntity } from "../../app/entity/ProjectEntity";
import { PartEntity } from "../../app/entity/PartEntity";
import { ChapterEntity } from "../../app/entity/ChapterEntity";
import { CharacterGroupEntity } from "../../app/entity/CharacterGroupEntity";
import { CharacterEntity } from "../../app/entity/CharacterEntity";
import { LocationGroupEntity } from "../../app/entity/LocationGroupEntity";
import { LocationEntity } from "../../app/entity/LocationEntity";
import { BackgroundGroupEntity } from "../../app/entity/BackgroundGroupEntity";
import { BackgroundEntity } from "../../app/entity/BackgroundEntity";
import { PlotlineGroupEntity } from "../../app/entity/PlotlineGroupEntity";
import { PlotlineEntity } from "../../app/entity/PlotlineEntity";
import { LoaderFactory } from "./loader/LoaderFactory";
import { ENTITY_TYPE } from "../../app/entity/_baseEntity";
import { DataType } from "../../app/message/Message";
import { BaseGroupEntity } from "../../app/entity/_baseGroupEntity";
import { Data } from "@angular/router";


export class DBService {

    constructor(private settingsHandler: SettingsProvider) {}


    closeConnection(name : string) : Promise<void>{
        if (getConnectionManager().has(name)) {
            return getConnectionManager().get(name).close();
        } else {
            return Promise.resolve();
        }
    }

    static initializeConnection(dbpathAndName: string) {
        let dbPath = dbpathAndName;
        let name =  "main";
        let shouldSync = this.shouldSync(dbPath);
        return DBService.createConn(dbPath, name, [ProjectEntity], shouldSync, null);
    }

    createConnection(dbName? : string): Promise<Connection> {
        let $this = this;
        let dbPath = dbName? this.settingsHandler.settings.dbpath + '/' + dbName : this.settingsHandler.getDBPath();
        let name =  dbName ? dbName : "main";
        let shouldSync = DBService.shouldSync(dbPath);
        Logger.debug(`Try to connect to database: ${dbPath}, sync is: ${shouldSync}`);
        let entities = name === 'main' ? [ProjectEntity] : [
            PartEntity, ChapterEntity, 
            CharacterGroupEntity, CharacterEntity,
            LocationGroupEntity, LocationEntity,
            BackgroundGroupEntity, BackgroundEntity,
            PlotlineGroupEntity, PlotlineEntity,
            
            ];

        if (getConnectionManager().has(name)) {
            let connection = getConnectionManager().get(name);
            if (connection.isConnected) {
                return Promise.resolve(connection);
            } else {
                return connection.connect();
            }
        } else {
            const connection  = DBService.createConn(dbPath, name, entities, shouldSync, this);
             return Promise.resolve(connection);
        } 
    }
    

    static async createConn(dbPath: string, name: string, entities, shouldSync: boolean, dbHandler: DBService) {
        const connection = await createConnection({
            name : name,
            type: "sqlite",
            database: dbPath,
            entities: entities,    
            synchronize: shouldSync,
            logging: true
        });
        if (shouldSync && dbHandler) {
            let loader = LoaderFactory.getLoader(DataType.PARTS, name, dbHandler);
            await loader.createOrUpdate(new PartEntity());
            
            loader = LoaderFactory.getLoader(DataType.CHARACTER_GROUPS, name, dbHandler);
            await loader.createOrUpdate(new CharacterGroupEntity());

            loader = LoaderFactory.getLoader(DataType.PLOTLINE_GROUPS, name, dbHandler);
            await loader.createOrUpdate(new PlotlineGroupEntity());

            loader = LoaderFactory.getLoader(DataType.BACKGROUND_GROUPS, name, dbHandler);
            await loader.createOrUpdate(new BackgroundGroupEntity());

            loader = LoaderFactory.getLoader(DataType.LOCATION_GROUPS, name, dbHandler);
            await loader.createOrUpdate(new LocationGroupEntity());
        } 
        return connection;
    }

    private static shouldSync(path : string) {
        return !fs.existsSync(path) || fs.statSync(path).size == 0;
    }
}