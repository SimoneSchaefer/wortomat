package de.wortomat.repository;

import de.wortomat.model.ChapterTag;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TagRepository  extends CrudRepository<ChapterTag,Long> {}
