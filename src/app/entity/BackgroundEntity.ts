import { BaseEntity } from "./_baseEntity";
import { Entity, Column, ManyToOne } from "typeorm";
import { PartEntity } from "./PartEntity";
import { BackgroundGroupEntity } from "./BackgroundGroupEntity";


@Entity()
export class BackgroundEntity extends BaseEntity {
    @ManyToOne(type => BackgroundGroupEntity, parent => parent.children, {onDelete: 'CASCADE'/*, onUpdate: 'CASCADE'*/, eager: true})
    parent : BackgroundGroupEntity;
}