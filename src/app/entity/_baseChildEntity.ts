import { BaseEntity } from "./_baseEntity";
import { BaseGroupEntity } from "./_baseGroupEntity";

export abstract class BaseChildEntity extends BaseEntity{

    abstract parent : BaseGroupEntity;

}