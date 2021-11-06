import { BaseModel } from "@/models/Base.model";
import { IState } from "@/store/istate";
import { NOVEL_ITEM_KEYS } from "@/store/keys";
import { KEY_TO_CHILD } from "@/store/store-api-adapter";

export class SelectionService {
    getFirstItemToSelect(state: IState, key: NOVEL_ITEM_KEYS, loadedItems: BaseModel[]) {
        const keyOfInterest = KEY_TO_CHILD.has(key) ? KEY_TO_CHILD.get(key) : key;
        const selection = state.selection.get(keyOfInterest) || [];
        let itemToSelect = null;
        if (!selection.length && loadedItems.length) {
            if (!KEY_TO_CHILD.has(key)) {
                itemToSelect = loadedItems[0];
            } else {
                const firstParentWithChildren = loadedItems.find(item => item[KEY_TO_CHILD.get(key)]?.length)
                if (firstParentWithChildren) {
                    const children = firstParentWithChildren[KEY_TO_CHILD.get(key)];
                    if (children?.length) {
                        itemToSelect = children[0];
                    }
                }                
            }
        }
        return itemToSelect;    
    }
}