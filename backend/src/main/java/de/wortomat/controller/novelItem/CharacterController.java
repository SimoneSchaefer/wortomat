package de.wortomat.controller.novelItem;

import de.wortomat.model.Character;
import de.wortomat.model.CharacterGroup;
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
public class CharacterController extends NovelItemController<Character, CharacterGroup> {
    @Autowired
    private CharacterService characterService;

    @Override
    protected NovelItemService<CharacterGroup, Character> getService() {
        return characterService;
    }

    @Override
    protected EntityType getEntityType() {
        return EntityType.CHARACTERS;
    }
}
