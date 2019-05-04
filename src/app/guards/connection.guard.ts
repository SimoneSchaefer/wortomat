import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ConnectionGuard implements CanActivate {
  private connectionEstablished : boolean;

  constructor(private _router: Router) {}

   setConnectionEstablished(value : boolean) {
     this.connectionEstablished = value;
     if (this.connectionEstablished) {
       this._router.navigateByUrl('/projects');
     } else {
        this._router.navigateByUrl('/settings');
     }
   }


  canActivate(_: ActivatedRouteSnapshot, __: RouterStateSnapshot) {
    if (this.connectionEstablished) {
      console.log("ConnectionEstablishedGuardService says yes");
      return true;
    } else {
      console.log("ConnectionEstablishedGuardService says no");
      return false; 
    }
  }
  
}
