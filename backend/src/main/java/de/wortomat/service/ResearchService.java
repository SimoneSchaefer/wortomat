package de.wortomat.service;

import de.wortomat.model.LocationTag;
import de.wortomat.model.Research;
import de.wortomat.model.ResearchTag;
import de.wortomat.repository.PositionAwareRepository;
import de.wortomat.repository.ResearchRepository;
import de.wortomat.repository.tags.ResearchTagRepository;
import de.wortomat.service.uploads.EntityType;
import de.wortomat.service.uploads.ImageAwareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ResearchService extends PositionAwareService<Research> implements ImageAwareService<Research> {
    @Autowired
    ResearchRepository researchRepository;

    @Autowired
    NovelService novelService;

    @Autowired
    ResearchTagRepository researchTagRepository;

    @Override
    public PositionAwareRepository<Research,Long> getRepository() {
        return this.researchRepository;
    }

    public Research update(Long novelId, Research item) {
        item.setNovel(novelService.get(novelId));
        return this.researchRepository.save(item);
    }

    public ResearchTag createTag(Long novelId, ResearchTag tag) {
        tag.setNovel(novelService.get(novelId));
        return this.researchTagRepository.save(tag);
    }

    public List<ResearchTag> getTags(Long novelId) {
        return this.researchTagRepository.findAllByNovelId(novelId);
    }

    @Override
    public EntityType getEntityType() {
        return EntityType.CHARACTER;
    }
}
