import { BaseEntity } from "./_baseEntity";
import { Entity, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { PartEntity } from "./PartEntity";
import { PlotlineEntity } from "./PlotlineEntity";
import { CharacterEntity } from "./CharacterEntity";
import { LocationEntity } from "./LocationEntity";


@Entity()
export class ChapterEntity extends BaseEntity {
    @ManyToOne(type => PartEntity, parent => parent.children, {onDelete: 'CASCADE'/*, onUpdate: 'CASCADE'*/, eager: true})
    parent : PartEntity;

    @ManyToMany(type => PlotlineEntity, {eager: true})
    @JoinTable()
    plotlines: PlotlineEntity[];

    @ManyToMany(type => CharacterEntity, {eager: true})
    @JoinTable()
    characters: CharacterEntity[];

    @ManyToMany(type => LocationEntity, {eager: true})
    @JoinTable()
    locations: LocationEntity[];
}