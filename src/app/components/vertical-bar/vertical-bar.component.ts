import { Component, OnInit, Input } from '@angular/core';
import { BaseEntity } from '../../entity/_baseEntity';

@Component({
  selector: 'app-vertical-bar',
  templateUrl: './vertical-bar.component.html',
  styleUrls: ['./vertical-bar.component.scss']
})
export class VerticalBarComponent implements OnInit {

  private _entities: BaseEntity[];
  protected _selectedEntity: BaseEntity;

  constructor() { }

  ngOnInit() {
  }

  @Input()
  set entities(value: BaseEntity[]) {
    this._entities = value;
  }

  get entities(): BaseEntity[] {
    return this._entities;
  }

  private _editing = new Array<number>();

  //protected abstract createNewParent(): BaseEntity;
  //protected abstract getStateType(): TYPES;


  public addParent() {
    /*let p = this.createNewParent();
    p.order = 0;
    let $this = this;*/
    /*this.openProjectService.getCurrentProject(function (proj) {
      p.project = proj;
      /*for (let entity of $this.entities) {
          entity.order = entity.order + 1;
          $this.parentService.save(entity, function (response) {
              console.dir(response);
          });
      }*/
    /*$this.parentService.save(p, function (response) {
      console.dir(response);
      $this.init();
    });
  });*/
  }


  public saveChild(child: BaseEntity) {
    //super.save(child, this.childService);
  }



  deleteChild(child: BaseEntity) {
    // super.delete(child, this.childService);
  }


  edit(parent: BaseEntity) {
    if (this._editing.indexOf(parent.id) < 0) {
      this._editing.push(parent.id);
    }
  }

  editing(parent: BaseEntity): boolean {
    console.dir(parent);
    return this._editing.indexOf(parent.id) >= 0;
  }


  visible(group: BaseEntity) {
    return true;
    //return this.stateService.getState(this.getStateType(), group) == STATE.EXPANDED;
  }

  toggle(group: BaseEntity) {
    //this.stateService.toggleState(this.getStateType(), group);

  }


  public select(entity: BaseEntity) {
    this._selectedEntity = entity;
  }

  set selectedEntity(entity: BaseEntity) {
    this._selectedEntity = entity;
  }

  get selectedEntity() {
    return this._selectedEntity;
  }


  updateParentName(parent: BaseEntity): void {
    this._editing.splice(this._editing.indexOf(parent.id), 1);
    let $this = this;
    /*$this.parentService.save(parent, function (response) {
      console.dir(response);
      $this.init();
    });*/


  }
}
