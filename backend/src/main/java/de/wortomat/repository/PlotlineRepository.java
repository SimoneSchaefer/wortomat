package de.wortomat.repository;


import de.wortomat.model.Part;
import org.springframework.stereotype.Repository;

@Repository
public interface PlotlineRepository extends GroupingItemRepository<Part, Long> {};