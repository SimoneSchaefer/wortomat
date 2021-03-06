import { Component, OnInit } from '@angular/core';
import { MessageRequest, Channel, ResponseType, MessageResponse } from '../../message/Message';
import { ElectronService } from '../../services/electron/electron.service';
import { ConnectionGuard } from '../../guards/connection.guard';
import { AlertService } from '../../services/alert.service';
import { ConnectionService } from '../../services/connection.service';
import { Router } from '@angular/router';

/**
 * Let the user enter the paths to project DB and export paths. 
 */
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private _dbpath: string;
  private _exportpath: string;
  private _saved: boolean;

  constructor(private _electronService: ElectronService,
    private _connectionService: ConnectionService, private _alert: AlertService, private _router : Router) { }

  ngOnInit() {
  }

  save(): void {
    let $this = this;
    this._electronService.send(new MessageRequest(Channel.SETTINGS_STORED, function (evt, response: MessageResponse) {
      console.log('settings response', response);
      if (response.responseType == ResponseType.SUCCESS) {
        $this._connectionService.connectionEstablished = true;
        $this.saved = true;
      } else {
        $this._connectionService.connectionEstablished = false;
        $this._alert.error('SETTINGS.ERROR.' + response.responseType);
      }
    }, { dbpath: this._dbpath, exportpath: this._exportpath }));
  }


  public get dbpath() : string {
    return this._dbpath;
  }
  public get exportpath() : string {
    return this._exportpath;
  }
  public get saved(): boolean {
    return this._saved;
  }
  public set saved(saved: boolean) {
    this._saved = saved;
  } 
  public set dbpath(val : string) {
    this._dbpath = val;
  }
  public set exportpath(val: string) {
    this._exportpath = val;
  }

}
