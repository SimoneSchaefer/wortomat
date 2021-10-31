package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.List;

@Entity
@Data
public class Part implements GroupingNovelItem {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private int position;

    @JsonIgnore
    @ManyToOne
    private Novel novel;

    @Override
    public void setParent(GroupingNovelItem parent) {
        this.novel = (Novel) parent;
    }

    @OneToMany(mappedBy = "part")
    private List<Chapter> chapters;
}
