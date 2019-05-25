import { Component, OnInit } from '@angular/core';
import { BaseDetailComponent } from '../_baseEditComponent';
import { ActivatedRoute, Router } from '@angular/router';
import { PartService } from '../../services/electron/part.service';
import { AlertService } from '../../services/alert.service';
import { PartEntity } from '../../entity/PartEntity';
import { ChapterEntity } from '../../entity/ChapterEntity';
import { ChapterService } from '../../services/electron/chapter.service';

@Component({
  selector: 'app-chapter-edit',
  templateUrl: './chapter-edit.component.html',
  styleUrls: ['./chapter-edit.component.scss']
})
export class ChapterEditComponent extends BaseDetailComponent {

  constructor(
    route : ActivatedRoute, 
    router : Router, 
    baseService: ChapterService,
    alertService : AlertService,
    private _partService : PartService) {
    super(route, router, baseService, alertService);
  }


  protected goBack() {
    this._router.navigateByUrl('/parts');
}


  protected createNewModel() : ChapterEntity {
    let $this = this;
    if (this.params["partId"]) {
      let chapter = new ChapterEntity();
      this._partService.load(this.params['partId'], function (response) {
        let m = new ChapterEntity();
        m.parent = response.data.entity;
        $this.baseModel = m;
      });
      return chapter;
    } else {
      return null;
    }
  }

}
