package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.hibernate.Hibernate;

import javax.persistence.*;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Entity
@Getter
@Setter
@ToString
@RequiredArgsConstructor
public class Novel implements GroupingNovelItem {
    @Id
    @JsonFormat
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String summary;

    private Integer position;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    @ToString.Exclude
    private List<Part> parts;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    @ToString.Exclude
    private List<CharacterGroup> characters;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    @ToString.Exclude
    private List<LocationGroup> locations;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    @ToString.Exclude
    private List<ResearchGroup> researchGroups;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    @ToString.Exclude
    private List<ChapterTag> chapterTags;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    @ToString.Exclude
    private List<CharacterTag> characterTags;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    @ToString.Exclude
    private List<ResearchTag> researchTags;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    @ToString.Exclude
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
    public void setNovel(Novel novel) { }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        Novel novel = (Novel) o;
        return Objects.equals(id, novel.id);
    }

    @Override
    public int hashCode() {
        return 0;
    }
}
