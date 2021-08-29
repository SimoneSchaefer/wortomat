import { NovelItemService } from './NovelItemService';

export class TagService extends NovelItemService {
    getAPIPath(): string {
        return 'tags';
    }
}