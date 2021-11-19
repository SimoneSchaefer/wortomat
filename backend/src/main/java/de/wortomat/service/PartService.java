package de.wortomat.service;

import de.wortomat.model.Chapter;
import de.wortomat.model.Part;
import de.wortomat.repository.ChapterRepository;
import de.wortomat.repository.GroupingItemRepository;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.repository.PartsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PartService extends GroupingNovelItemService<Part, Chapter> {

    @Autowired
    private PartsRepository partsRepository;

    @Autowired
    private ChapterRepository chapterRepository;

    @Override
    protected GroupingItemRepository<Part, Long> getParentRepository() {
        return this.partsRepository;
    }

    @Override
    protected NovelItemRepository<Chapter> getChildRepository() {
        return this.chapterRepository;
    }
}
