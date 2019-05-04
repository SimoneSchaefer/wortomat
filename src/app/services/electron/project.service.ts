import { Injectable } from '@angular/core';
import { BaseService } from './_baseService';
import { ElectronService } from './electron.service';
import { DataType, MessageResponse, MessageRequest, Channel } from '../../message/Message';
import { ProjectEntity } from '../../entity/ProjectEntity';

@Injectable({
  providedIn: 'root'
})
export class ProjectService extends BaseService {

  constructor(electronService : ElectronService) { 
    super(electronService);
  }



  open(id: ProjectEntity, callback: (response: MessageResponse) => void) {
    let $this = this;
    this.electronService.send(new MessageRequest(Channel.OPEN_PROJECT, function (evt, response: MessageResponse) {
        callback(response);
    }, {id: id, dataType: $this.getDataType(),                 
      entity : id, 
    }));
}



  protected getDataType() : DataType {
    return DataType.PROJECTS;
  }
}
