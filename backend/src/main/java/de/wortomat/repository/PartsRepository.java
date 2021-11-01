package de.wortomat.repository;


import de.wortomat.model.Part;
import org.springframework.stereotype.Repository;

@Repository
public interface PartsRepository extends GroupingItemRepository<Part, Long> {};