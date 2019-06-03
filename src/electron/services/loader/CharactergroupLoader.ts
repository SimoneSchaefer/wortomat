import { DataType } from '../../../app/message/Message';
import { BaseLoader } from './_baseLoader';
import { PartEntity } from '../../../app/entity/PartEntity';
import { BaseGroupLoader } from './_baseGroupLoader';


export class CharactergroupLoader extends BaseGroupLoader {
    constructor(connectionName : string) {
        super(DataType.CHARACTERS, connectionName);
    }
   
}