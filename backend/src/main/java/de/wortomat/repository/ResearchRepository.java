package de.wortomat.repository;


import de.wortomat.model.Chapter;
import de.wortomat.model.Research;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResearchRepository extends NovelItemRepository<Research, Long> {
    Research findTopByParentOrderByPositionDesc(Long researchGroupId);
    List<Chapter> findAllByParent(Long researchGroupId);
};