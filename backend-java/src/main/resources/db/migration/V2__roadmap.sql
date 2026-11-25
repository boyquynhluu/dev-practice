-- Theo dõi lộ trình Backend 84 ngày (kế hoạch nằm ở resources/roadmap/backend-84-days.json).
CREATE TABLE roadmap_progress (
    day_no         INT           NOT NULL PRIMARY KEY,
    status         VARCHAR(20)   NOT NULL,
    actual_minutes INT,
    note           VARCHAR(2000),
    self_rating    INT,
    updated_at     TIMESTAMP     NOT NULL
);

-- Trạng thái đã ghi trong file Backend_84_Day_Learning_Roadmap.xlsx lúc import.
INSERT INTO roadmap_progress (day_no, status, updated_at) VALUES
    (1, 'DONE', CURRENT_TIMESTAMP),
    (2, 'DONE', CURRENT_TIMESTAMP),
    (3, 'DONE', CURRENT_TIMESTAMP);
