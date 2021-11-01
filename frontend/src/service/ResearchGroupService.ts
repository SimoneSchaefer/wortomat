import { NovelItemService } from './NovelItemService';

export class ResearchGroupService extends NovelItemService {

    getAPIPath(): string {
        return 'research-groups';
    }
}