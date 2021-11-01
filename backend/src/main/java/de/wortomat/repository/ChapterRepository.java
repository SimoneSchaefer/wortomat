package de.wortomat.repository;


import de.wortomat.model.Chapter;
import de.wortomat.model.GroupingNovelItem;
import de.wortomat.model.NovelItem;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChapterRepository extends NovelItemRepository<Chapter, Long> {
    Chapter findTopByPartIdOrderByPositionDesc(Long partId);
    List<Chapter> findAllByPartId(Long partId);
};