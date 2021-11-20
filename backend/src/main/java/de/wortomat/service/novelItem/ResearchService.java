package de.wortomat.service.novelItem;

import de.wortomat.model.Research;
import de.wortomat.model.ResearchGroup;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.repository.ResearchRepository;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import de.wortomat.service.groupingNovelItem.ResearchGroupService;
import de.wortomat.service.uploads.EntityType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ResearchService extends NovelItemService<ResearchGroup, Research> {
    @Autowired
    ResearchRepository researchRepository;

    @Autowired
    ResearchGroupService researchGroupService;

    @Override
    public EntityType getEntityType() {
        return EntityType.RESEARCH;
    }

    @Override
    GroupingNovelItemService<ResearchGroup, Research> getParentService() {
        return this.researchGroupService;
    }

    @Override
    NovelItemRepository<Research> getRepository() {
        return this.researchRepository;
    }
}
