import { NovelItemService } from './NovelItemService';

export class CharacterService extends NovelItemService {
    getAPIPath(parentId): string {
        return `character-groups/${parentId}/characters`;
    }   
}