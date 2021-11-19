package de.wortomat.model;

public interface INovelItem {
    Long getId();
    Integer getPosition();
    void setPosition(Integer position);

    Long getParentId();
    GroupingNovelItem getParent();
    void setParent(GroupingNovelItem item);

}
