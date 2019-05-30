import { BaseEntity } from "./_baseEntity";
import { Entity, Column, ManyToOne } from "typeorm";
import { CharacterGroupEntity } from "./CharacterGroupEntity";
import { LocationGroupEntity } from "./LocationGroupEntity";


@Entity()
export class LocationEntity extends BaseEntity {
    @ManyToOne(type => LocationGroupEntity, parent => parent.children, {onDelete: 'CASCADE'/*, onUpdate: 'CASCADE'*/, eager: true})
    parent : LocationGroupEntity;
}