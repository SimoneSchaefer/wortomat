package de.wortomat.service.groupingNovelItem;

import de.wortomat.model.Character;
import de.wortomat.model.CharacterGroup;
import de.wortomat.model.CharacterTag;
import de.wortomat.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CharacterGroupService extends GroupingNovelItemService<CharacterGroup, Character, CharacterTag> {

    @Autowired
    private CharacterGroupRepository partsRepository;

    @Autowired
    private CharacterRepository chapterRepository;

    @Autowired
    private CharacterTagRepository characterTagRepository;

    @Override
    protected GroupingItemRepository<CharacterGroup, Long> getParentRepository() {
        return this.partsRepository;
    }

    @Override
    protected NovelItemRepository<Character> getChildRepository() {
        return this.chapterRepository;
    }

    @Override
    NovelItemTagRepository getTagRepository() { return this.characterTagRepository; }
}
