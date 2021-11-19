package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.Collections;
import java.util.List;

@Entity
@Data
public class CharacterGroup implements GroupingNovelItem {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private Integer position;

    @JsonIgnore
    @ManyToOne
    private Novel novel;

    @OneToMany(mappedBy = "characterGroup")
    private List<Character> characters = Collections.emptyList();

    @Override()
    public Long getId() { return this.id; }

    @Override
    @JsonIgnore
    public List getChildren() {
        return this.characters;
    }

    @Override
    public void setNovel(Novel novel) {
        this.novel = novel;
    }
}
