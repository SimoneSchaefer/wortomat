package de.wortomat.service.novelItem;

import de.wortomat.model.Chapter;
import de.wortomat.model.ChapterTag;
import de.wortomat.model.Part;
import de.wortomat.repository.ChapterRepository;
import de.wortomat.repository.ChapterTagRepository;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.repository.NovelItemTagRepository;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import de.wortomat.service.groupingNovelItem.PartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ChapterService extends NovelItemService<Part, Chapter, ChapterTag>  {
    @Autowired
    ChapterRepository chapterRepository;

    @Autowired
    ChapterTagRepository chapterTagRepository;

    @Autowired
    PartService partService;

    @Override
    GroupingNovelItemService<Part, Chapter, ChapterTag> getParentService() {
        return this.partService;
    }

    @Override
    NovelItemRepository<Chapter> getRepository() {
        return this.chapterRepository;
    }

    @Override
    NovelItemTagRepository<ChapterTag> getTagRepository() {  return this.chapterTagRepository; }
}
