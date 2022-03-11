package de.wortomat.service.groupingNovelItem;

import de.wortomat.model.Character;
import de.wortomat.model.CharacterGroup;
import de.wortomat.model.CharacterTag;
import de.wortomat.repository.*;
import de.wortomat.service.novelItem.CharacterService;
import de.wortomat.service.novelItem.NovelItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CharacterGroupService extends GroupingNovelItemService<CharacterGroup, Character, CharacterTag> {

    @Autowired
    private CharacterGroupRepository partsRepository;

    @Autowired
    private CharacterRepository characterRepository;

    @Autowired
    private CharacterService characterService;

    @Autowired
    private CharacterTagRepository characterTagRepository;

    @Override
    protected GroupingItemRepository<CharacterGroup, Long> getParentRepository() {
        return this.partsRepository;
    }

    @Override
    protected NovelItemRepository<Character> getChildRepository() {
        return this.characterRepository;
    }

    @Override
    protected NovelItemService<CharacterGroup, Character, CharacterTag> getChildService() {
        return this.characterService;
    }

    @Override
    NovelItemTagRepository getTagRepository() { return this.characterTagRepository; }
}
