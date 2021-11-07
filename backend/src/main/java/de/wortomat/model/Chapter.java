package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIdentityReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.List;

@Entity
@Data
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
    private List<ChapterTag> tags;

    @JsonIgnore
    @ManyToOne
    @JsonIdentityReference(alwaysAsId = true)
    private Part part;

    @Override()
    public Long getId() { return this.id; }

    @Override()
    public int getPosition() { return this.position; }

    @Override()
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


}
