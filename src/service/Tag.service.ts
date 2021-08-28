import { NovelItemService } from './NovelItemService';

export class TagService extends NovelItemService {
    getAPIPath() {
        return 'tags';
    }
}