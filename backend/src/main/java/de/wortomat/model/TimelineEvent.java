package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.ArrayList;
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

    @ManyToMany(fetch = FetchType.LAZY)
    private List<Chapter> chapters;

    @ManyToMany(fetch = FetchType.LAZY)
    private List<Research> research = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    private List<Location> locations = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    private List<Character> characters = new ArrayList<>();

    public void setNovel(Novel novel) {
        this.novel = novel;
    }
}
