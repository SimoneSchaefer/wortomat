import { NovelItemService } from './NovelItemService';

export class ChapterService extends NovelItemService {

    getAPIPath(): string {
        return 'chapters';
    }
}