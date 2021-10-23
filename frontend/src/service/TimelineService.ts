import { API } from './Axios';
import { NovelItemService } from './NovelItemService';

export class TimelineService extends NovelItemService {
    
    getAPIPath() {
     return `timeline`;
    }

    addChapterReference(novelId, timelineEvent, chapter) {
        return API.put(`${super.getBasePath(novelId)}/addChapter?timelineEventId=${timelineEvent.id}&chapterId=${chapter.id}`);
    }

    addResearchReference(novelId, timelineEvent, research) {
        return API.put(`${super.getBasePath(novelId)}/addResearch?timelineEventId=${timelineEvent.id}&researchId=${research.id}`);
    }
}