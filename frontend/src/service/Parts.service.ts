import { NovelItemService } from './NovelItemService';

export class PartService extends NovelItemService {

    getAPIPath(): string {
        return 'parts';
    }
}