import { BaseEntity } from "./_baseEntity";
import { Entity, Column } from "typeorm";


@Entity()
export class ProjectEntity extends BaseEntity {
    @Column("text", {nullable: true})
    path: string;  
}