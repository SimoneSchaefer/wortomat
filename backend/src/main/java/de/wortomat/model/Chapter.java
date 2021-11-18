package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIdentityReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.hibernate.Hibernate;

import javax.persistence.*;
import java.util.List;
import java.util.Objects;

@Entity
@Getter
@Setter
@ToString
@RequiredArgsConstructor
public class Chapter implements NovelItem {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private String summary;

    private String extended_summary;

    @Column(columnDefinition = "TEXT")
    private String content;

    private int position;

    @ManyToMany
    @ToString.Exclude
    private List<ChapterTag> tags;

    @JsonIgnore
    @ManyToOne
    @JsonIdentityReference(alwaysAsId = true)
    private Part part;

    @Override
    public Long getParentId() {
        return getParent().getId();
    }

    @Override
    public Long getId() { return this.id; }

    @Override
    public int getPosition() { return this.position; }

    @Override
    public void setPosition(int position) { this.position = position; }

    @Override
    @JsonIgnore
    public GroupingNovelItem getParent() {
        return this.getPart();
    }

    @Override
    public void setParent(GroupingNovelItem parent) {
        this.part = (Part) parent;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        Chapter chapter = (Chapter) o;
        return Objects.equals(id, chapter.id);
    }

    @Override
    public int hashCode() {
        return 0;
    }
}
