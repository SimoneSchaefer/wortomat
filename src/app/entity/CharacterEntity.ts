import { BaseEntity } from "./_baseEntity";
import { Entity, Column, ManyToOne } from "typeorm";
import { CharacterGroupEntity } from "./CharacterGroupEntity";


@Entity()
export class CharacterEntity extends BaseEntity {
    @ManyToOne(type => CharacterGroupEntity, parent => parent.children, {onDelete: 'CASCADE'/*, onUpdate: 'CASCADE'*/, eager: true})
    parent : CharacterGroupEntity;
}