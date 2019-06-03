import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { DataType } from '../../message/Message';
import { OpenProjectService } from '../open-project.service';
import { BaseService } from './_baseService';

@Injectable({
  providedIn: 'root'
})
export class BackgroundGroupService  extends BaseService {

  constructor(electronService : ElectronService, openProjectService : OpenProjectService) { 
    super(electronService, openProjectService);
  }


  protected getDataType() : DataType {
    return DataType.BACKGROUND_GROUPS;
  }
}
