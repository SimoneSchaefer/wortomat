package de.wortomat.service.novelItem;

import de.wortomat.model.*;
import de.wortomat.repository.ChapterRepository;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import de.wortomat.service.groupingNovelItem.PartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ChapterService extends NovelItemService<Part, Chapter>  {
    @Autowired
    ChapterRepository chapterRepository;

    @Autowired
    PartService partService;

    @Override
    GroupingNovelItemService<Part, Chapter> getParentService() {
        return this.partService;
    }

    @Override
    NovelItemRepository<Chapter> getRepository() {
        return this.chapterRepository;
    }
}
