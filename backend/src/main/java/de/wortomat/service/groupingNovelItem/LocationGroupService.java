package de.wortomat.service.groupingNovelItem;

import de.wortomat.model.Location;
import de.wortomat.model.LocationGroup;
import de.wortomat.model.LocationTag;
import de.wortomat.repository.*;
import de.wortomat.service.novelItem.LocationService;
import de.wortomat.service.novelItem.NovelItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class LocationGroupService extends GroupingNovelItemService<LocationGroup, Location, LocationTag> {

    @Autowired
    private LocationGroupRepository locationGroupRepository;

    @Autowired
    private LocationRepository locationRepository;
    @Autowired
    private LocationService locationService;

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
    protected NovelItemService<LocationGroup, Location, LocationTag> getChildService() {
        return this.locationService;
    }

    @Override
    NovelItemTagRepository getTagRepository() { return this.locationTagRepository; }
}
