package de.wortomat.repository;


import de.wortomat.model.Chapter;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChapterRepository extends NovelItemRepository<Chapter, Long> {
    Chapter findTopByPartIdOrderByPositionDesc(Long partId);
    List<Chapter> findAllByPartId(Long partId);
};