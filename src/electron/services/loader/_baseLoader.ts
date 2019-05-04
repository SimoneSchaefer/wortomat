import { FindOneOptions, FindManyOptions, Repository, getRepository, Entity, ObjectLiteral } from 'typeorm';

import { Logger } from '../Logger';

import { RepositoryFactory} from './RepositoryFactory'
import { BaseEntity } from '../../../app/entity/_baseEntity';

import { UiMessageHandler } from "../UiMessageHandler";
import { ProjectEntity } from '../../../app/entity/ProjectEntity';
import { Channel, DataType } from '../../../app/message/Message';

export abstract class BaseLoader {

    constructor(protected channel: DataType) {}


    /** 
     * To be overwritten in subclasses in case 
     * special arguments for loading shall be used, e.g. relations or ordering
    */
    protected getRelations() : string[]{
        return [];
    }



    /** 
     * To be overwritten in subclasses in case 
     * special arguments for loading shall be used, e.g. relations or ordering
    */
    protected getOrderBy() : { [P in keyof BaseEntity]?: "ASC"|"DESC"|1|-1 } {
        return {};
     }


     /**
      * To be overwritten in subclasses in case
      * special where clauses shall be needed
      * (default filters according to project id)
      */
     protected getCondition(id: number) : Partial<BaseEntity>|ObjectLiteral|string {
         if (id > 0) {
            return {project: id};  
         }
        return {};
     }


     private getLoadOptions(id: number) {
         Logger.debug(`condition for id ${id} is: ${this.getCondition(id)}`)
         return {
            relations : this.getRelations(),
            order: this.getOrderBy(),
            where: this.getCondition(id)
         }
     }



    /**
     * Create or update the specified entity
     * 
     * @param entity the entity to be saved
     */
    public createOrUpdate(entity: BaseEntity) : Promise<BaseEntity> {
        return RepositoryFactory.getRepository(this.channel)
        .then(repository => {
            return repository.save(entity)
        });
    }



    /**
     * Load all entities for the type specified in #channel
     * 
     * @param id the associated project. Pass -1 if all entities shall be loaded
        * 
     */
    public loadAll() : Promise<BaseEntity[]>  {
        return RepositoryFactory.getRepository(this.channel)
        .then(repository => {
            return repository.find()
        });
    }



    /**
     * Load the entity with the specified id for the type specified in #channel
     * 
     * @param id primary key
     */
    public loadSingle(id: number) : Promise<BaseEntity>{
        return RepositoryFactory.getRepository(this.channel)
        .then(repository => {
            return repository.findOne(id, this.getLoadOptions(-1));
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
            RepositoryFactory.getRepository($this.channel).then(repository => {
                return repository.remove(entity);
            });
        });
    }
}