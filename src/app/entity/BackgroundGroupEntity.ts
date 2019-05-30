import { Entity, OneToMany } from "typeorm";
import { BaseGroupEntity } from "./_baseGroupEntity";
import { ChapterEntity } from "./ChapterEntity";
import { CharacterEntity } from "./CharacterEntity";
import { BackgroundEntity } from "./BackgroundEntity";


@Entity()
export class BackgroundGroupEntity extends BaseGroupEntity {
  
    @OneToMany(type => BackgroundEntity, character => character.parent, {/*onUpdate : 'CASCADE'*/})
    children : Array<BackgroundEntity>;
}