package de.wortomat.model;

public interface INovelItem {
    Long getId();
    Integer getPosition();
    void setPosition(Integer position);

    Long getParentId();
    IGroupingNovelItem getParent();
    void setParent(IGroupingNovelItem item);

}
