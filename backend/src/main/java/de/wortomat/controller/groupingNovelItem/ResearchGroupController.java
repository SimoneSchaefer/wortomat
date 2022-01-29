package de.wortomat.controller.groupingNovelItem;

import de.wortomat.model.Research;
import de.wortomat.model.ResearchGroup;
import de.wortomat.model.ResearchTag;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import de.wortomat.service.groupingNovelItem.ResearchGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/novels/{novelId}/research-groups/")
@CrossOrigin(origins = "*")
public class ResearchGroupController extends GroupingNovelItemController<ResearchGroup, Research, ResearchTag> {
    @Autowired
    private ResearchGroupService parentService;

    @Override
    protected GroupingNovelItemService<ResearchGroup, Research, ResearchTag> getService() {
        return this.parentService;
    }
}
