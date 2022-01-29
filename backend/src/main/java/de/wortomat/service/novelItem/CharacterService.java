package de.wortomat.service.novelItem;

import de.wortomat.model.Character;
import de.wortomat.model.CharacterGroup;
import de.wortomat.model.CharacterTag;
import de.wortomat.repository.CharacterRepository;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.service.groupingNovelItem.CharacterGroupService;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CharacterService extends NovelItemService<CharacterGroup, Character, CharacterTag> {
    @Autowired
    CharacterRepository researchRepository;

    @Autowired
    CharacterGroupService characterGroupService;

    @Override
    GroupingNovelItemService<CharacterGroup, Character, CharacterTag> getParentService() {
        return this.characterGroupService;
    }

    @Override
    NovelItemRepository<Character> getRepository() {
        return this.researchRepository;
    }
}
