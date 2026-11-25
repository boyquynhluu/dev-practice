"""Xuất Backend_84_Day_Learning_Roadmap.xlsx -> backend-java/src/main/resources/roadmap/backend-84-days.json.

Chạy lại mỗi khi sửa sheet "Ke hoach 84 ngay" (chỉ lấy phần KẾ HOẠCH; trạng thái, phút thực tế,
ghi chú, tự đánh giá được theo dõi trên web ở trang /roadmap và lưu trong H2 của backend-java).

    pip install openpyxl
    python docs/java/export_roadmap.py
"""
import datetime as dt
import json
import pathlib

import openpyxl

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "docs/java/Backend_84_Day_Learning_Roadmap.xlsx"
OUT = ROOT / "backend-java/src/main/resources/roadmap/backend-84-days.json"

# Mỗi công nghệ có một bài chính (java-16..java-39) — gắn cho mọi buổi của công nghệ đó.
TECH_LESSON = {
    "Java 21": "java-16", "Spring Boot 3.x": "java-17", "Spring Security": "java-18",
    "MySQL": "java-19", "Redis": "java-20", "Transaction": "java-21", "Indexing": "java-22",
    "Monolith": "java-23", "Microservices": "java-24", "DDD": "java-25", "Clean Architecture": "java-26",
    "Scalability": "java-27", "High Availability": "java-28", "Distributed Systems": "java-29",
    "Kafka": "java-30", "Event-driven Architecture": "java-31", "Docker": "java-32", "CI/CD": "java-33",
    "AWS": "java-34", "Monitoring": "java-35", "Design Patterns": "java-36", "Concurrency": "java-37",
    "Performance": "java-38", "Testing": "java-39",
}

# Bài cũ (java-01..15) sát với chủ đề riêng của từng buổi (ghép theo số buổi).
LESSONS = {
    1: ["java-08"], 73: ["java-08"],
    2: ["java-09"], 74: ["java-09"],
    6: ["java-10"], 78: ["java-10"], 30: ["java-10"], 54: ["java-10"],
    22: ["java-12"], 70: ["java-12"],
    25: ["java-06"],
    26: ["java-10"],
    29: ["java-13"], 50: ["java-13"],
    35: ["java-09"], 58: ["java-09"],
    46: ["java-11"], 49: ["java-11"],
    53: ["java-14"],
    69: ["java-15"],
}


def main():
    ws = openpyxl.load_workbook(SRC, data_only=True)["Ke hoach 84 ngay"]
    days = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        if row[0] is None:
            continue
        day, date, week, group, tech, topic, method, minutes = row[:8]
        if isinstance(date, (dt.date, dt.datetime)):
            date = date.strftime("%Y-%m-%d")
        days.append({
            "day": int(day),
            "plannedDate": str(date),
            "week": int(week),
            "group": group,
            "tech": tech,
            "topic": topic,
            "method": method,
            "plannedMinutes": int(minutes or 60),
            "lessons": [x for x in [TECH_LESSON.get(tech)] if x] + LESSONS.get(int(day), []),
        })
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(days, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(days)} buổi -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
