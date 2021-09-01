package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.List;

@Entity
@Data
public class Novel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String summary;

    private int position;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<Chapter> chapters;

    @JsonIgnore
    @OneToMany(mappedBy = "novel")
    private List<Research> research;

    @OneToMany(mappedBy = "novel")
    private List<Tag> tags;
}
