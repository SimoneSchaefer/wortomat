import { Component, OnInit, ApplicationRef } from '@angular/core';
import { ProjectService } from '../services/electron/project.service';
import { ResponseType } from '../message/Message';
import { BaseEntity } from '../entity/_baseEntity';
import { AlertService } from '../services/alert.service';
import { ProjectEntity } from '../entity/ProjectEntity';
import { OpenProjectService } from '../services/open-project.service';
import { Router } from '@angular/router';
import { BaseService } from '../services/electron/_baseService';


export class BaseEntityComponent implements OnInit {
  private _entities = new Array<BaseEntity>();

  constructor(
      private _baseService: BaseService, 
      private _openProjectService: OpenProjectService, 
      private _alertService: AlertService) {

  }

  ngOnInit() {
    this.load();
  }


  public get entities(): Array<BaseEntity> {
    return this._entities;
  }

  public set entities(val: Array<BaseEntity>) {
    this._entities = val;
  }

  protected get baseService(): BaseService {
    return this._baseService;
  }

  protected get alertService(): AlertService {
    return this._alertService;
  }

  protected get openProjectService(): OpenProjectService {
    return this._openProjectService;
  }

 




  delete(id : number): void {
    let $this = this;
    console.log('I DELETE');
    if (confirm("PROJECT_REALLY_DELETE")) {
      $this._baseService.remove(id, function (response) {
        if (response.responseType == ResponseType.SUCCESS) {
          $this.load();
        } else {
          $this._alertService.error(`ERROR_PROJECTS_${response.msg}`);
        }
      });
    }
  }



  protected load(): void {
    let $this = this;
    console.log('I AM LOADING');
    $this._baseService.loadAll(function (response) {
      if (response.responseType == ResponseType.SUCCESS) {
        $this.entities = response.data.entities;
      } else {
        $this._alertService.error(`ERROR_PROJECTS_${response.msg}`);
      }
    });
  }

}
