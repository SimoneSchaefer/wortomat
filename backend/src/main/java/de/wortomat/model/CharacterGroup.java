package de.wortomat.model;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.OneToMany;
import java.util.Collections;
import java.util.List;

@Entity
@Data
public class CharacterGroup extends GroupingNovelItem<Character> {

    @OneToMany(mappedBy = "parent")
    private List<Character> children = Collections.emptyList();
}
