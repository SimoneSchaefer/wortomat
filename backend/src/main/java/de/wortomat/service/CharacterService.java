package de.wortomat.service;

import de.wortomat.model.Research;
import de.wortomat.repository.PositionAwareRepository;
import de.wortomat.repository.ResearchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ResearchService extends PositionAwareService<Research>{
    @Autowired
    ResearchRepository researchRepository;

    @Override
    public PositionAwareRepository<Research,Long> getRepository() {
        return this.researchRepository;
    }
}
