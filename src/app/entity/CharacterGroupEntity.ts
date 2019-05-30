import { Entity, OneToMany } from "typeorm";
import { BaseGroupEntity } from "./_baseGroupEntity";
import { ChapterEntity } from "./ChapterEntity";
import { CharacterEntity } from "./CharacterEntity";


@Entity()
export class CharacterGroupEntity extends BaseGroupEntity {
  
    @OneToMany(type => CharacterEntity, character => character.parent, {/*onUpdate : 'CASCADE'*/})
    children : Array<ChapterEntity>;
}