package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.List;

@Entity
@Data
public class Location implements PositionAware, ImageAware {
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
    private Novel novel;
}
