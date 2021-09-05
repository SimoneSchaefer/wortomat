package de.wortomat.repository;


import de.wortomat.model.Location;
import org.springframework.stereotype.Repository;

@Repository
public interface LocationRepository extends PositionAwareRepository<Location, Long> {}
