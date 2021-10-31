package de.wortomat.model;


public interface PositionAwareNovelItem extends PositionAware {
    void setParent(GroupingNovelItem parent);
    // List<? extends NovelItemTag> getTags();
}
