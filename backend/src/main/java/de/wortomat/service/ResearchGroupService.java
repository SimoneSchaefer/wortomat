package de.wortomat.service;

import de.wortomat.model.Research;
import de.wortomat.model.ResearchGroup;
import de.wortomat.repository.GroupingItemRepository;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.repository.ResearchGroupRepository;
import de.wortomat.repository.ResearchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ResearchGroupService extends GroupingItemService<ResearchGroup, Research>{

    @Autowired
    private ResearchGroupRepository researchGroupRepository;

    @Autowired
    private ResearchRepository researchRepository;

    @Override
    protected GroupingItemRepository<ResearchGroup, Long> getParentRepository() {
        return this.researchGroupRepository;
    }

    @Override
    protected NovelItemRepository<Research, Long> getChildRepository() {
        return this.researchRepository;
    }
}
