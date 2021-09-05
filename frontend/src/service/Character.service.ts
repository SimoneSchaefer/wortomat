import { AxiosResponse } from 'axios';
import { API } from './Axios';
import { NovelItemService } from './NovelItemService';

export class CharacterService extends NovelItemService {
    getAPIPath(): string {
        return 'characters';
    }

    
}