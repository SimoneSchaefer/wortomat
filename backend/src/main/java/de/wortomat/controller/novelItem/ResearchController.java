package de.wortomat.controller.novelItem;

import de.wortomat.model.Research;
import de.wortomat.model.ResearchGroup;
import de.wortomat.service.novelItem.NovelItemService;
import de.wortomat.service.novelItem.ResearchService;
import de.wortomat.service.uploads.EntityType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/novels/{novelId}/research-groups/{groupId}/research")
@CrossOrigin(origins = "*")
public class ResearchController extends NovelItemController<Research, ResearchGroup>  {
    @Autowired
    private ResearchService researchService;

    @Override
    protected NovelItemService<ResearchGroup, Research> getService() {
        return researchService;
    }

    @Override
    protected EntityType getEntityType() {
        return EntityType.RESEARCH;
    }
}
