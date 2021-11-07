import { NovelItemService } from './NovelItemService';

export class LocationService extends NovelItemService {
    getAPIPath(parentId): string {
        return `location-groups/${parentId}/research`;
    }
}