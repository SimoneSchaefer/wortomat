package de.wortomat.repository;

import de.wortomat.model.Image;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FileRepository extends CrudRepository<Image,Long> {}
