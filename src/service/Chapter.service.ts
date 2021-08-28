import { NovelItemService } from './NovelItemService';

export class ChapterService extends NovelItemService {

    getAPIPath() {
        return 'chapters';
    }
}