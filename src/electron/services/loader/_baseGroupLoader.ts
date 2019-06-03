import { BaseLoader } from "./_baseLoader";

export class BaseGroupLoader extends BaseLoader {
    protected getRelations() : string[]{
        return ["children"];
      }
}