import { BaseEntity } from "./_baseEntity";
import { Entity, Column, ManyToOne } from "typeorm";
import { PartEntity } from "./PartEntity";


@Entity()
export class ChapterEntity extends BaseEntity {
    @ManyToOne(type => PartEntity, parent => parent.children, {onDelete: 'CASCADE'/*, onUpdate: 'CASCADE'*/, eager: true})
    parent : PartEntity;
}