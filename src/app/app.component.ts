import { Component } from '@angular/core';
import { ElectronService } from './providers/electron.service';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { MessageRequest, MessageResponse, Channel, ResponseType } from './message/Message';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
success : any;


  constructor(public electronService: ElectronService,
    private translate: TranslateService) {

    translate.setDefaultLang('en');
    console.log('AppConfig', AppConfig);

    
  }


  ngOnInit() {
    console.log("App says hello");

    let $this = this;
    this.electronService.send(new MessageRequest(Channel.APP_READY, function (evt, response : MessageResponse) {
      console.log('hier kommt was zurueck');
      if (response.responseType === ResponseType.SUCCESS) {
        //$this.conn.setConnectionEstablished(true);
        $this.success = "Hurra!";

      } else {
       // $this.conn.setConnectionEstablished(false);
       $this.success = "Ohhhh weia :(";
      }
    }));

   /* this.electronService.on("startup-error", function (evt, data) {
      console.log("An error occured: " + data);
    }); 
    this.electronService.on("connection-established", function (evt, data) {
      console.log("Connection: " + data);
    });*/

  }
}
