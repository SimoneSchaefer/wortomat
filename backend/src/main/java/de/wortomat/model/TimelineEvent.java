package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.Date;
import java.util.List;

@Entity
@Data
public class TimelineEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private String summary;

    private Date eventDate;

    private String color;

    @JsonIgnore
    @ManyToOne
    private Novel novel;

    @ManyToMany
    private List<Chapter> chapters;

    @ManyToMany
    private List<Research> research;

    public void setNovel(Novel novel) {
        this.novel = novel;
    }
}
