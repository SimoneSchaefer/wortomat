import { NovelItemService } from './NovelItemService';

export class ResearchService extends NovelItemService {
    getAPIPath(parentId): string {
        return `research-groups/${parentId}/research`;
    }
}