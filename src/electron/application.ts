import { MainWindowEventListener } from "./events/MainWindowEventListener";
import { UiMessageHandler } from "./services/UiMessageHandler";

import { DBService } from './services/DBService'
import { Logger } from './/services/Logger'
import { SettingsProvider } from './services/SettingsProvider'
import { ipcMain, BrowserWindow } from 'electron';
import { Initializer } from "./events/Initializer";



export class Application {
    private messageHandler: UiMessageHandler;
    private eventListener: MainWindowEventListener;
    private settingsHandler: SettingsProvider;
    private dbHandler: DBService;
    private initializer: Initializer;


    constructor(win: BrowserWindow) {
        this.messageHandler = new UiMessageHandler(win.webContents);
        this.settingsHandler = new SettingsProvider();
        this.dbHandler = new DBService(this.settingsHandler);
        this.initializer = new Initializer(this.settingsHandler, this.dbHandler);
        this.eventListener = new MainWindowEventListener(ipcMain, this.initializer, this.messageHandler, this.settingsHandler, this.dbHandler);
    }

  
}
