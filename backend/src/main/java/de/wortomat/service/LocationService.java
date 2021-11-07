package de.wortomat.service;

import de.wortomat.exceptions.NotFoundException;
import de.wortomat.model.Location;
import de.wortomat.model.LocationGroup;
import de.wortomat.repository.LocationRepository;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.service.uploads.EntityType;
import de.wortomat.service.uploads.ImageAwareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class LocationService extends NovelItemService<LocationGroup, Location>  implements ImageAwareService<Location> {
    @Autowired
    LocationRepository locationRepository;

    @Autowired
    LocationGroupService locationGroupService;

    @Override
    public EntityType getEntityType() {
        return EntityType.RESEARCH;
    }

    @Override
    public Location get(Long novelId, Long itemId) {
        return this.locationRepository.findById(itemId).orElseThrow(NotFoundException::new);
    }

    @Override
    public Location update(Long novelId, Location item) {
        return this.locationRepository.save(item);
    }

    @Override
    GroupingItemService<LocationGroup, Location> getParentService() {
        return this.locationGroupService;
    }

    @Override
    NovelItemRepository<Location, Long> getRepository() {
        return this.locationRepository;
    }

    @Override
    Location getMaxPositionItem(Long parentId) {
        return this.locationRepository.findTopByLocationGroupIdOrderByPositionDesc(parentId);
    }
}
