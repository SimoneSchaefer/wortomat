import { Entity, OneToMany } from "typeorm";
import { BaseGroupEntity } from "./_baseGroupEntity";
import { ChapterEntity } from "./ChapterEntity";
import { CharacterEntity } from "./CharacterEntity";
import { LocationEntity } from "./LocationEntity";
import { PlotlineEntity } from "./PlotlineEntity";


@Entity()
export class PlotlineGroupEntity extends BaseGroupEntity {
  
    @OneToMany(type => PlotlineEntity, location => location.parent, {/*onUpdate : 'CASCADE'*/})
    children : Array<PlotlineEntity>;
}