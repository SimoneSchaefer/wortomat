package de.wortomat.service;


import de.wortomat.exceptions.NotFoundException;
import de.wortomat.model.Novel;
import de.wortomat.model.ResearchGroup;
import de.wortomat.repository.NovelRepository;
import de.wortomat.repository.PartsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public Novel create(Novel novel) {
        return this.novelRepository.save(novel);
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
