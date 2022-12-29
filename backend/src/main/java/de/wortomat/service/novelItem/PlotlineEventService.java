package de.wortomat.service.novelItem;

import de.wortomat.model.*;
import de.wortomat.repository.*;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import de.wortomat.service.groupingNovelItem.PlotlineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PlotlineEventService extends NovelItemService<Plotline, PlotlineEvent, PlotlineEventTag>  {
    @Autowired
    PlotlineEventRepository plotlineEventRepository;

    @Autowired
    PlotlineEventTagRepository plotlineEventTagRepository;

    @Autowired
    PlotlineService plotlineService;

    @Override
    GroupingNovelItemService<Plotline, PlotlineEvent, PlotlineEventTag> getParentService() {
        return this.plotlineService;
    }

    @Override
    NovelItemRepository<PlotlineEvent> getRepository() {
        return this.plotlineEventRepository;
    }

    @Override
    NovelItemTagRepository<PlotlineEventTag> getTagRepository() {  return this.plotlineEventTagRepository; }
}
