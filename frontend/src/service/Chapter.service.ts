import { NovelItemService } from './NovelItemService';

export class ChapterService extends NovelItemService {
    getAPIPath(parentId: number): string {
        return `parts/${parentId}/chapters`;
    }
}