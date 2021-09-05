package de.wortomat.service;

import de.wortomat.model.Research;
import de.wortomat.repository.PositionAwareRepository;
import de.wortomat.repository.ResearchRepository;
import de.wortomat.service.uploads.EntityType;
import de.wortomat.service.uploads.ImageAwareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ResearchService extends PositionAwareService<Research> implements ImageAwareService<Research> {
    @Autowired
    ResearchRepository researchRepository;

    @Autowired
    NovelService novelService;

    @Override
    public PositionAwareRepository<Research,Long> getRepository() {
        return this.researchRepository;
    }

    public Research update(Long novelId, Research item) {
        item.setNovel(novelService.get(novelId));
        return this.researchRepository.save(item);
    }

    @Override
    public EntityType getEntityType() {
        return EntityType.CHARACTER;
    }
}
