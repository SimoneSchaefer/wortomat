package de.wortomat.service;

import de.wortomat.model.Character;
import de.wortomat.model.Research;
import de.wortomat.repository.CharacterRepository;
import de.wortomat.repository.PositionAwareRepository;
import de.wortomat.repository.ResearchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CharacterService extends PositionAwareService<Character>{
    @Autowired
    CharacterRepository characterRepository;

    @Override
    public PositionAwareRepository<Character,Long> getRepository() {
        return this.characterRepository;
    }
}
