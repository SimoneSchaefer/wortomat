import { ElectronService } from './electron.service'
import { BaseEntity } from '../../entity/_baseEntity';
import { Channel, MessageRequest, MessageResponse, ResponseType, DataType } from '../../message/Message'
import { OpenProjectService } from '../open-project.service';
import { BaseGroupEntity } from '../../entity/_baseGroupEntity';

export abstract class BaseService {

    protected abstract getDataType(): DataType;

    constructor(protected electronService: ElectronService, protected openProjectService : OpenProjectService) {
    }

    saveAll(entities: BaseGroupEntity[], callback: (response: MessageResponse) => void) {
        let $this = this;
        this.electronService.send(new MessageRequest(
            Channel.UPDATE_ORDER, 
            function (evt, response: MessageResponse) {
                callback(response);
            }, 
            {
                entities : entities, 
                dataType: $this.getDataType(),
                connectionName : $this.openProjectService.identifier 
            })
        );
    }


    save(entity: BaseEntity, callback: (response: MessageResponse) => void) {
        let $this = this;
        this.electronService.send(new MessageRequest(
            Channel.CREATE_OR_UPDATE, 
            function (evt, response: MessageResponse) {
                callback(response);
            }, 
            {
                entity : entity, 
                dataType: $this.getDataType(),
                connectionName : $this.openProjectService.identifier 
            })
        );
    }

    loadAll(callback: (response: MessageResponse) => void) {
        let $this = this;
        console.log('load all for ' + $this.getDataType());
        this.electronService.send(new MessageRequest(Channel.LOAD_ALL, function (evt, response: MessageResponse) {
            callback(response);
        }, {
            dataType: $this.getDataType(),
            connectionName : $this.openProjectService.identifier 
        }));
    }


    load(id: number, callback: (response: MessageResponse) => void) {
        let $this = this;
        this.electronService.send(new MessageRequest(Channel.LOAD_SINGLE, function (evt, response: MessageResponse) {
            callback(response);
        }, {
            id: id, 
             dataType: $this.getDataType(),     
            connectionName : $this.openProjectService.identifier 
        }));
    }


    remove(id: number, callback: (response: MessageResponse) => void) {
        let $this = this;
        this.electronService.send(new MessageRequest(Channel.DELETE_SINGLE, function (evt, response: MessageResponse) {
            callback(response);
        }, {
            id: id, 
            dataType: $this.getDataType(),
            connectionName : $this.openProjectService.identifier 
        }));
    }
   

    private generateMessageKey(): string {
        return Math.random().toString(36).substring(7);
    }
}