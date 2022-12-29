package de.wortomat.repository;


import de.wortomat.model.Chapter;
import de.wortomat.model.PlotlineEvent;
import org.springframework.stereotype.Repository;

@Repository
public interface PlotlineEventRepository extends NovelItemRepository<PlotlineEvent> {};