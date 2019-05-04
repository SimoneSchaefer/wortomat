import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {

  private _connectionEstablished : boolean;

  constructor() { }

  set connectionEstablished(value : boolean) {
    this._connectionEstablished = value;    
  }
  get connectionEstablished() {
    return this._connectionEstablished;    
  }
}
