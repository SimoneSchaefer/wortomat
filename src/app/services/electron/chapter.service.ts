import { Injectable } from '@angular/core';
import { BaseService } from './_baseService';
import { ElectronService } from './electron.service';
import { OpenProjectService } from '../open-project.service';
import { DataType } from '../../message/Message';

@Injectable({
  providedIn: 'root'
})
export class ChapterService extends BaseService {

  constructor(electronService : ElectronService, openProjectService : OpenProjectService) { 
    super(electronService, openProjectService);
  }


  protected getDataType() : DataType {
    return DataType.CHAPTERS;
  }
}
