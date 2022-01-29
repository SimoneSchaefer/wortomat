package de.wortomat.controller.novelItem;

import de.wortomat.model.Location;
import de.wortomat.model.LocationGroup;
import de.wortomat.model.LocationTag;
import de.wortomat.service.novelItem.LocationService;
import de.wortomat.service.novelItem.NovelItemService;
import de.wortomat.service.uploads.EntityType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/novels/{novelId}/location-groups/{groupId}/location/")
@CrossOrigin(origins = "*")
public class LocationController extends NovelItemController<Location, LocationGroup, LocationTag> {
    @Autowired
    private LocationService locationService;

    @Override
    protected NovelItemService<LocationGroup, Location, LocationTag> getService() {
        return locationService;
    }

    @Override
    protected EntityType getEntityType() {
        return EntityType.LOCATIONS;
    }
}
