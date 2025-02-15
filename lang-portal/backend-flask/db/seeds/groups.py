import sqlite3
import json
from ..config import DATABASE


def seed_groups():
    """Inserts initial data into the groups table, ensuring unique names."""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    with open("db/seeds/groups.json", "r", encoding="utf-8") as f:
        groups = json.load(f)

    for group in groups:
        try:
            cursor.execute("INSERT INTO groups (name) VALUES (?)", (group["name"],))
        except sqlite3.IntegrityError:
            print(f"Skipping duplicate group: {group['name']}")  # Log the skipped entry

    conn.commit()
    conn.close()
    print("Groups seeded successfully.")
