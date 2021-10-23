import { NovelItemService } from './NovelItemService';

export class TimelineService extends NovelItemService {
    
    /*get(id: number): Promise<AxiosResponse> {
        return API.get(this.getBaseUri(id))
    }
    
    update(id: number, timelineEventModel: TimelineEventModel): Promise<AxiosResponse> {
        return API.put(this.getBaseUri(id), timelineEventModel)
    } 

    create(id: number, timelineEventModel: TimelineEventModel): Promise<AxiosResponse> {
        return API.post(this.getBaseUri(id), timelineEventModel)
    }*/

    getAPIPath() {
     return `timeline`;
    }
}