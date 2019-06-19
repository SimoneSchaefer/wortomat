import {Column, PrimaryGeneratedColumn, ManyToOne} from "typeorm";
import { BaseGroupEntity } from "./_baseGroupEntity";


//Not used, as SQLITE does not understand enums. 
//I leave it here for documentation purposes. 
export enum Status {
    Todo = 0,
    FirstDraft = 1,
    RevisedDraft = 2,
    Finished = 3
}


export enum ENTITY_TYPE {
    PROJECTS = 'projects',
    PARTS = 'parts',
    CHARACTERS = 'characters',
    LOCATIONS = 'locations',
    PLOTLINES = 'plotlines',
    BACKGROUNDS = 'backgrounds'
  }
  

export abstract class BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text", {nullable: true})
    name: string;    
    
    @Column("text", {nullable: true})
    summary: string; 
    
    @Column("text", {nullable: true})
    detailedSummary: string;

    @Column("text", {nullable: true})
    notes: string;

    @Column("integer", {default: 0})
    status: number;

    @Column("integer", {default: -1})
    order: number;

    @Column("blob", {nullable : true})
    image : string;

}