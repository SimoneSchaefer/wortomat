import { WebContents } from 'electron';
import { Logger } from '../services/Logger';
import { MessageResponse } from '../../app/message/Message';


export class UiMessageHandler{
    constructor(private webContents : WebContents) {
    }


    public sendResponse(msg: MessageResponse) {
        this.webContents.send(msg.identifier, msg);
    }

    public sendSuccessMessage(msgKey : string, msg: string, args? : any[]) {
        Logger.debug("send message: " + msgKey + ", msg: " + msg);
        this.webContents.send(msgKey, {"type" : "success", "msg" : msg, "data" : args});
    }


    public sendErrorMessage(msgKey : string, msg: string, args? : any[]) {
        Logger.error(msg);
        this.webContents.send(msgKey, {"type": "error", "msg" : msg});
    }

    send (msg, args? : any[]) : void {
       this.webContents.send("info", args.unshift(msg));
    }

}