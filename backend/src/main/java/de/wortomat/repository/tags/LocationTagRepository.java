package de.wortomat.repository.tags;


import de.wortomat.model.LocationTag;
import de.wortomat.model.ResearchTag;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LocationTagRepository extends TagRepository<LocationTag, Long> {};