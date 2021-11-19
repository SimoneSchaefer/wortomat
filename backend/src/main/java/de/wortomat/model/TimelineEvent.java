package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import net.karneim.pojobuilder.GeneratePojoBuilder;
import org.hibernate.Hibernate;

import javax.persistence.*;
import java.util.Date;
import java.util.List;
import java.util.Objects;

@Entity
@Getter
@Setter
@ToString
@RequiredArgsConstructor
@GeneratePojoBuilder
public class TimelineEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private String summary;

    private Date eventDate;

    private String color;

    @JsonIgnore
    @ManyToOne
    private Novel novel;

    @ManyToMany(fetch = FetchType.LAZY)
    @ToString.Exclude
    private List<Chapter> chapters;

    @ManyToMany(fetch = FetchType.LAZY)
    @ToString.Exclude
    private List<Research> research;

    /*@JsonInclude(JsonInclude.Include.ALWAYS)
    List<Long> getChapterReferences() {
        return chapters.stream().map(Chapter::getId).collect(Collectors.toList());
    }

    @JsonInclude
    List<Long> getCResearchReferences() {
        return research.stream().map(research -> research.getId()).collect(Collectors.toList());
    }*/

    /*public List<Chapter> getChapters() {
        return this.chapters;
    }
    public List<Research> getResearch() {
        return this.research;
    }*/

    public void setNovel(Novel novel) {
        this.novel = novel;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        TimelineEvent that = (TimelineEvent) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return 0;
    }
}
