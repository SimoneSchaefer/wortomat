package de.wortomat.service.groupingNovelItem;

import de.wortomat.model.Location;
import de.wortomat.model.LocationGroup;
import de.wortomat.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class LocationGroupService extends GroupingNovelItemService<LocationGroup, Location> {

    @Autowired
    private LocationGroupRepository locationGroupRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Override
    protected GroupingItemRepository<LocationGroup, Long> getParentRepository() {
        return this.locationGroupRepository;
    }

    @Override
    protected NovelItemRepository<Location> getChildRepository() {
        return this.locationRepository;
    }
}
