package de.wortomat.repository;


import de.wortomat.model.Research;
import org.springframework.stereotype.Repository;

@Repository
public interface CharacterRepository extends PositionAwareRepository<Research, Long> {}
