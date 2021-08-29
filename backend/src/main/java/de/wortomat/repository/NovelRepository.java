package de.wortomat.repository;

import de.wortomat.model.Novel;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NovelRepository extends CrudRepository<Novel,Long> {
    List<Novel> findByOrderByPositionAsc();
}
