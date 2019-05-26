import { Repository, getRepository, Entity, ObjectLiteral, FindOptions, FindOptionsOrder, FindOptionsRelation } from 'typeorm';

import { Logger } from '../Logger';

import { RepositoryFactory} from './RepositoryFactory'
import { BaseEntity } from '../../../app/entity/_baseEntity';

import { UiMessageHandler } from "../UiMessageHandler";
import { ProjectEntity } from '../../../app/entity/ProjectEntity';
import { Channel, DataType } from '../../../app/message/Message';
import { log } from 'electron-log';
import { BaseGroupEntity } from '../../../app/entity/_baseGroupEntity';
import { ChildrenOutletContexts } from '@angular/router';

export abstract class BaseLoader {

    constructor(protected channel: DataType, protected connectionName : string) {}


    /** 
     * To be overwritten in subclasses in case 
     * special arguments for loading shall be used, e.g. relations or ordering
    */
    protected getRelations() : FindOptionsRelation<BaseEntity>{
        return [];
    }



    /** 
     * To be overwritten in subclasses in case 
     * special arguments for loading shall be used, e.g. relations or ordering
    */
    protected getOrderBy() : FindOptionsOrder<BaseEntity> {
        return {};
     }


     /**
      * To be overwritten in subclasses in case
      * special where clauses shall be needed
      * (default filters according to project id)
      */
     protected getCondition(id: number) : Partial<BaseEntity>|ObjectLiteral|string {
         /*if (id > 0) {
            return {project: id};  
         }*/
        return {};
     }

  /**
      * To be overwritten in subclasses in case
      * special operations need to be done
      * before saving an entity
      */
     protected beforeCreate(entity : BaseEntity) : Promise<any> {
        return Promise.resolve();
     }


     private getLoadOptions(id: number) : FindOptions<BaseEntity> {
         return {
            relations : this.getRelations(),
            order: this.getOrderBy(),
            //where: this.getCondition(id)
         }
     }



    /**
     * Create or update the specified entity
     * 
     * @param entity the entity to be saved
     */
    public createOrUpdate(entity: BaseEntity) : Promise<BaseEntity> {
        return this.beforeCreate(entity).then(() => {
            return RepositoryFactory.getRepository(this.channel, this.connectionName)
            .then(repository => {
                return repository.save(entity)
            });
        }).catch(function() {
            return Promise.reject();
        });
    }








    /**
     * Updates all entities. 
     * 
     * @param entity the entity to be saved
     */
    public saveAll(entities: BaseGroupEntity[]) : Promise<BaseEntity[]> {
        Logger.info("saving all entities, count is " + entities.length);
        return RepositoryFactory.getRepository(this.channel, this.connectionName)
            .then(repository => {
                entities.forEach(e => {
                    Logger.info(e.name + ' ' + e.id);
                    if (e['children']) {
                        //Workaround: Typeorm apparently does not check relations for changes when doing updates.
                        //So we need to update the children here. 
                        for (let child of e['children']) {
                            RepositoryFactory.getChildRepository(this.channel, this.connectionName).then(rep => {
                                child.parent = e;
                                Logger.info('Saving ' + child.name + ' ' + child.order + ' and parent ' + child.parent);
                                this.saveWithWait(rep, child);





                            });
                        }
                    }
                });
                return repository.save(entities);
            }).catch(function(e) {
                Logger.error("saving entities failed " + e);
                return Promise.reject();
        });
    }

    async saveWithWait(repository, entity) {
        return await repository.save(entity);
    }




    /**
     * Load all entities for the type specified in #channel
     * 
     * @param id the associated project. Pass -1 if all entities shall be loaded
        * 
     */
    public loadAll() : Promise<BaseEntity[]>  {
        return RepositoryFactory.getRepository(this.channel, this.connectionName)
        .then(repository => {
            return repository.find(this.getLoadOptions(-1))
            .then(entities => {
              //  Logger.info('setting order on ' + entities);
                entities.forEach(entity => {
                    if (entity['children']) {
                      //  Logger.info('inspecting entity with ' + entity['children'].length + ' children');
                       // Logger.info(entity['children']);

                        entity['children'].sort(function (a, b) {
                            if (a.order < b.order) {
                                return -1;
                            }
                            if (a.order > b.order) {
                                return 1;
                            }
                            return 0;
                        })
                      //  Logger.info('After');
                     //   Logger.info(entity['children']);

                    }
                });
                return entities;
            })
        }).catch(function() {
            return Promise.reject();
        });
    }



    /**
     * Load the entity with the specified id for the type specified in #channel
     * 
     * @param id primary key
     */
    public loadSingle(id: number) : Promise<BaseEntity>{
        return RepositoryFactory.getRepository(this.channel, this.connectionName)
        .then(repository => {
            return repository.findOne(id, this.getLoadOptions(-1));
        }).catch(function() {
            return Promise.reject();
        });        
   }



    /**
     * Remove the entity with the specified id for the type specified in #channel
     * 
     * @param id primary key
     */
    public removeSingle(id: number) : Promise<void> {
        let $this = this;
        return this.loadSingle(id)
        .then(entity => {
            RepositoryFactory.getRepository($this.channel, this.connectionName).then(repository => {
                return repository.remove(entity);
            });
        }).catch(function() {
            return Promise.reject();
        });
    }
}