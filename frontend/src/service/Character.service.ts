import { AxiosResponse } from 'axios';
import { API } from './Axios';
import { NovelItemService } from './NovelItemService';

export class CharacterService extends NovelItemService {
    deleteImage(novelId: number, characterId: number, fileId: number) {
        return API.delete(`${this.getBasePath(novelId)}/${characterId}/files/${fileId}`);
    }

    getAPIPath(): string {
        return 'characters';
    }

    getUploadUrl(novelId: number, characterId: number) {
        return `${this.getBasePath(novelId)}/${characterId}/upload`;
    }

    getImageUrl(novelId: number, characterId: number, fileId: number) {
        return `${this.getBasePath(novelId)}/${characterId}/files/${fileId}`;
    }
    
}