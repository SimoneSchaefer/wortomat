import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BaseService } from '../services/electron/_baseService';
import { BaseEntity } from '../entity/_baseEntity';
import { ResponseType } from '../message/Message';
import { AlertService } from '../services/alert.service';


export abstract class BaseDetailComponent  {
    protected baseModel: BaseEntity;

    protected abstract createNewModel(): BaseEntity;

    protected params: Params;

    protected editorOptions: Object;

    constructor(
        protected route: ActivatedRoute,
        protected _router: Router,
        protected baseService: BaseService,
        private _alertService : AlertService) {
    }

    protected beforeSave(): void {

    }


    protected afterCreate(baseEntity : BaseEntity): void {

    }


    save() {
        console.log('saving');
        let $this = this;
        this.baseService.save(this.baseModel, function (response) {
            if (response.responseType == ResponseType.SUCCESS) {
                $this._alertService.success('SAVE_SUCCESS');
                $this.goBack();
            } else {
                $this._alertService.error('SAVE_ERROR');
            }
        });

    }

    protected goBack() {
        this._router.navigateByUrl('/' + this.getRedirectUrl());
    }

    protected getRedirectUrl() {
        let url = this._router.url.toString().substring(1); //remove first "/"
        let baseUrl = url.substring(0, url.indexOf("/"));
        return baseUrl;
    }

    ngOnInit() {
        let $this = this;
        this.route.params.subscribe(params => {
            $this.params = params;
            if ($this.params["id"]) {
                console.dir();
                $this.baseService.load(params["id"], function (response) {
                    if (response.responseType === ResponseType.SUCCESS) {
                        $this.baseModel = response.data.entity;
                    }
                });
            } else {
                $this.baseModel = $this.createNewModel();
            }
        });
    }
}