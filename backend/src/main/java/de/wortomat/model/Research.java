package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIdentityReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import net.karneim.pojobuilder.GeneratePojoBuilder;
import org.hibernate.Hibernate;

import javax.persistence.*;
import java.util.List;
import java.util.Objects;

@Entity
@Getter
@Setter
@ToString
@RequiredArgsConstructor
@GeneratePojoBuilder
public class Research implements NovelItem, ImageAware {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private String summary;

    private String extended_summary;

    private Integer position;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToMany
    @ToString.Exclude
    private List<Image> images;

    @ManyToMany
    @ToString.Exclude
    private List<ResearchTag> tags;

    @JsonIgnore
    @ManyToOne
    @JsonIdentityReference(alwaysAsId = true)
    private ResearchGroup researchGroup;

    @Override
    public Long getParentId() {
        return getParent().getId();
    }

    @Override
    @JsonIgnore
    public GroupingNovelItem getParent() {
        return this.getResearchGroup();
    }

    @Override
    public void setParent(GroupingNovelItem parent) {
        this.researchGroup = (ResearchGroup) parent;
    }

    @Override
    public List<Image> getImages() { return this.images; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        Research research = (Research) o;
        return Objects.equals(id, research.id);
    }

    @Override
    public int hashCode() {
        return 0;
    }
}
