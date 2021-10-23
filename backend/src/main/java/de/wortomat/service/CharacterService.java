package de.wortomat.service;

import de.wortomat.model.Character;
import de.wortomat.model.CharacterTag;
import de.wortomat.repository.CharacterRepository;
import de.wortomat.repository.PositionAwareRepository;
import de.wortomat.repository.tags.CharacterTagRepository;
import de.wortomat.service.uploads.EntityType;
import de.wortomat.service.uploads.ImageAwareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CharacterService extends PositionAwareService<Character> implements ImageAwareService<Character> {
    @Autowired
    CharacterRepository characterRepository;

    @Autowired
    CharacterTagRepository characterTagRepository;

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

    public List<CharacterTag> getTags(Long novelId) {
        return this.characterTagRepository.findAllByNovelIdOrderByNameAsc(novelId);
    }

    public CharacterTag createTag(Long novelId, CharacterTag tag) {
        tag.setNovel(novelService.get(novelId));
        return this.characterTagRepository.save(tag);
    }

    @Override
    public EntityType getEntityType() {
        return EntityType.CHARACTER;
    }
}
