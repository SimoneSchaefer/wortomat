package de.wortomat.repository;


import de.wortomat.model.Plotline;
import org.springframework.stereotype.Repository;

@Repository
public interface PlotlineRepository extends GroupingItemRepository<Plotline, Long> {};