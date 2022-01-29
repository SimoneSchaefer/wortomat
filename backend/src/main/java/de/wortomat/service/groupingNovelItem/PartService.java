package de.wortomat.service.groupingNovelItem;

import de.wortomat.model.Chapter;
import de.wortomat.model.ChapterTag;
import de.wortomat.model.Part;
import de.wortomat.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PartService extends GroupingNovelItemService<Part, Chapter, ChapterTag> {

    @Autowired
    private PartsRepository partsRepository;

    @Autowired
    private ChapterRepository chapterRepository;

    @Autowired
    private ChapterTagRepository chapterTagRepository;

    @Override
    protected GroupingItemRepository<Part, Long> getParentRepository() {
        return this.partsRepository;
    }

    @Override
    protected NovelItemRepository<Chapter> getChildRepository() {
        return this.chapterRepository;
    }

    @Override
    NovelItemTagRepository getTagRepository() { return this.chapterTagRepository; }
}
