
import "reflect-metadata";
import { SettingsProvider } from './SettingsProvider'
import { Logger } from './Logger'
import { createConnection, Connection, ConnectionManager } from "typeorm";
import * as fs from 'fs';


export class DBService {

    constructor(private settingsHandler: SettingsProvider) {}


    createConnection(): Promise<Connection> {
        let $this = this;
        let shouldSync = this.shouldSync();
        Logger.debug(`Try to connect to database: ${$this.settingsHandler.getDBPath()}, sync is: ${shouldSync}`);
        return createConnection({
            type: "sqlite",
            database: $this.settingsHandler.getDBPath(),
            entities: [
            ],
            synchronize: shouldSync,
            logging: true
        });
    }

    private shouldSync() {
        let dbPath = this.settingsHandler.getDBPath();
        return !fs.existsSync(dbPath) || fs.statSync(dbPath).size == 0;
    }
}