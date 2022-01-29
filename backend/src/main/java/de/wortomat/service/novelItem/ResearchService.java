package de.wortomat.service.novelItem;

import de.wortomat.model.Research;
import de.wortomat.model.ResearchGroup;
import de.wortomat.model.ResearchTag;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.repository.ResearchRepository;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import de.wortomat.service.groupingNovelItem.ResearchGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ResearchService extends NovelItemService<ResearchGroup, Research, ResearchTag> {
    @Autowired
    ResearchRepository researchRepository;

    @Autowired
    ResearchGroupService researchGroupService;

    @Override
    GroupingNovelItemService<ResearchGroup, Research, ResearchTag> getParentService() {
        return this.researchGroupService;
    }

    @Override
    NovelItemRepository<Research> getRepository() {
        return this.researchRepository;
    }
}
