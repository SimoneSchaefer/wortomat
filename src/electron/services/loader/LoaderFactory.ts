import { DataType } from "../../../app/message/Message";
import { BaseLoader } from "./_baseLoader";
import { Logger } from "../Logger";
import { ProjectLoader } from "./ProjectLoader";
import { SettingsProvider } from "../SettingsProvider";
import { DBService } from "../DBService";
import { PartLoader } from "./PartLoader";
import { ChapterLoader } from "./ChapterLoader";
import { CharactergroupLoader } from "./CharactergroupLoader";
import { CharacterLoader } from "./CharacterLoader";
import { BaseGroupLoader } from "./_baseGroupLoader";


export class LoaderFactory {
    public static getLoader(type : DataType, connectionName : string, databaseHandler : DBService) : BaseLoader {

        if (type === DataType.PROJECTS) {
            return new ProjectLoader(connectionName, databaseHandler);
        }       
        if ([DataType.PARTS, DataType.CHARACTER_GROUPS, DataType.LOCATION_GROUPS, DataType.BACKGROUND_GROUPS, DataType.PLOTLINE_GROUPS].includes(type)) {
            return new BaseGroupLoader(type, connectionName);
        }
        if ([DataType.CHAPTERS, DataType.CHARACTERS, DataType.LOCATIONS, DataType.BACKGROUND, DataType.PLOTLINES].includes(type)) {
            return new BaseLoader(type, connectionName);
        }
        Logger.error("Unknown entity data type: " + type);
        return null;
    }
}