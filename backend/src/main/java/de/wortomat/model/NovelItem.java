package de.wortomat.model;

import java.util.List;

public interface NovelItem {
    void setNovel(Novel novel);
    List<? extends NovelItemTag> getTags();
}
