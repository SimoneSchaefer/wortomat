package de.wortomat.repository;


import de.wortomat.model.ResearchGroup;
import org.springframework.stereotype.Repository;

@Repository
public interface ResearchGroupRepository extends GroupingItemRepository<ResearchGroup, Long> {};