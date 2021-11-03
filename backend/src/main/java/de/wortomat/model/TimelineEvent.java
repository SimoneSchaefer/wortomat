package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIdentityReference;
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
    @JsonIdentityReference(alwaysAsId = true)
    private List<Chapter> chapters;

    @ManyToMany
    @JsonIdentityReference(alwaysAsId = true)
    @JsonFormat
    private List<Research> research;

    public void setNovel(Novel novel) {
        this.novel = novel;
    }
}
