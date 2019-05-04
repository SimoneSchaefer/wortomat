import { Injectable } from '@angular/core';
import { BaseService } from './_baseService';
import { ElectronService } from './electron.service';
import { DataType } from '../../message/Message';

@Injectable({
  providedIn: 'root'
})
export class ProjectService extends BaseService {

  constructor(electronService : ElectronService) { 
    super(electronService);
  }

  protected getDataType() : DataType {
    return DataType.PROJECTS;
  }
}
