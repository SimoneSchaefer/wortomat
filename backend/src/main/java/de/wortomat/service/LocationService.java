package de.wortomat.service;

import de.wortomat.model.Location;
import de.wortomat.repository.LocationRepository;
import de.wortomat.repository.PositionAwareRepository;
import de.wortomat.service.uploads.EntityType;
import de.wortomat.service.uploads.ImageAwareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class LocationService extends PositionAwareService<Location> implements ImageAwareService<Location> {
    @Autowired
    LocationRepository locationRepository;

    @Autowired
    NovelService novelService;

    @Override
    public PositionAwareRepository<Location,Long> getRepository() {
        return this.locationRepository;
    }

    public Location update(Long novelId, Location item) {
        item.setNovel(novelService.get(novelId));
        return this.locationRepository.save(item);
    }

    @Override
    public EntityType getEntityType() {
        return EntityType.LOCATION;
    }
}
