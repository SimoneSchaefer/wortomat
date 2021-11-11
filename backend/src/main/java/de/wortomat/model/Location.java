package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIdentityReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.List;

@Entity
@Data
public class Location implements NovelItem, ImageAware {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private String summary;

    private String extended_summary;

    private int position;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToMany
    private List<Image> images;

    @ManyToMany
    private List<LocationTag> tags;

    @JsonIgnore
    @ManyToOne
    @JsonIdentityReference(alwaysAsId = true)
    private LocationGroup locationGroup;

    @Override()
    public Long getId() { return this.id; }

    @Override()
    public int getPosition() { return this.position; }

    @Override
    @JsonIgnore
    public GroupingNovelItem getParent() {
        return this.getLocationGroup();
    }

    @Override
    public void setParent(GroupingNovelItem parent) {
        this.locationGroup = (LocationGroup) parent;
    }

    @Override()
    public void setPosition(int position) { this.position = position; }

    @Override
    public List<Image> getImages() { return this.images; }
}
