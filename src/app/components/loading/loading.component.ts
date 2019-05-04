import { Component, OnInit, NgZone } from '@angular/core';
import { ElectronService } from '../../services/electron/electron.service';
import { MessageRequest, ResponseType, Channel, MessageResponse } from '../../message/Message';
import { ConnectionGuard } from '../../guards/connection.guard';
import { ConnectionService } from '../../services/connection.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent implements OnInit {

  constructor(private _electronService: ElectronService, private _connectionService : ConnectionService, private _router : Router) { }

  ngOnInit() {
    console.log("App says hello");
    let $this = this;

  
    this._electronService.send(new MessageRequest(Channel.APP_READY, function (evt, response : MessageResponse) {
      if (response.responseType === ResponseType.SUCCESS) {
        $this._connectionService.connectionEstablished = true;
        $this._router.navigateByUrl('/projects');
      } else {
        $this._connectionService.connectionEstablished = false;
        $this._router.navigateByUrl('/settings');
      }
    }));
  }
}
