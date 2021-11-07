import { NovelItemService } from './NovelItemService';

export class CharacterGroupService extends NovelItemService {

    getAPIPath(): string {
        return 'character-groups';
    }
}