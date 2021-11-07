package de.wortomat.service;

import de.wortomat.model.*;
import de.wortomat.repository.ChapterRepository;
import de.wortomat.repository.NovelItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ChapterService extends NovelItemService<Part, Chapter>  {
    @Autowired
    ChapterRepository chapterRepository;

    @Autowired
    PartService partService;

    @Override
    GroupingItemService<Part, Chapter> getParentService() {
        return this.partService;
    }

    @Override
    NovelItemRepository<Chapter, Long> getRepository() {
        return this.chapterRepository;
    }

    @Override
    Chapter getMaxPositionItem(Long parentId) {
        return this.chapterRepository.findTopByPartIdOrderByPositionDesc(parentId);
    }
}
