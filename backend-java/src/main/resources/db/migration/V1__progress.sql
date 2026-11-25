CREATE TABLE progress (
    lesson_id   VARCHAR(50)  NOT NULL PRIMARY KEY,
    track       VARCHAR(20)  NOT NULL,
    status      VARCHAR(20)  NOT NULL,
    passed      INT          NOT NULL DEFAULT 0,
    total       INT          NOT NULL DEFAULT 0,
    attempts    INT          NOT NULL DEFAULT 0,
    code        CLOB,
    completed_at TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL
);
CREATE INDEX idx_progress_track ON progress (track);
