package de.wortomat.service.novelItem;

import de.wortomat.model.Location;
import de.wortomat.model.LocationGroup;
import de.wortomat.repository.LocationRepository;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import de.wortomat.service.groupingNovelItem.LocationGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class LocationService extends NovelItemService<LocationGroup, Location> {
    @Autowired
    LocationRepository locationRepository;

    @Autowired
    LocationGroupService locationGroupService;

    @Override
    GroupingNovelItemService<LocationGroup, Location> getParentService() {
        return this.locationGroupService;
    }

    @Override
    NovelItemRepository<Location> getRepository() {
        return this.locationRepository;
    }
}
