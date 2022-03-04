package de.wortomat.controller.novelItem;

import de.wortomat.model.Character;
import de.wortomat.model.CharacterGroup;
import de.wortomat.model.CharacterTag;
import de.wortomat.service.groupingNovelItem.CharacterGroupService;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import de.wortomat.service.novelItem.CharacterService;
import de.wortomat.service.novelItem.NovelItemService;
import de.wortomat.service.uploads.EntityType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/novels/{novelId}/character-groups/{groupId}/characters/")
@CrossOrigin(origins = "*")
public class CharacterController extends NovelItemController<Character, CharacterGroup, CharacterTag> {
    @Autowired
    private CharacterService characterService;

    @Autowired
    private CharacterGroupService characterGroupService;

    @Override
    protected NovelItemService<CharacterGroup, Character, CharacterTag> getService() {
        return characterService;
    }

    @Override
    protected GroupingNovelItemService<CharacterGroup, Character, CharacterTag> getParentService() {
        return null;
    }

    @Override
    protected EntityType getEntityType() {
        return EntityType.CHARACTERS;
    }
}
