import { Injectable } from '@angular/core';
import { BaseService } from './_baseService';
import { ElectronService } from './electron.service';
import { DataType, MessageResponse, MessageRequest, Channel } from '../../message/Message';
import { ProjectEntity } from '../../entity/ProjectEntity';
import { OpenProjectService } from '../open-project.service';

@Injectable({
  providedIn: 'root'
})
export class PartService extends BaseService {

  constructor(electronService : ElectronService, openProjectService : OpenProjectService) { 
    super(electronService, openProjectService);
  }


  protected getDataType() : DataType {
    return DataType.PARTS;
  }
}
