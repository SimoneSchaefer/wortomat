package de.wortomat.service;

import de.wortomat.model.Chapter;
import de.wortomat.model.Research;
import de.wortomat.model.TimelineEvent;
import de.wortomat.repository.TimelineEventRepository;
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


    public TimelineEvent addChapterReference(Long novelId, Long timelineEventId, Long chapterId) {
        TimelineEvent timelineEvent = this.timelineEventRepository.findById(timelineEventId).get();
        Chapter chapter = this.chapterService.getRepository().findById(chapterId).get();

        timelineEvent.setNovel(novelService.get(novelId));
        timelineEvent.getChapters().add(chapter);
        TimelineEvent bla = this.timelineEventRepository.save(timelineEvent);
        TimelineEvent blubb = this.timelineEventRepository.findById(timelineEventId).get();
        return blubb;
    }
    public TimelineEvent addResearchReference(Long novelId, Long timelineEventId, Long researchId) {
        TimelineEvent timelineEvent = this.timelineEventRepository.findById(timelineEventId).get();
        Research research = this.researchService.getRepository().findById(researchId).get();

        timelineEvent.setNovel(novelService.get(novelId));
        timelineEvent.getResearch().add(research);
        TimelineEvent bla = this.timelineEventRepository.save(timelineEvent);
        TimelineEvent blubb = this.timelineEventRepository.findById(timelineEventId).get();
        return blubb;
    }

    public List<TimelineEvent> getAll(Long novelId) {
        return this.timelineEventRepository.findAllByNovelIdOrderByEventDate(novelId);
    }
}
