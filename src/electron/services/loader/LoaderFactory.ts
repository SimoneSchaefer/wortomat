import { DataType } from "../../../app/message/Message";
import { BaseLoader } from "./_baseLoader";
import { Logger } from "../Logger";
import { ProjectLoader } from "./ProjectLoader";
import { SettingsProvider } from "../SettingsProvider";
import { DBService } from "../DBService";
import { PartLoader } from "./PartLoader";


export class LoaderFactory {
    public static getLoader(type : DataType, connectionName : string, databaseHandler : DBService) : BaseLoader {
        if (type === DataType.PROJECTS) {
            return new ProjectLoader(connectionName, databaseHandler);
        }
        if (type === DataType.PARTS) {
            return new PartLoader(connectionName);
        }
       /* if (type === DataType.CHAPTERS) {
            return new ChapterLoader();
        }
        if (type === DataType.SCENES) {
            return new SceneLoader();
        }
        if (type === DataType.CHARACTERS) {
            return new CharacterLoader();
        }
        if (type === DataType.CHARACTER_GROUPS) {
            return new CharacterGroupLoader();
        }
        if (type === DataType.PLOTLINES) {
            return new PlotlineLoader();
        }
        
        if (type === DataType.PARTS) {
            return new PartLoader();
        }*/
        Logger.error("Unknown entity data type: " + type);
        return null;
    }
}