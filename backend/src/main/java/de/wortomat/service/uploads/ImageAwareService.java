package de.wortomat.service.uploads;

import de.wortomat.model.ImageAware;
import de.wortomat.service.uploads.EntityType;

public interface ImageAwareService<T extends ImageAware> {

    EntityType getEntityType();
    T get(Long novelId, Long itemId);
    T update(Long novelId, T item);

}

