import log from "electron-log";


export class Logger {
    constructor() {

    }

    public static debug(msg: string, args?: any[]) {
        log.debug(msg, args);
    }

    public static info(msg: string, args?: any[]) {
        log.info(msg, args);
    }

    public static warn(msg: string, args?: any[]) {
        log.warn(msg, args);
    }

    public static error(msg: string, args?: any[]) {
        log.error(msg, args);
    }
}