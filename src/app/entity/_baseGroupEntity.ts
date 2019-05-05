import {Column, PrimaryGeneratedColumn, ManyToOne} from "typeorm";


//Not used, as SQLITE does not understand enums. 
//I leave it here for documentation purposes. 
export enum Status {
    Todo = 0,
    FirstDraft = 1,
    RevisedDraft = 2,
    Finished = 3
}

export abstract class BaseGroupEntity {
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
}