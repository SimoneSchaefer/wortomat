package de.wortomat.service.groupingNovelItem;

import de.wortomat.model.*;
import de.wortomat.repository.*;
import de.wortomat.service.novelItem.NovelItemService;
import de.wortomat.service.novelItem.PlotlineEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PlotlineService extends GroupingNovelItemService<Plotline, PlotlineEvent, PlotlineEventTag> {

    @Autowired
    private PlotlineRepository plotlineRepository;

    @Autowired
    private PlotlineEventRepository plotlineEventRepository;

    @Autowired
    private PlotlineEventService plotlineEventService;

    @Autowired
    private ChapterTagRepository chapterTagRepository;

    @Override
    protected GroupingItemRepository<Plotline, Long> getParentRepository() {
        return this.plotlineRepository;
    }

    @Override
    protected NovelItemRepository<PlotlineEvent> getChildRepository() {
        return this.plotlineEventRepository;
    }

    @Override
    protected NovelItemService<Plotline, PlotlineEvent, PlotlineEventTag> getChildService() {
        return this.plotlineEventService;
    }

    @Override
    NovelItemTagRepository getTagRepository() { return this.chapterTagRepository; }
}
