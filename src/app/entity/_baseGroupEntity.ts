import { BaseEntity } from "./_baseEntity";
import { BaseChildEntity } from "./_baseChildEntity";

export abstract class BaseGroupEntity extends BaseEntity{
    abstract children : Array<BaseChildEntity>;
}