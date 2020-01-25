import { BaseEntity } from "./_baseEntity";
import { Entity, Column, ManyToOne, ManyToMany } from "typeorm";
import { CharacterGroupEntity } from "./CharacterGroupEntity";
import { ChapterEntity } from "./ChapterEntity";


@Entity()
export class CharacterEntity extends BaseEntity {
    @ManyToOne(type => CharacterGroupEntity, parent => parent.children, {onDelete: 'CASCADE'/*, onUpdate: 'CASCADE'*/, eager: true})
    parent : CharacterGroupEntity;

    @ManyToMany(type => ChapterEntity)
    chapters: ChapterEntity[];
}