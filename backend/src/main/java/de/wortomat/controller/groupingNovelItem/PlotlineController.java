package de.wortomat.controller.groupingNovelItem;

import de.wortomat.model.Plotline;
import de.wortomat.model.PlotlineEvent;
import de.wortomat.model.PlotlineEventTag;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import de.wortomat.service.groupingNovelItem.PlotlineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/novels/{novelId}/plotlines/")
@CrossOrigin(origins = "*")
public class PlotlineController extends GroupingNovelItemController<Plotline, PlotlineEvent, PlotlineEventTag> {
    @Autowired
    private PlotlineService parentService;


    @Override
    protected GroupingNovelItemService<Plotline, PlotlineEvent, PlotlineEventTag> getService() {
        return this.parentService;
    }
}
