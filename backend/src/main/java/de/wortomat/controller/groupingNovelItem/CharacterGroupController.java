package de.wortomat.controller.groupingNovelItem;

import de.wortomat.model.Character;
import de.wortomat.model.CharacterGroup;
import de.wortomat.model.CharacterTag;
import de.wortomat.service.groupingNovelItem.CharacterGroupService;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/novels/{novelId}/character-groups/")
@CrossOrigin(origins = "*")
public class CharacterGroupController extends GroupingNovelItemController<CharacterGroup, Character, CharacterTag> {

    @Autowired
    private CharacterGroupService parentService;

    @Override
    protected GroupingNovelItemService<CharacterGroup, Character, CharacterTag> getService() {
        return this.parentService;
    }
}
