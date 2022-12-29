package de.wortomat.model;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.Entity;

@Entity
@Data
@Setter
@Getter
public class PlotlineEventTag extends NovelItemTag<PlotlineEvent> {}
