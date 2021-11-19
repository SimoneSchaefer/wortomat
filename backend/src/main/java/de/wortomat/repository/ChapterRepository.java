package de.wortomat.repository;


import de.wortomat.model.Chapter;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChapterRepository extends NovelItemRepository<Chapter, Long> {
    Chapter findTopByParentOrderByPositionDesc(Long partId);
    List<Chapter> findAllByParent(Long partId);
};