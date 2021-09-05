package de.wortomat.repository.tags;


import de.wortomat.model.ChapterTag;
import org.springframework.stereotype.Repository;

@Repository
public interface ChapterTagRepository extends TagRepository<ChapterTag, Long> {

};