package de.wortomat.model;

import java.util.Date;
import java.util.List;

public interface INovelItem<T extends IGroupingNovelItem> {
    Long getId();
    Integer getPosition();
    void setPosition(Integer position);

    Long getParentId();
    T getParent();
    void setParent(T item);

    Date getDeletedAt();
    void setDeletedAt(Date date);

    <E> List<E> getImages();
}
