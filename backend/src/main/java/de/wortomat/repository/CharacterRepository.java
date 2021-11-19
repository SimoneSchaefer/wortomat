package de.wortomat.repository;


import de.wortomat.model.Character;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CharacterRepository extends NovelItemRepository<Character, Long> {
    Character findTopByParentOrderByPositionDesc(Long characterGroupId);
    List<Character> findAllByParent(Long characterGroupId);
}
