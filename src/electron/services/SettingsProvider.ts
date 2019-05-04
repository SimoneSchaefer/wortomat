import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Logger } from '../services/Logger';
var dateFormat = require('dateformat');


export class SettingsProvider {
    private _settings: settingsObject;

    constructor() {
    }

    public readConfiguration(): Promise<void> {
        let $this = this;
        return new Promise<void>((resolve, reject) => {
            let filePath = $this.getConfigFilePath();
            if (!fs.existsSync(filePath)) {
                Logger.error("No config file found on path " + filePath);
                reject(new Error("No config file found on path + " + filePath));
            } else {
                fs.readFile(filePath, "UTF-8", function (err: NodeJS.ErrnoException, data: string) {
                    if (err) {
                        let errMsg = `Found config file found on path ${filePath}, 
                            but it seems to be corrupted. 
                            Content: ${data}, err was: ${err}`;
                        Logger.error(errMsg);
                        reject(new Error(errMsg));
                    } else {
                        $this.settings = JSON.parse(data);
                        Logger.debug(`parsed config: ` + data)
                        resolve();
                    }
                });
            }
        });
    }



    public get settings()  :settingsObject {
        return this._settings;
    }

    public set settings(val : settingsObject) {
        this._settings = val;
    }

    public getDBPath() {
        return this.settings.dbpath + "/wortomat.db";
    }



    private getConfigFilePath(): string {
        let appName = "wortomat";
        let homeDir = os.homedir ? os.homedir() : process.env['HOME'];
        var dir;
        switch (process.platform) {
            case 'linux': {
                dir = path.join(homeDir, '.config', appName);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                };
                break;
            }
        }

        if (dir) {
            return path.join(dir, `${appName}.json`);
        } else {
            return null;
        }
    }
}


export interface settingsObject {
    dbpath: string;
    exportpath: string;
}