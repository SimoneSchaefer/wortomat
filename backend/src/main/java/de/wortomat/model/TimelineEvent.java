package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;

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

    public void setNovel(Novel novel) {
        this.novel = novel;
    }
}
