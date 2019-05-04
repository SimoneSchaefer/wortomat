import { Component, OnInit } from '@angular/core';
import { MessageRequest, Channel, ResponseType, MessageResponse } from '../../message/Message';
import { ElectronService } from '../../services/electron/electron.service';
import { ConnectionGuard } from '../../guards/connection.guard';
import { AlertService } from '../../services/alert.service';

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

  constructor(private _electronService: ElectronService,
    private _connectionGuard: ConnectionGuard, private _alert: AlertService) { }

  ngOnInit() {
  }

  save(): void {
    let $this = this;
    console.log('SPEISCHERN');
    console.dir({ dbpath: this._dbpath, exportpath: this._exportpath });
    this._electronService.send(new MessageRequest(Channel.SETTINGS_STORED, function (evt, response: MessageResponse) {
      console.log('service says ');
      console.log(response);
      if (response.responseType == ResponseType.SUCCESS) {
        $this._connectionGuard.setConnectionEstablished(true);
      } else {
        $this._connectionGuard.setConnectionEstablished(false);
        $this._alert.error('ERROR_SAVE_SETTINGS_' + response.responseType);
      }
    }, { dbpath: this._dbpath, exportpath: this._exportpath }));
  }


  public get dbpath() : string {
    return this._dbpath;
  }
  public get exportpath() : string {
    return this._exportpath;
  }
  public set dbpath(val : string) {
    this._dbpath = val;
  }
  public set exportpath(val: string) {
    this._exportpath = val;
  }

}
