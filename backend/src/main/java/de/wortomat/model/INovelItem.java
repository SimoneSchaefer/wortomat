package de.wortomat.model;

public interface INovelItem<T extends IGroupingNovelItem> {
    Long getId();
    Integer getPosition();
    void setPosition(Integer position);

    Long getParentId();
    T getParent();
    void setParent(T item);

}
