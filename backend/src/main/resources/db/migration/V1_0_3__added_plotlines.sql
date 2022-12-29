CREATE TABLE plotline (id  integer, contains_translation boolean, name varchar(255), position integer, novel_id bigint, color varchar(255), primary key (id));
CREATE TABLE plotline_event (id  integer, contains_translation boolean, content TEXT, deleted_at datetime, extended_summary varchar(255), name varchar(255), position integer, summary varchar(255), parent_id bigint, primary key (id));
