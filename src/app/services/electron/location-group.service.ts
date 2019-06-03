import { Injectable } from '@angular/core';
import { DataType } from '../../message/Message';
import { BaseService } from './_baseService';
import { ElectronService } from './electron.service';
import { OpenProjectService } from '../open-project.service';

@Injectable({
  providedIn: 'root'
})
export class LocationGroupService extends BaseService {

  constructor(electronService : ElectronService, openProjectService : OpenProjectService) { 
    super(electronService, openProjectService);
  }


  protected getDataType() : DataType {
    return DataType.LOCATION_GROUPS;
  }
}
