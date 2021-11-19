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
public class Location implements NovelItem, ImageAware {
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
    private List<LocationTag> tags;

    @JsonIgnore
    @ManyToOne
    @JsonIdentityReference(alwaysAsId = true)
    private LocationGroup locationGroup;

    @Override
    @JsonIgnore
    public GroupingNovelItem getParent() {
        return this.getLocationGroup();
    }

    @Override
    public void setParent(GroupingNovelItem parent) {
        this.locationGroup = (LocationGroup) parent;
    }

    @Override
    public List<Image> getImages() { return this.images; }

    @Override
    public Long getParentId() {
        return getParent().getId();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        Location location = (Location) o;
        return Objects.equals(id, location.id);
    }

    @Override
    public int hashCode() {
        return 0;
    }
}
