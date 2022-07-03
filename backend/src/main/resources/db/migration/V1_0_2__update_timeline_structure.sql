ALTER TABLE timeline_event ADD COLUMN position integer;
ALTER TABLE timeline_event ADD COLUMN details varchar(255);
CREATE TABLE timeline_event_images (timeline_event_id bigint not null, images_id bigint not null);



