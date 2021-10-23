package de.wortomat.repository;

import de.wortomat.model.TimelineEvent;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimelineEventRepository extends CrudRepository<TimelineEvent,Long> {
    List<TimelineEvent> findAllByNovelIdOrderByEventDate(Long novelId);
}
