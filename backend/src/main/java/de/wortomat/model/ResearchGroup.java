package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import net.karneim.pojobuilder.GeneratePojoBuilder;
import org.hibernate.Hibernate;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Getter
@Setter
@ToString
@RequiredArgsConstructor
@GeneratePojoBuilder
public class ResearchGroup implements GroupingNovelItem {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private Integer position;

    @JsonIgnore
    @ManyToOne
    private Novel novel;

    @OneToMany(mappedBy = "researchGroup")
    @ToString.Exclude
    private List<Research> research = new ArrayList<>();

    @Override
    @JsonIgnore
    public List getChildren() {
        return this.getResearch();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        ResearchGroup that = (ResearchGroup) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return 0;
    }
}
