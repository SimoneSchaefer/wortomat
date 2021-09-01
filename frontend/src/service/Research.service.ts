import { NovelItemService } from './NovelItemService';

export class ResearchService extends NovelItemService {

    getAPIPath(): string {
        return 'research';
    }
}