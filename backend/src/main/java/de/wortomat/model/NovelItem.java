package de.wortomat.model;

public interface NovelItem {
    Long getId();
    int getPosition();
    void setPosition(int position);

    GroupingNovelItem getParent();
    void setParent(GroupingNovelItem item);

}
