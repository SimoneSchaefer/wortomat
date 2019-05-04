import {Column, PrimaryGeneratedColumn, OneToMany} from "typeorm";
import { BaseEntity } from "./_baseEntity";


//Not used, as SQLITE does not understand enums. 
//I leave it here for documentation purposes. 
/*export enum Status {
    Todo = 0,
    FirstDraft = 1,
    RevisedDraft = 2,
    Finished = 3
}*/

export abstract class GroupEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text", {nullable: true})
    name: string;    
    
    @Column("text", {nullable: true})
    summary: string;

    @Column("text", {nullable: true})
    notes: string;

    @Column("integer", {default: 0})
    status: number;

    @Column("integer", {default: -1})
    order: number;

   /* @OneToMany(type => BaseEntity, children => children, {cascade: true})
    children : Array<BaseEntity>; */  
}