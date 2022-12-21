package de.wortomat.controller.groupingNovelItem;

import de.wortomat.model.Chapter;
import de.wortomat.model.ChapterTag;
import de.wortomat.model.Part;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import de.wortomat.service.groupingNovelItem.PartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/novels/{novelId}/parts/")
@CrossOrigin(origins = "*")
public class PlotlineController extends GroupingNovelItemController<Part, Chapter, ChapterTag> {
    @Autowired
    private PartService parentService;


    @Override
    protected GroupingNovelItemService<Part, Chapter, ChapterTag> getService() {
        return this.parentService;
    }
}
