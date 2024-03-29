package de.wortomat.service;


import de.wortomat.exceptions.NotFoundException;
import de.wortomat.model.*;
import de.wortomat.repository.NovelRepository;
import de.wortomat.service.groupingNovelItem.CharacterGroupService;
import de.wortomat.service.groupingNovelItem.LocationGroupService;
import de.wortomat.service.groupingNovelItem.PartService;
import de.wortomat.service.groupingNovelItem.ResearchGroupService;
import de.wortomat.service.novelItem.TimelineEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;
import java.util.List;


@Service
public class NovelService {
    @Autowired
    NovelRepository novelRepository;

    @Autowired
    PartService partService;

    @Autowired
    LocationGroupService locationGroupService;

    @Autowired
    CharacterGroupService characterGroupService;

    @Autowired
    ResearchGroupService researchGroupService;

    @Autowired
    TimelineEventService timelineEventService;

    public List<Novel> list() {
        return this.novelRepository.findByOrderByPositionAsc();
    }

    public Novel get(Long novelId) {
        return this.novelRepository.findById(novelId).orElseThrow(NotFoundException::new);
    }

   // @Transactional
    public Novel create(Novel novel) {
        List<Novel> novels = this.novelRepository.findByOrderByPositionAsc();
        int position = 0;
        if (novels.size() > 0) {
            position = novels.get(novels.size() - 1).getPosition();
        }
        novel.setPosition(position);
        novel.setParts(Collections.emptyList());
        novel.setCharacters(Collections.emptyList());
        novel.setLocations(Collections.emptyList());
        novel.setResearchGroups(Collections.emptyList());
        novel = this.novelRepository.save(novel);

        return this.get(novel.getId());
    }

    @Transactional
    public Novel update(Novel novel) {
        return this.novelRepository.save(novel);
    }

    @Transactional
    public void delete(Long novelId) {
        this.timelineEventService.deleteAll(novelId);
        this.locationGroupService.deleteAll(novelId);
        this.researchGroupService.deleteAll(novelId);
        this.partService.deleteAll(novelId);
        this.characterGroupService.deleteAll(novelId);
        this.novelRepository.deleteById(novelId);
    }
}
