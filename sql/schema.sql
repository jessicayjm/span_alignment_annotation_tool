PRAGMA foreign_keys = ON;

CREATE TABLE annotators(
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  fullname VARCHAR(20) NOT NULL,
  username VARCHAR(20) NOT NULL,
  email VARCHAR(40) NOT NULL,
  password VARCHAR(120) NOT NULL,
  UNIQUE (email)
);

CREATE TABLE projects(
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name VARCHAR(40) NOT NULL,
  description VARCHAR(1000),
  agreement_score FLOAT,
  UNIQUE (name)
);

CREATE TABLE project_annotators(
  annotator_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  isAdmin BOOLEAN NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (annotator_id) REFERENCES annotators(id) ON DELETE CASCADE,
  PRIMARY KEY (annotator_id, project_id)
);

CREATE TABLE labels(
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name VARCHAR(20) NOT NULL,
  project_id INTEGER NOT NULL,
  color VARCHAR(8) NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE (name, project_id)
);

CREATE TABLE texts(
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  target_id VARCHAR(10),
  observer_id VARCHAR(10),
  parent_id VARCHAR(15),
  subreddit VARCHAR(20),
  target_text VARCHAR(5000) NOT NULL,
  observer_text VARCHAR(5000) NOT NULL,
  full_text VARCHAR(5000) NOT NULL,
  distress_score FLOAT,
  condolence_score FLOAT,
  empathy_score FLOAT,
  agreement_score FLOAT,
  UNIQUE (full_text)
);

CREATE TABLE project_texts(
  text_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  finalized BOOLEAN NOT NULL,
  review_status INTEGER NOT NULL,
  agreement_post_review_mean FLOAT,
  agreement_post_review_std FLOAT,
  agreement_pre_review_mean FLOAT,
  agreement_pre_review_std FLOAT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (text_id) REFERENCES texts(id) ON DELETE CASCADE,
  PRIMARY KEY (text_id, project_id)
);

CREATE TABLE annotations(
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  project_id INTEGER NOT NULL,
  text_id INTEGER NOT NULL,
  annotator_id INTEGER NOT NULL,
  label_id INTEGER NOT NULL,
  span_start INTEGER NOT NULL,
  span_end INTEGER NOT NULL,
  span VARCHAR(4000),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (text_id) REFERENCES texts(id) ON DELETE CASCADE,
  FOREIGN KEY (annotator_id) REFERENCES annotators(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE,
  UNIQUE (text_id, annotator_id, label_id, span_start, span_end)
);

CREATE TABLE quick_notes(
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  project_id INTEGER NOT NULL,
  text_id INTEGER NOT NULL,
  annotator_id INTEGER NOT NULL,
  refer_start INTEGER NOT NULL, -- the start index of text where the note points to
  refer_end INTEGER NOT NULL, -- the end index of text where the note points to
  content VARCHAR(1000) NOT NULL,
  isPrivate BOOLEAN NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (text_id) REFERENCES texts(id) ON DELETE CASCADE,
  FOREIGN KEY (annotator_id) REFERENCES annotators(id) ON DELETE CASCADE
);

CREATE TABLE rich_notes(
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  project_id INTEGER NOT NULL,
  text_id INTEGER NOT NULL,
  annotator_id INTEGER NOT NULL,
  content VARCHAR(4000) NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (text_id) REFERENCES texts(id) ON DELETE CASCADE,
  FOREIGN KEY (annotator_id) REFERENCES annotators(id) ON DELETE CASCADE,
  UNIQUE(project_id, text_id, annotator_id)
);

CREATE TABLE quotes(
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  content VARCHAR(4000) NOT NULL
);

CREATE TABLE note_quotes(
  note_id INTEGER NOT NULL,
  quote_id INTEGER NOT NULL,
  FOREIGN KEY (note_id) REFERENCES quick_notes(id) ON DELETE CASCADE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

CREATE TABLE jobs(
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name VARCHAR(40) NOT NULL,
  isActive INTEGER NOT NULL, -- inactive (0), active (1)
  start_time datetime default current_timestamp,
  due_time VARCHAR(40) NOT NULL,
  UNIQUE (name)
);

CREATE TABLE job_actions(
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  project_id INTEGER NOT NULL,
  text_id INTEGER NOT NULL,
  annotator_id INTEGER NOT NULL,
  job_id INTEGER NOT NULL, --set job_group_id to be 0 if it does not belong to any jobs
  action_type INTEGER NOT NULL, --action_type: annotate spans (0), annotate alignment (1), review spans (2), review alignment (3)
  status INTEGER NOT NULL, --unfinished (0), pending (1), submitted (2)
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (text_id) REFERENCES texts(id) ON DELETE CASCADE,
  FOREIGN KEY (annotator_id) REFERENCES annotators(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  UNIQUE (project_id, text_id, annotator_id, action_type)
);

CREATE TABLE alignments(
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  target_ann_id INTEGER NOT NULL,
  observer_ann_id INTEGER NOT NULL,
  annotator_id INTEGER NOT NULL,
  FOREIGN KEY (target_ann_id) REFERENCES annotations(id) ON DELETE CASCADE,
  FOREIGN KEY (observer_ann_id) REFERENCES annotations(id) ON DELETE CASCADE,
  FOREIGN KEY (annotator_id) REFERENCES annotators(id) ON DELETE CASCADE,
  UNIQUE(target_ann_id, observer_ann_id, annotator_id)
);