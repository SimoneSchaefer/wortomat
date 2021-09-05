package de.wortomat.service;

import de.wortomat.model.ChapterTag;
import de.wortomat.model.CharacterTag;
import de.wortomat.model.Location;
import de.wortomat.model.LocationTag;
import de.wortomat.repository.LocationRepository;
import de.wortomat.repository.PositionAwareRepository;
import de.wortomat.repository.tags.LocationTagRepository;
import de.wortomat.service.uploads.EntityType;
import de.wortomat.service.uploads.ImageAwareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LocationService extends PositionAwareService<Location> implements ImageAwareService<Location> {
    @Autowired
    LocationRepository locationRepository;

    @Autowired
    NovelService novelService;

    @Autowired
    LocationTagRepository locationTagRepository;

    @Override
    public PositionAwareRepository<Location,Long> getRepository() {
        return this.locationRepository;
    }

    public Location update(Long novelId, Location item) {
        item.setNovel(novelService.get(novelId));
        return this.locationRepository.save(item);
    }

    public LocationTag createTag(Long novelId, LocationTag tag) {
        tag.setNovel(novelService.get(novelId));
        return this.locationTagRepository.save(tag);
    }

    public List<LocationTag> getTags(Long novelId) {
        return this.locationTagRepository.findAllByNovelId(novelId);
    }

    @Override
    public EntityType getEntityType() {
        return EntityType.LOCATION;
    }
}
