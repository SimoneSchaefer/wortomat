package de.wortomat.service;

import de.wortomat.model.Character;
import de.wortomat.repository.CharacterRepository;
import de.wortomat.repository.PositionAwareRepository;
import de.wortomat.service.uploads.EntityType;
import de.wortomat.service.uploads.ImageAwareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CharacterService extends PositionAwareService<Character> implements ImageAwareService<Character> {
    @Autowired
    CharacterRepository characterRepository;

    @Autowired
    NovelService novelService;

    @Override
    public PositionAwareRepository<Character,Long> getRepository() {
        return this.characterRepository;
    }

    public Character update(Long novelId, Character item) {
        item.setNovel(novelService.get(novelId));
        return this.characterRepository.save(item);
    }

    @Override
    public EntityType getEntityType() {
        return EntityType.CHARACTER;
    }
}
