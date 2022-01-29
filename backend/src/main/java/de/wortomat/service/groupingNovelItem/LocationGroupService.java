package de.wortomat.service.groupingNovelItem;

import de.wortomat.model.Location;
import de.wortomat.model.LocationGroup;
import de.wortomat.model.LocationTag;
import de.wortomat.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class LocationGroupService extends GroupingNovelItemService<LocationGroup, Location, LocationTag> {

    @Autowired
    private LocationGroupRepository locationGroupRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private LocationTagRepository locationTagRepository;

    @Override
    protected GroupingItemRepository<LocationGroup, Long> getParentRepository() {
        return this.locationGroupRepository;
    }

    @Override
    protected NovelItemRepository<Location> getChildRepository() {
        return this.locationRepository;
    }

    @Override
    NovelItemTagRepository getTagRepository() { return this.locationTagRepository; }
}
