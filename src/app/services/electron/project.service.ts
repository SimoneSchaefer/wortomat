import { Injectable } from '@angular/core';
import { BaseService } from './_baseService';
import { ElectronService } from './electron.service';
import { DataType, MessageResponse, MessageRequest, Channel } from '../../message/Message';
import { ProjectEntity } from '../../entity/ProjectEntity';
import { OpenProjectService } from '../open-project.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService extends BaseService {

  constructor(electronService : ElectronService, openProjectService : OpenProjectService) { 
    super(electronService, openProjectService);
  }



  open(id: ProjectEntity, callback: (response: MessageResponse) => void) {
    let $this = this;
    this.electronService.send(new MessageRequest(Channel.OPEN_PROJECT, function (evt, response: MessageResponse) {
        callback(response);
    }, {id: id, dataType: $this.getDataType(),                 
      entity : id, 
    }));
}


close(callback: (response: MessageResponse) => void) {
  let $this = this;
  this.electronService.send(new MessageRequest(Channel.CLOSE_PROJECT, function (evt, response: MessageResponse) {
      callback(response);
  }, {
    dataType: $this.getDataType(),                 
    connectionName : $this.openProjectService.identifier 
  }));

}



  protected getDataType() : DataType {
    return DataType.PROJECTS;
  }
}
