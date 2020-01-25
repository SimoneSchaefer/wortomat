import { SettingsProvider } from '../services/SettingsProvider';
import { DBService } from '../services/DBService';
import { Logger } from '../services/Logger';

export class Initializer {
    private initialized = false;
    constructor(
        private settingsHandler: SettingsProvider,
        private dbHandler: DBService) {
    }


    public initialize(): Promise<any> {
        let $this = this;
        if (this.initialized) {
            Logger.debug(`tried to initialize app, but it already was`);
            return Promise.resolve();
        }
        return new Promise<void>((resolve, reject) => {
            this.settingsHandler.readConfiguration()
                .then(function () {
                    Logger.debug(`trigger db connection`);
                    $this.waitForConnection();
                })
                .then(function () {
                    $this.initialized = true;
                    Logger.debug(`successfully triggered db connection`);
                    resolve();
                })
                .catch(error => {
                    $this.initialized = false;
                    Logger.debug(`Something went wrong during initialization: ${error}`);
                    reject(error);
                });
        });
    }

    async waitForConnection() {
        await this.dbHandler.createConnection();
    }
}