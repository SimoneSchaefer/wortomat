package de.wortomat.repository;


import de.wortomat.model.LocationGroup;
import org.springframework.stereotype.Repository;

@Repository
public interface LocationGroupRepository extends GroupingItemRepository<LocationGroup, Long> {};