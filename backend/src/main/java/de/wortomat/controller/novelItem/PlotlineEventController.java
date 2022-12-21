package de.wortomat.controller.novelItem;

import de.wortomat.model.Plotline;
import de.wortomat.model.PlotlineEvent;
import de.wortomat.model.PlotlineEventTag;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import de.wortomat.service.groupingNovelItem.PlotlineService;
import de.wortomat.service.novelItem.NovelItemService;
import de.wortomat.service.novelItem.PlotlineEventService;
import de.wortomat.service.uploads.EntityType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/novels/{novelId}/plotlines/{groupId}/plotline_events/")
@CrossOrigin(origins = "*")
public class PlotlineEventController extends NovelItemController<PlotlineEvent, Plotline, PlotlineEventTag>  {
    @Autowired
    private PlotlineEventService chapterService;
    @Autowired
    private PlotlineService partService;

    @Override
    protected NovelItemService<Plotline, PlotlineEvent, PlotlineEventTag> getService() {
        return chapterService;
    }

    @Override
    protected GroupingNovelItemService<Plotline, PlotlineEvent, PlotlineEventTag> getParentService() {
        return this.partService;
    }

    @Override
    protected EntityType getEntityType() {
        return EntityType.PLOTLINES;
    }
}
