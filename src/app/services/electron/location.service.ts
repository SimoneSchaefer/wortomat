import { Injectable } from '@angular/core';
import { OpenProjectService } from '../open-project.service';
import { ElectronService } from './electron.service';
import { BaseService } from './_baseService';
import { DataType } from '../../message/Message';

@Injectable({
  providedIn: 'root'
})
export class LocationService  extends BaseService {

  constructor(electronService : ElectronService, openProjectService : OpenProjectService) { 
    super(electronService, openProjectService);
  }


  protected getDataType() : DataType {
    return DataType.LOCATIONS;
  }
}
