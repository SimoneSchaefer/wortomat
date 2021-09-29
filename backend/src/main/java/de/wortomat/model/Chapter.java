package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

import javax.persistence.*;
import java.util.List;

@Entity
@Data
public class Chapter implements PositionAware {
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
    private Novel novel;

}
