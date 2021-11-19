package de.wortomat.service;

import de.wortomat.model.Character;
import de.wortomat.model.CharacterGroup;
import de.wortomat.repository.CharacterGroupRepository;
import de.wortomat.repository.CharacterRepository;
import de.wortomat.repository.GroupingItemRepository;
import de.wortomat.repository.NovelItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CharacterGroupService extends GroupingNovelItemService<CharacterGroup, Character>{

    @Autowired
    private CharacterGroupRepository partsRepository;

    @Autowired
    private CharacterRepository chapterRepository;

    @Override
    protected GroupingItemRepository<CharacterGroup, Long> getParentRepository() {
        return this.partsRepository;
    }

    @Override
    protected NovelItemRepository<Character> getChildRepository() {
        return this.chapterRepository;
    }
}
