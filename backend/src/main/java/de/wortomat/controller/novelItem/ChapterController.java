package de.wortomat.controller.novelItem;

import de.wortomat.model.Chapter;
import de.wortomat.model.Part;
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
public class ChapterController extends NovelItemController<Chapter, Part>  {
    @Autowired
    private ChapterService chapterService;

    @Override
    protected NovelItemService<Part, Chapter> getService() {
        return chapterService;
    }

    @Override
    protected EntityType getEntityType() {
        return EntityType.CHAPTERS;
    }
}
