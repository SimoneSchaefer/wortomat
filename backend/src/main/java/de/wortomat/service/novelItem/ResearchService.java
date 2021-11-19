package de.wortomat.service.novelItem;

import de.wortomat.exceptions.NotFoundException;
import de.wortomat.model.Research;
import de.wortomat.model.ResearchGroup;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.repository.ResearchRepository;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import de.wortomat.service.groupingNovelItem.ResearchGroupService;
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
        return this.researchRepository.findById(itemId).orElseThrow(NotFoundException::new);
    }

    @Override
    public Research update(Long novelId, Research item) {
        return this.researchRepository.save(item);
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
