import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OpenProjectService {
  private _identifier  = "main";

  constructor() {
    
   }

  public hasOpenedProject() {
    return this._identifier != "main";
  }

  public get identifier() {
    return this._identifier;
  }

  public set identifier(identifier : string) {
    this._identifier = identifier;
  }
}
