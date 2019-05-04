import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer } from 'electron';
import * as childProcess from 'child_process';
import { MessageRequest, MessageResponse, Channel } from '../message/Message';

@Injectable()
export class ElectronService {

  public ipcRenderer: typeof ipcRenderer;
  childProcess: typeof childProcess;

  constructor() {
    // Conditional imports
    if (this.isElectron()) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.childProcess = window.require('child_process');
    }
  }

  private isElectron = () => {
    return window && window.process && window.process.type;
  }


  send(msg: MessageRequest) {
    this.ipcRenderer.send(msg.channel, msg);
    this.ipcRenderer.once(msg.identifier, msg.callback);
  }





  on (channel : string, callback : (evt : any, result : any) => void) {
    this.ipcRenderer.on(channel, callback);
  }

  once (channel : string, callback : (evt : any, result : any) => void) {
    this.ipcRenderer.once(channel, callback);
  }


  //send(msg : MessageConstants, callback: (responseKey : string, data : any) => void, data? : any) : void {
  //  this.ipcRenderer.send(msg, data);
  //}

  sendMsg(msg : string, data? : any) : void {
    this.ipcRenderer.send(msg, data);
  }

}
