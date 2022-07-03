package de.wortomat.service.novelItem;

import de.wortomat.exceptions.NotFoundException;
import de.wortomat.model.*;
import de.wortomat.model.Character;
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
    private CharacterService characterService;

    @Autowired
    private LocationService locationService;

    @Autowired
    private NovelService novelService;

    public TimelineEvent create(Long novelId, TimelineEvent timelineEvent) {
        timelineEvent.setNovel((novelService.get(novelId)));
        return this.timelineEventRepository.save(timelineEvent);
    }

    public TimelineEvent update(Long novelId, TimelineEvent timelineEvent) {
        TimelineEvent before = timelineEventRepository.findById(timelineEvent.getId()).orElseThrow(NotFoundException::new);

        timelineEvent.setChapters(before.getChapters());
        timelineEvent.setResearch(before.getResearch());
        timelineEvent.setLocations(before.getLocations());
        timelineEvent.setCharacters(before.getCharacters());
        timelineEvent.setNovel(novelService.get(novelId));

        return this.timelineEventRepository.save(timelineEvent);
    }

    public TimelineEvent deleteChapterReference(Long novelId, Long timelineEventId, Long chapterId) {
        TimelineEvent timelineEvent = this.timelineEventRepository.findById(timelineEventId).orElseThrow(NotFoundException::new);
        Chapter chapter = this.chapterService.getRepository().findById(chapterId).orElseThrow(NotFoundException::new);

        timelineEvent.getChapters().remove(chapter);
        return this.timelineEventRepository.save(timelineEvent);
    }
    public TimelineEvent deleteCharacterReference(Long novelId, Long timelineEventId, Long characterId) {
        TimelineEvent timelineEvent = this.timelineEventRepository.findById(timelineEventId).orElseThrow(NotFoundException::new);
        Character character = this.characterService.getRepository().findById(characterId).orElseThrow(NotFoundException::new);
        timelineEvent.getCharacters().remove(character);
        return this.timelineEventRepository.save(timelineEvent);
    }
    public TimelineEvent deleteLocationReference(Long novelId, Long timelineEventId, Long locationId) {
        TimelineEvent timelineEvent = this.timelineEventRepository.findById(timelineEventId).orElseThrow(NotFoundException::new);
        Location location = this.locationService.getRepository().findById(locationId).orElseThrow(NotFoundException::new);
        timelineEvent.getLocations().remove(location);
        return this.timelineEventRepository.save(timelineEvent);
    }

    public TimelineEvent deleteResearchReference(Long novelId, Long timelineEventId, Long researchId) {
        TimelineEvent timelineEvent = this.timelineEventRepository.findById(timelineEventId).orElseThrow(NotFoundException::new);
        Research research = this.researchService.getRepository().findById(researchId).orElseThrow(NotFoundException::new);

        timelineEvent.getResearch().remove(research);
        return this.timelineEventRepository.save(timelineEvent);
    }

    public TimelineEvent addCharacterReference(Long novelId, Long timelineEventId, Long characterId) {
        TimelineEvent timelineEvent = this.timelineEventRepository.findById(timelineEventId).orElseThrow(NotFoundException::new);
        Character character = this.characterService.getRepository().findById(characterId).orElseThrow(NotFoundException::new);
        timelineEvent.setNovel(novelService.get(novelId));
        timelineEvent.getCharacters().add(character);
        return this.timelineEventRepository.save(timelineEvent);
    }

    public TimelineEvent addLocationReference(Long novelId, Long timelineEventId, Long locationId) {
        TimelineEvent timelineEvent = this.timelineEventRepository.findById(timelineEventId).orElseThrow(NotFoundException::new);
        Location character = this.locationService.getRepository().findById(locationId).orElseThrow(NotFoundException::new);
        timelineEvent.setNovel(novelService.get(novelId));
        timelineEvent.getLocations().add(character);
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
        List<TimelineEvent> allItems = this.timelineEventRepository.findAllByNovelIdOrderByPosition(novelId);
        this.timelineEventRepository.deleteAll(allItems);
    }

    public List<TimelineEvent> getAll(Long novelId) {
        return this.timelineEventRepository.findAllByNovelIdOrderByPosition(novelId);
    }
}
