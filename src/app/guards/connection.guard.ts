import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { ConnectionService } from '../services/connection.service';

@Injectable({
  providedIn: 'root'
})
export class ConnectionGuard implements CanActivate {
  constructor(private _router: Router, private _connectionService : ConnectionService) {}

  


  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this._connectionService.connectionEstablished) {
      console.log("ConnectionEstablishedGuardService says yes");
      return true;
    } else {
      console.log("ConnectionEstablishedGuardService says no");
      return false;
    }
  }
  
}
