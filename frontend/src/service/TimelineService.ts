import { API } from './Axios';

import { BaseModel } from '@/models/Base.model';
import { TimelineEventModel } from '@/models/TimelineEvent';
import { childKeyForParentKey, PARENT_ITEM_KEYS } from '@/store/keys';
import { NovelItemService } from './NovelItemService';

export class TimelineService extends NovelItemService {
    
    getAPIPath() {
     return `timeline`;
    }

    addReference(novelId: number, timelineEvent: TimelineEventModel, item: BaseModel, key: PARENT_ITEM_KEYS) {
        return API.put(`${super.getBasePath(novelId)}/addReference?timelineEventId=${timelineEvent.id}&itemId=${item.id}&type=${childKeyForParentKey(key).toLocaleLowerCase()}`);
    }
    
    deleteReference(novelId: number, timelineEvent: TimelineEventModel, item: BaseModel, key: PARENT_ITEM_KEYS) {
        return API.delete(`${super.getBasePath(novelId)}/deleteReference?timelineEventId=${timelineEvent.id}&itemId=${item.id}&type=${childKeyForParentKey(key).toLocaleLowerCase()}`);
    }
}