import { Entity, OneToMany } from "typeorm";
import { BaseGroupEntity } from "./_baseGroupEntity";
import { ChapterEntity } from "./ChapterEntity";
import { CharacterEntity } from "./CharacterEntity";
import { LocationEntity } from "./LocationEntity";


@Entity()
export class LocationGroupEntity extends BaseGroupEntity {
  
    @OneToMany(type => LocationEntity, location => location.parent, {/*onUpdate : 'CASCADE'*/})
    children : Array<LocationEntity>;
}