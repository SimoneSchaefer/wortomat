package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import net.karneim.pojobuilder.GeneratePojoBuilder;
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
@GeneratePojoBuilder
public class Part implements GroupingNovelItem {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private Integer position;

    @JsonIgnore
    @ManyToOne
    private Novel novel;

    @OneToMany(mappedBy = "part")
    @ToString.Exclude
    private List<Chapter> chapters = Collections.emptyList();

    @Override
    @JsonIgnore
    public List getChildren() {
        return this.chapters;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        Part part = (Part) o;
        return Objects.equals(id, part.id);
    }

    @Override
    public int hashCode() {
        return 0;
    }
}
