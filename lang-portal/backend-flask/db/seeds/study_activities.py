import sqlite3
import json
from ..config import DATABASE


def seed_study_activities():
    """Inserts initial data into the study_activities table."""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    with open("db/seeds/study_activities.json", "r") as f:
        study_activities = json.load(f)

    for activity in study_activities:
        cursor.execute(
            "INSERT INTO study_activities (name, url, preview_url) VALUES (?, ?, ?)",
            (activity["name"], activity["url"], activity["preview_url"]),
        )

    conn.commit()
    conn.close()
    print("Study activities seeded successfully.")