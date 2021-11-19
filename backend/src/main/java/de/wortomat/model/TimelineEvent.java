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

    @ManyToMany(fetch = FetchType.LAZY)
    private List<Chapter> chapters;

    @ManyToMany(fetch = FetchType.LAZY)
    private List<Research> research;

    /*@JsonInclude(JsonInclude.Include.ALWAYS)
    List<Long> getChapterReferences() {
        return chapters.stream().map(Chapter::getId).collect(Collectors.toList());
    }

    @JsonInclude
    List<Long> getCResearchReferences() {
        return research.stream().map(research -> research.getId()).collect(Collectors.toList());
    }*/

    /*public List<Chapter> getChapters() {
        return this.chapters;
    }
    public List<Research> getResearch() {
        return this.research;
    }*/

    public void setNovel(Novel novel) {
        this.novel = novel;
    }
}
