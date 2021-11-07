package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.Collections;
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

    @OneToMany(mappedBy = "part")
    private List<Chapter> chapters = Collections.emptyList();

    @Override()
    public Long getId() { return this.id; }

    @Override()
    public int getPosition() { return this.position; }

    @Override
    public void setNovel(Novel novel) {
        this.novel = novel;
    }

    @Override
    @JsonIgnore
    public List getChildren() {
        return this.chapters;
    }

    @Override()
    public void setPosition(int position) { this.position = position; }

}
