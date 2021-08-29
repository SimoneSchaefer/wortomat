package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.List;

@Entity
@Data
public class Chapter {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String title;

    private String summary;

    private String extended_summary;

    @Column(columnDefinition = "TEXT")
    private String content;

    private int position;

    @ManyToMany
    private List<Tag> tags;

    @JsonIgnore
    @ManyToOne
    private Novel novel;
}
