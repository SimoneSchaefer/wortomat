import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../../services/electron/electron.service';
import { MessageRequest, ResponseType, Channel, MessageResponse } from '../../message/Message';
import { ConnectionGuard } from '../../guards/connection.guard';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent implements OnInit {

  constructor(private _electronService: ElectronService, private _connectionGuard : ConnectionGuard) { }

  ngOnInit() {
    console.log("App says hello");
    let $this = this;
    this._electronService.send(new MessageRequest(Channel.APP_READY, function (evt, response : MessageResponse) {
      console.log('hier kommt was zurueck');
      if (response.responseType === ResponseType.SUCCESS) {
        $this._connectionGuard.setConnectionEstablished(true);
      } else {
        $this._connectionGuard.setConnectionEstablished(false);
      }
    }));
  }
}
