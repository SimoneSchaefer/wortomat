package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.Collections;
import java.util.List;

@Entity
@Data
public class CharacterGroup extends GroupingNovelItem {

    @OneToMany(mappedBy = "characterGroup")
    private List<Character> characters = Collections.emptyList();

    @Override
    @JsonIgnore
    public List getChildren() {
        return this.characters;
    }

}
