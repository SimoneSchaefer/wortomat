package de.wortomat.controller.novelItem;

import de.wortomat.model.Chapter;
import de.wortomat.model.ChapterTag;
import de.wortomat.model.Part;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import de.wortomat.service.groupingNovelItem.PartService;
import de.wortomat.service.novelItem.ChapterService;
import de.wortomat.service.novelItem.NovelItemService;
import de.wortomat.service.uploads.EntityType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/novels/{novelId}/parts/{groupId}/chapters/")
@CrossOrigin(origins = "*")
public class ChapterController extends NovelItemController<Chapter, Part, ChapterTag>  {
    @Autowired
    private ChapterService chapterService;
    @Autowired
    private PartService partService;

    @Override
    protected NovelItemService<Part, Chapter, ChapterTag> getService() {
        return chapterService;
    }

    @Override
    protected GroupingNovelItemService<Part, Chapter, ChapterTag> getParentService() {
        return this.partService;
    }

    @Override
    protected EntityType getEntityType() {
        return EntityType.CHAPTERS;
    }
}
