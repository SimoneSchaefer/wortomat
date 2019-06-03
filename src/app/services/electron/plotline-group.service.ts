import { Injectable } from '@angular/core';
import { BaseService } from './_baseService';
import { OpenProjectService } from '../open-project.service';
import { ElectronService } from './electron.service';
import { DataType } from '../../message/Message';

@Injectable({
  providedIn: 'root'
})
export class PlotlineGroupService  extends BaseService {

  constructor(electronService : ElectronService, openProjectService : OpenProjectService) { 
    super(electronService, openProjectService);
  }


  protected getDataType() : DataType {
    return DataType.PLOTLINE_GROUPS;
  }
}
