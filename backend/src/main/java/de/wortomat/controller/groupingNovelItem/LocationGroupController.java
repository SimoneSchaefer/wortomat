package de.wortomat.controller.groupingNovelItem;

import de.wortomat.model.Location;
import de.wortomat.model.LocationGroup;
import de.wortomat.model.LocationTag;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import de.wortomat.service.groupingNovelItem.LocationGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/novels/{novelId}/location-groups/")
@CrossOrigin(origins = "*")
public class LocationGroupController extends GroupingNovelItemController<LocationGroup, Location, LocationTag> {
    @Autowired
    private LocationGroupService parentService;

    @Override
    protected GroupingNovelItemService<LocationGroup, Location, LocationTag> getService() {
        return this.parentService;
    }
}
