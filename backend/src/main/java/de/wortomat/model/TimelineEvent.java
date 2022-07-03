package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import de.wortomat.service.uploads.EntityType;
import lombok.Data;

import javax.persistence.*;
import java.util.*;
import java.util.stream.Collectors;

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

    private Integer position;


    @ManyToMany
    private List<Image> images;
    
    @JsonIgnore
    @ManyToOne
    private Novel novel;

    @JsonIgnore
    @ManyToMany(fetch = FetchType.LAZY)
    private List<Chapter> chapters = new ArrayList<>();

    @JsonIgnore
    @ManyToMany(fetch = FetchType.LAZY)
    private List<Research> research = new ArrayList<>();

    @JsonIgnore
    @ManyToMany(fetch = FetchType.LAZY)
    private List<Location> locations = new ArrayList<>();

    @JsonIgnore
    @ManyToMany(fetch = FetchType.LAZY)
    private List<Character> characters = new ArrayList<>();


    public void setNovel(Novel novel) {
        this.novel = novel;
    }

    public Map<EntityType, List<Long>> getReferences() {
        Map<EntityType, List<Long>> referenceMap = new HashMap<>();
        referenceMap.put(EntityType.CHAPTERS, getChapters().stream().map(Chapter::getId).collect(Collectors.toList()));
        referenceMap.put(EntityType.RESEARCH, getResearch().stream().map(Research::getId).collect(Collectors.toList()));
        referenceMap.put(EntityType.LOCATIONS, getLocations().stream().map(Location::getId).collect(Collectors.toList()));
        referenceMap.put(EntityType.CHARACTERS, getCharacters().stream().map(Character::getId).collect(Collectors.toList()));
        return referenceMap;
    }
}
