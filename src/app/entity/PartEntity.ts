import { Entity, OneToMany } from "typeorm";
import { BaseGroupEntity } from "./_baseGroupEntity";
import { ChapterEntity } from "./ChapterEntity";


@Entity()
export class PartEntity extends BaseGroupEntity {
  
    @OneToMany(type => ChapterEntity, chapter => chapter.parent, {/*onUpdate : 'CASCADE'*/})
    children : Array<ChapterEntity>;
}