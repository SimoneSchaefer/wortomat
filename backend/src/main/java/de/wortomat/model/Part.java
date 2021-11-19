package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.Collections;
import java.util.List;

@Entity
@Data
public class Part extends GroupingNovelItem {

    @OneToMany(mappedBy = "part")
    private List<Chapter> chapters = Collections.emptyList();

    public List<Chapter> getChapters() {
        return this.chapters;
    }

    @Override
    @JsonIgnore
    public List getChildren() {
        return this.chapters;
    }
}
