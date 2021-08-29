package de.wortomat.repository;

import de.wortomat.model.Novel;
import de.wortomat.model.Tag;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TagRepository  extends CrudRepository<Tag,Long> {}
