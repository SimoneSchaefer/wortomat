import { Injectable, ApplicationRef } from '@angular/core';
import { NotifierService } from 'angular-notifier';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor(private _notifierService : NotifierService, private _translate : TranslateService, private _app : ApplicationRef) { }

  public success(message : string) {
    this.notify('success', message);
  }
  public error(message : string) {
    this.notify('error', message);
  }
  public info(message : string) {
    this.notify('info', message);
  }
  public warn(message : string) {
    this.notify('warn', message);
  }

  private notify(type : string, message : string) {
    this._notifierService.notify(type, this._translate.instant(message));
    this._app.tick();

  }
}


