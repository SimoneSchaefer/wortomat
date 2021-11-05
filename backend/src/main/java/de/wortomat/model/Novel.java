package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

@Entity
@Data
public class Novel implements GroupingNovelItem {
    @Id
    @JsonFormat
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String summary;

    private int position;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<Part> parts;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<Character> characters;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<Location> locations;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<ResearchGroup> researchGroups;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<ChapterTag> chapterTags;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<CharacterTag> characterTags;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<ResearchTag> researchTags;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<LocationTag> locationTags;

    // @Override
    @JsonIgnore
    public List<? extends NovelItemTag> getTags() {
        /*throw new IllegalStateException("can not access tags for novel");*/
        return Collections.emptyList();
    }

    @Override
    @JsonIgnore
    public List<? extends NovelItem> getChildren() {
        return Collections.emptyList();
    }

    @Override
    public void setNovel(Novel novel) {

    }
}
