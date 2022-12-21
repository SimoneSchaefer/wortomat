package de.wortomat.service.groupingNovelItem;

import de.wortomat.model.Chapter;
import de.wortomat.model.ChapterTag;
import de.wortomat.model.Part;
import de.wortomat.repository.*;
import de.wortomat.service.novelItem.ChapterService;
import de.wortomat.service.novelItem.NovelItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PlotlineService extends GroupingNovelItemService<Part, Chapter, ChapterTag> {

    @Autowired
    private PartsRepository partsRepository;

    @Autowired
    private ChapterService chapterService;

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
    protected NovelItemService<Part, Chapter, ChapterTag> getChildService() {
        return this.chapterService;
    }

    @Override
    NovelItemTagRepository getTagRepository() { return this.chapterTagRepository; }
}
