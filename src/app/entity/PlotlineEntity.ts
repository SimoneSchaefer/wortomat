import { BaseEntity } from "./_baseEntity";
import { Entity, Column, ManyToOne } from "typeorm";
import { PartEntity } from "./PartEntity";
import { PlotlineGroupEntity } from "./PlotlineGroupEntity";


@Entity()
export class PlotlineEntity extends BaseEntity {
    @ManyToOne(type => PlotlineGroupEntity, parent => parent.children, {onDelete: 'CASCADE'/*, onUpdate: 'CASCADE'*/, eager: true})
    parent : PlotlineGroupEntity;
}