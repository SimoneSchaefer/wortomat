package de.wortomat.service.groupingNovelItem;

import de.wortomat.model.Research;
import de.wortomat.model.ResearchGroup;
import de.wortomat.model.ResearchTag;
import de.wortomat.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ResearchGroupService extends GroupingNovelItemService<ResearchGroup, Research, ResearchTag> {

    @Autowired
    private ResearchGroupRepository researchGroupRepository;

    @Autowired
    private ResearchRepository researchRepository;

    @Autowired
    private ResearchTagRepository researchTagRepository;

    @Override
    protected GroupingItemRepository<ResearchGroup, Long> getParentRepository() {
        return this.researchGroupRepository;
    }

    @Override
    protected NovelItemRepository<Research> getChildRepository() {
        return this.researchRepository;
    }

    @Override
    NovelItemTagRepository getTagRepository() { return this.researchTagRepository; }
}
