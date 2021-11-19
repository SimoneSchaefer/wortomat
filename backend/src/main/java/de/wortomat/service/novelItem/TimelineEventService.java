package de.wortomat.service.novelItem;

import de.wortomat.exceptions.NotFoundException;
import de.wortomat.model.Chapter;
import de.wortomat.model.Research;
import de.wortomat.model.TimelineEvent;
import de.wortomat.repository.TimelineEventRepository;
import de.wortomat.service.NovelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TimelineEventService {
    @Autowired
    private TimelineEventRepository timelineEventRepository;

    @Autowired
    private ChapterService chapterService;

    @Autowired
    private ResearchService researchService;

    @Autowired
    private NovelService novelService;

    public TimelineEvent create(Long novelId, TimelineEvent timelineEvent) {
        timelineEvent.setNovel((novelService.get(novelId)));
        return this.timelineEventRepository.save(timelineEvent);
    }

    public TimelineEvent update(Long novelId, TimelineEvent timelineEvent) {
        timelineEvent.setNovel(novelService.get(novelId));
        return this.timelineEventRepository.save(timelineEvent);
    }

    public TimelineEvent deleteChapterReference(Long novelId, Long timelineEventId, Long chapterId) {
        TimelineEvent timelineEvent = this.timelineEventRepository.findById(timelineEventId).orElseThrow(NotFoundException::new);
        Chapter chapter = this.chapterService.getRepository().findById(chapterId).orElseThrow(NotFoundException::new);

        timelineEvent.getChapters().remove(chapter);
        return this.timelineEventRepository.save(timelineEvent);
    }

    public TimelineEvent deleteResearchReference(Long novelId, Long timelineEventId, Long researchId) {
        TimelineEvent timelineEvent = this.timelineEventRepository.findById(timelineEventId).orElseThrow(NotFoundException::new);
        Research research = this.researchService.getRepository().findById(researchId).orElseThrow(NotFoundException::new);

        timelineEvent.getResearch().remove(research);
        return this.timelineEventRepository.save(timelineEvent);
    }


    public TimelineEvent addChapterReference(Long novelId, Long timelineEventId, Long chapterId) {
        TimelineEvent timelineEvent = this.timelineEventRepository.findById(timelineEventId).orElseThrow(NotFoundException::new);
        Chapter chapter = this.chapterService.getRepository().findById(chapterId).orElseThrow(NotFoundException::new);

        timelineEvent.setNovel(novelService.get(novelId));
        timelineEvent.getChapters().add(chapter);
        return this.timelineEventRepository.save(timelineEvent);
    }

    public TimelineEvent addResearchReference(Long novelId, Long timelineEventId, Long researchId) {
        TimelineEvent timelineEvent = this.timelineEventRepository.findById(timelineEventId).orElseThrow(NotFoundException::new);
        Research research = this.researchService.getRepository().findById(researchId).orElseThrow(NotFoundException::new);

        timelineEvent.setNovel(novelService.get(novelId));
        timelineEvent.getResearch().add(research);
        return this.timelineEventRepository.save(timelineEvent);
    }

    public void delete(Long novelId, Long eventId) {
        this.timelineEventRepository.deleteById(eventId);
    }

    public void deleteAll(Long novelId) {
        List<TimelineEvent> allItems = this.timelineEventRepository.findAllByNovelIdOrderByEventDate(novelId);
        this.timelineEventRepository.deleteAll(allItems);
    }

    public List<TimelineEvent> getAll(Long novelId) {
        return this.timelineEventRepository.findAllByNovelIdOrderByEventDate(novelId);
    }
}
