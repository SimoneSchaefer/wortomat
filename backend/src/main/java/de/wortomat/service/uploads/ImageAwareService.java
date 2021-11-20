package de.wortomat.service.uploads;

import de.wortomat.model.IGroupingNovelItem;
import de.wortomat.model.INovelItem;

public interface ImageAwareService<S extends INovelItem<T>, T extends IGroupingNovelItem<S>> {

    EntityType getEntityType();
    T get(Long novelId, Long itemId);
    T update(Long novelId, T item);

}

