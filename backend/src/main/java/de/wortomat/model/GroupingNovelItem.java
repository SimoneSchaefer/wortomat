package de.wortomat.model;

import java.util.List;

public interface GroupingNovelItem extends PositionAwareNovelItem {
    Long getId();

    List<NovelItem> getChildren();

    void setNovel(Novel novel);
}
