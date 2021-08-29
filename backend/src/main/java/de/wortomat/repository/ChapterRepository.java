package de.wortomat.repository;


import de.wortomat.model.Chapter;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChapterRepository extends CrudRepository<Chapter, Long> {
    List<Chapter> findAllByNovelIdOrderByPosition(@Param("novelId") Long novelId);
    Chapter findTopByNovelIdOrderByPositionDesc(@Param("novelId") Long novelId);

}
