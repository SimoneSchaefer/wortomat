package de.wortomat.service;

import de.wortomat.model.Research;
import de.wortomat.model.ResearchGroup;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.repository.ResearchRepository;
import de.wortomat.service.uploads.EntityType;
import de.wortomat.service.uploads.ImageAwareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ResearchService extends NovelItemService<ResearchGroup, Research>  implements ImageAwareService<Research> {
    @Autowired
    ResearchRepository researchRepository;

    @Autowired
    ResearchGroupService researchGroupService;

    @Override
    public EntityType getEntityType() {
        return EntityType.RESEARCH;
    }

    @Override
    public Research get(Long novelId, Long itemId) {
        return this.researchRepository.findById(itemId).get();
    }

    @Override
    public Research update(Long novelId, Research item) {
        return this.researchRepository.save(item);
    }

    @Override
    GroupingItemService<ResearchGroup, Research> getParentService() {
        return this.researchGroupService;
    }

    @Override
    NovelItemRepository<Research, Long> getRepository() {
        return this.researchRepository;
    }

    @Override
    Research getMaxPositionItem(Long parentId) {
        return this.researchRepository.findTopByResearchGroupIdOrderByPositionDesc(parentId);
    }
}
