package de.wortomat.service.groupingNovelItem;

import de.wortomat.model.Plotline;
import de.wortomat.model.PlotlineEvent;
import de.wortomat.model.PlotlineEventTag;
import de.wortomat.repository.*;
import de.wortomat.service.novelItem.NovelItemService;
import de.wortomat.service.novelItem.PlotlineEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

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
    NovelItemTagRepository getTagRepository() {
        return this.chapterTagRepository;
    }

    protected void moveChildWithinParent(PlotlineEvent child, int newPosition) {
        int oldPosition = child.getPosition();
        if (oldPosition < newPosition) {
            // Element has been moved "lower" in the list
            // we need to update the children between oldPosition and newPosition
            // and give them position = position - 1
            List<PlotlineEvent> childrenToUpdate = child.getParent().getChildren().stream()
                    .filter(c -> c.getPosition() > oldPosition &&
                            c.getPosition() <= newPosition).collect(Collectors.toList());
            childrenToUpdate.forEach(c -> c.setPosition(c.getPosition() - 1));
            plotlineEventRepository.saveAll(childrenToUpdate);

        } else {
            // Element has been moved "up" in the list
            // we need to update all the children after newPosition
            // and give them position = position + 1
            List<PlotlineEvent> childrenToUpdate = child.getParent().getChildren().stream()
                    .filter(c -> c.getPosition() <= oldPosition &&
                            c.getPosition() >= newPosition &&
                            !c.getId().equals(child.getId()))
                    .collect(Collectors.toList());
            childrenToUpdate.forEach(c -> c.setPosition(c.getPosition() + 1));
            plotlineEventRepository.saveAll(childrenToUpdate);
        }


        child.setPosition(newPosition);
        plotlineEventRepository.save(child);
        plotlineRepository.save(child.getParent());
    }
}
