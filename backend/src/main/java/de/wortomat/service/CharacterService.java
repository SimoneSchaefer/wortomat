package de.wortomat.service;

import de.wortomat.model.*;
import de.wortomat.model.Character;
import de.wortomat.repository.CharacterRepository;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.repository.ResearchRepository;
import de.wortomat.service.uploads.EntityType;
import de.wortomat.service.uploads.ImageAwareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CharacterService extends NovelItemService<CharacterGroup, Character> implements ImageAwareService<Character> {
    @Autowired
    CharacterRepository researchRepository;

    @Autowired
    CharacterGroupService characterGroupService;

    @Override
    public EntityType getEntityType() {
        return EntityType.RESEARCH;
    }

    @Override
    public Character get(Long novelId, Long itemId) {
        return this.researchRepository.findById(itemId).get();
    }

    @Override
    public Character update(Long novelId, Character item) {
        return this.researchRepository.save(item);
    }

    @Override
    GroupingItemService<CharacterGroup, Character> getParentService() {
        return this.characterGroupService;
    }

    @Override
    NovelItemRepository<Character, Long> getRepository() {
        return this.researchRepository;
    }

    @Override
    Character getMaxPositionItem(Long parentId) {
        return this.researchRepository.findTopByCharacterGroupIdOrderByPositionDesc(parentId);
    }
}
