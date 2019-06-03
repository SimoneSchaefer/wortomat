import { BaseEntity } from "./_baseEntity";
import { Entity, Column } from "typeorm";
import { BaseGroupEntity } from "./_baseGroupEntity";
import { BaseChildEntity } from "./_baseChildEntity";


@Entity()
export class ProjectEntity extends BaseGroupEntity {
    @Column("text", {nullable: true})
    path: string;  

    children: Array<BaseChildEntity>;
}