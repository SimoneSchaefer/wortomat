import { Repository, getRepository } from 'typeorm';

import { ProjectEntity } from '../../../app/entity/ProjectEntity';
import { BaseEntity } from '../../../app/entity/_baseEntity';
import { Channel, ResponseType, DataType } from '../../../app/message/Message';
import { PartEntity } from '../../../app/entity/PartEntity';
import { Logger } from '../Logger';
import { ChapterEntity } from '../../../app/entity/ChapterEntity';


export class RepositoryFactory {
    public static getRepository(channel: DataType, connectionName): Promise<Repository<BaseEntity>> {
        return new Promise<Repository<BaseEntity>>((resolve, reject) => {
            Logger.info('get repository for channel ' + channel + " and connection " + connectionName);
            if (channel == DataType.PROJECTS) {
                resolve(getRepository(ProjectEntity, connectionName));
            }
            if (channel == DataType.PARTS) {
                resolve(getRepository(PartEntity, connectionName));
            }
            if (channel == DataType.CHAPTERS) {
                resolve(getRepository(ChapterEntity, connectionName));
            }
            /*
            if (channel == DataType.SCENES) {
                resolve(getRepository(SceneEntity));
            }
            if (channel == DataType.CHARACTERS) {
                resolve(getRepository(CharacterEntity));
            }
            if (channel == DataType.CHARACTER_GROUPS) {
                resolve(getRepository(CharacterGroupEntity));
            }
            if (channel == DataType.PLOTLINES) {
                resolve(getRepository(PlotlineEntity));
            }
            if (channel == DataType.PROJECTS) {
                resolve(getRepository(ProjectEntity));
            }
            if (channel == DataType.PARTS) {
                resolve(getRepository(PartEntity));
            }*/
            reject(ResponseType.ERROR_UNKNOWN_REPOSITORY);
        })
    }
}