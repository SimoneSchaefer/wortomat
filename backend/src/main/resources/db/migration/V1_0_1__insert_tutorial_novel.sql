INSERT INTO novel (id, name, summary, contains_translation, position) values (1, 'tutorial.novel.name', 'tutorial.novel.summary', true, 0);

INSERT INTO part (id, novel_id, name, contains_translation, position) values (1, 1, 'tutorial.part_1.name', true, 0);

INSERT INTO chapter (id, parent_id, name, summary, content, contains_translation, position) values (1, 1, 'tutorial.part_1.chapter_1.name', 'tutorial.part_1.chapter_1.summary', 'tutorial.part_1.chapter_1.content', true, 0);
INSERT INTO chapter (id, parent_id, name, summary, content, contains_translation, position) values (2, 1, 'tutorial.part_1.chapter_2.name', 'tutorial.part_1.chapter_2.summary', 'tutorial.part_1.chapter_2.content', true, 1);
INSERT INTO chapter (id, parent_id, name, summary, content, contains_translation, position) values (3, 1, 'tutorial.part_1.chapter_3.name', 'tutorial.part_1.chapter_3.summary', 'tutorial.part_1.chapter_3.content', true, 2);

INSERT INTO chapter_tag (id, novel_id, name, contains_translation) values (1, 1, 'tutorial.tag_1', true);
INSERT INTO chapter_tag (id, novel_id, name, contains_translation) values (2, 1, 'tutorial.tag_2', true);

INSERT INTO part (id, novel_id, name, contains_translation, position) values (2, 1, 'tutorial.part_2.name', true, 1);

INSERT INTO chapter (id, parent_id, name, summary, content, contains_translation, position) values (4, 2, 'tutorial.part_2.chapter_1.name', 'tutorial.part_2.chapter_1.summary', 'tutorial.part_2.chapter_1.content', true, 0);
INSERT INTO chapter (id, parent_id, name, summary, content, contains_translation, position) values (5, 2, 'tutorial.part_2.chapter_2.name', 'tutorial.part_2.chapter_2.summary', 'tutorial.part_2.chapter_2.content', true, 1);
INSERT INTO chapter (id, parent_id, name, summary, content, contains_translation, position) values (6, 2, 'tutorial.part_2.chapter_3.name', 'tutorial.part_2.chapter_3.summary', 'tutorial.part_2.chapter_3.content', true, 2);

INSERT INTO part (id, novel_id, name, contains_translation, position) values (3, 1, 'tutorial.part_3.name', true, 1);
INSERT INTO chapter (id, parent_id, name, summary, content, contains_translation, position) values (7, 3, 'tutorial.part_3.chapter_1.name', 'tutorial.part_3.chapter_1.summary', 'tutorial.part_3.chapter_1.content', true, 0);

INSERT INTO chapter_tags (chapter_id, tags_id) VALUES (1, 1);
INSERT INTO chapter_tags (chapter_id, tags_id) VALUES (2, 1);
INSERT INTO chapter_tags (chapter_id, tags_id) VALUES (4, 1);
INSERT INTO chapter_tags (chapter_id, tags_id) VALUES (5, 1);
INSERT INTO chapter_tags (chapter_id, tags_id) VALUES (6, 1);
INSERT INTO chapter_tags (chapter_id, tags_id) VALUES (7, 1);