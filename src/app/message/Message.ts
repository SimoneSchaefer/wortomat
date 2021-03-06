
export class MessageRequest {
    public identifier;
    constructor(
        public channel: Channel,
        public callback: (evt: any, data: MessageResponse) => void,
        public data? : any
    ) {
        this.identifier = this.generateMessageKey();
    }

    private generateMessageKey(): string {
        return Math.random().toString(36).substring(7);
    }
}


export class MessageResponse {
    constructor(
        public identifier: string,
        public responseType : ResponseType,
        public msg?: any, 
        public data?: any) {
    }
}

export enum ResponseType {
    SUCCESS = "success",
    ERROR_GENERAL = "error",
    ERROR_MISSING_DB_PATH = "missing_db_path",
    ERROR_MISSING_EXPORT_PATH = "missing_export_path",
    ERROR_INVALID_DB_PATH = "invalid_db_path",
    ERROR_INVALID_EXPORT_PATH = "invalid_export_path",
    ERROR_SETTINGS_STORE = "could_not_store",
    ERROR_UNKNOWN_REPOSITORY = "unknown_repository"
}

export enum DataType {
    CHAPTERS = "chapters",
    CHARACTERS = "characters",
    CHARACTER_GROUPS = "characterGroups",
    PLOTLINE_GROUPS = "plotlineGroups",
    PLOTLINES = "plotlines",
    LOCATIONS = "locations", 
    LOCATION_GROUPS = "locationGroups", 
    BACKGROUND = "background",
    BACKGROUND_GROUPS = "backgroundGroups",
    PROJECTS = "projects",
    PARTS = "parts"
}

export enum Channel {
    APP_READY       =   "app-ready",
    SETTINGS_STORED =   "settings-stored",
    EXPORT =   "export",
    LOAD_EXPORTS =   "load-exports",
    OPEN_EXPORT =   "open-exports",
    OPEN_PROJECT = "open-project",
    CLOSE_PROJECT = "close-project",
    CREATE_OR_UPDATE="create-or-update",
    UPDATE_ORDER="update-order",
    LOAD_SINGLE = "load-single",
    LOAD_ALL = "load-all",
    DELETE_SINGLE = "delete-single"
   
}

export enum FileFormat {
    PDF = "PDF",
    HTML = "HTML",
    PDFLATEX = "PDFLATEX"
}
