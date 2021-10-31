package de.wortomat.repository;


import de.wortomat.model.Chapter;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChapterRepository extends CrudRepository<Chapter, Long> {
    Chapter findTopByPartIdOrderByPositionDesc(Long partId);
    List<Chapter> findAllByPartId(Long partId);

};