package de.wortomat.repository;


import de.wortomat.model.CharacterGroup;
import org.springframework.stereotype.Repository;

@Repository
public interface CharacterGroupRepository extends GroupingItemRepository<CharacterGroup, Long> {};