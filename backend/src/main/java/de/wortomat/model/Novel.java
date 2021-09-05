package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.List;

@Entity
@Data
public class Novel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String summary;

    private int position;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<Chapter> chapters;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<Character> characters;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<Research> research;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<ChapterTag> chapterTags;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<CharacterTag> characterTags;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<ResearchTag> researchTags;
}
