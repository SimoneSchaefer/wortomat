import { Repository, getRepository } from 'typeorm';

import { ProjectEntity } from '../../../app/entity/ProjectEntity';
import { BaseEntity } from '../../../app/entity/_baseEntity';
import { Channel, ResponseType, DataType } from '../../../app/message/Message';
import { PartEntity } from '../../../app/entity/PartEntity';
import { Logger } from '../Logger';
import { ChapterEntity } from '../../../app/entity/ChapterEntity';
import { BaseChildEntity } from '../../../app/entity/_baseChildEntity';
import { BaseGroupEntity } from '../../../app/entity/_baseGroupEntity';
import { CharacterGroupEntity } from '../../../app/entity/CharacterGroupEntity';
import { CharacterEntity } from '../../../app/entity/CharacterEntity';
import { LocationEntity } from '../../../app/entity/LocationEntity';
import { LocationGroupEntity } from '../../../app/entity/LocationGroupEntity';
import { PlotlineEntity } from '../../../app/entity/PlotlineEntity';
import { PlotlineGroupEntity } from '../../../app/entity/PlotlineGroupEntity';
import { BackgroundEntity } from '../../../app/entity/BackgroundEntity';
import { BackgroundGroupEntity } from '../../../app/entity/BackgroundGroupEntity';


export class RepositoryFactory {

    public static getChildRepository(channel: DataType, connectionName): Promise<Repository<BaseEntity>> {
        return new Promise<Repository<any>>((resolve, reject) => {
            Logger.info('get child repository for channel ' + channel + " and connection " + connectionName);
            if (channel == DataType.PARTS) {
                resolve(getRepository(ChapterEntity, connectionName));
            }
            if (channel == DataType.CHARACTER_GROUPS) {
                resolve(getRepository(CharacterEntity, connectionName));
            }
            if (channel == DataType.LOCATION_GROUPS) {
                resolve(getRepository(LocationEntity, connectionName));
            }
            if (channel == DataType.PLOTLINE_GROUPS) {
                resolve(getRepository(PlotlineEntity, connectionName));
            }
            if (channel == DataType.BACKGROUND_GROUPS) {
                resolve(getRepository(BackgroundEntity, connectionName));
            }
            reject(ResponseType.ERROR_UNKNOWN_REPOSITORY);
        })
    }


    public static getRepository(channel: DataType, connectionName): Promise<Repository<BaseEntity>> {
        return new Promise<Repository<any>>((resolve, reject) => {
            Logger.info('get repository for channel ' + channel + " and connection " + connectionName);
            if (channel == DataType.PROJECTS) {
                Logger.info("Getting projects");
                resolve(getRepository(ProjectEntity, connectionName));
            }
            if (channel == DataType.PARTS) {
                resolve(getRepository(PartEntity, connectionName));
            }
            if (channel == DataType.CHAPTERS) {
                resolve(getRepository(ChapterEntity, connectionName));
            }
            if (channel == DataType.CHARACTERS) {
                resolve(getRepository(CharacterEntity, connectionName));
            }
            if (channel == DataType.CHARACTER_GROUPS) {
                resolve(getRepository(CharacterGroupEntity, connectionName));
            }
            if (channel == DataType.LOCATIONS) {
                resolve(getRepository(LocationEntity, connectionName));
            }
            if (channel == DataType.LOCATION_GROUPS) {
                resolve(getRepository(LocationGroupEntity, connectionName));
            }
            if (channel == DataType.PLOTLINES) {
                resolve(getRepository(PlotlineEntity, connectionName));
            }
            if (channel == DataType.PLOTLINE_GROUPS) {
                resolve(getRepository(PlotlineGroupEntity, connectionName));
            }
            if (channel == DataType.BACKGROUND) {
                resolve(getRepository(BackgroundEntity, connectionName));
            }
            if (channel == DataType.BACKGROUND_GROUPS) {
                resolve(getRepository(BackgroundGroupEntity, connectionName));
            }
            reject(ResponseType.ERROR_UNKNOWN_REPOSITORY);
        })
    }
}