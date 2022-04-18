package de.wortomat.model;

import java.util.List;

public interface IGroupingNovelItem<T extends INovelItem<?>> extends PositionAwareNovelItem {
    Long getId();

    List<T> getChildren();

    void setChildren(List<T> children);

    void setNovel(Novel novel);
}
