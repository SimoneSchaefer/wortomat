package de.wortomat.model;

import java.util.List;

public interface IGroupingNovelItem extends PositionAwareNovelItem {
    Long getId();

    List<? extends INovelItem> getChildren();

    void setNovel(Novel novel);
}
