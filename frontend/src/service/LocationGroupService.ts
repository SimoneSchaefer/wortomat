import { NovelItemService } from './NovelItemService';

export class LocationGroupService extends NovelItemService {

    getAPIPath(): string {
        return 'location-groups';
    }
}