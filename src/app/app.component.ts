import { Component, OnInit } from '@angular/core';
import { ElectronService } from './services/electron/electron.service';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { OpenProjectService } from './services/open-project.service';
import { AlertService } from './services/alert.service';
import { ProjectService } from './services/electron/project.service';
import { ResponseType } from './message/Message';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {


  constructor(public electronService: ElectronService,
    private translate: TranslateService,
    private _openProjectService : OpenProjectService,
    private _projectService : ProjectService,
    private alertService : AlertService,
    private _router : Router) {

    translate.setDefaultLang('en');
    console.log('AppConfig', AppConfig);

    
  }

  ngOnInit() {
    
  }

  isProjectOpened() {
    return this._openProjectService.hasOpenedProject();
  }


  

  closeProject() {
    let $this = this;
    $this._projectService.close(function (response) {
      if (response.responseType == ResponseType.SUCCESS) {
        $this.alertService.success('PROJECTS.CLOSED_SUCCESS');
        $this._openProjectService.identifier = "main";
        $this._router.navigateByUrl('/projects');
      } else {
        $this.alertService.error(`ERROR_PROJECTS_${response.msg}`);
      }
    });
  } 
}
