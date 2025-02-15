# db/seeds/words.py
import sqlite3
import json
import os
from pathlib import Path
from ..config import DATABASE, SEED_DIR
from .helpers import get_or_create_group


def seed_words():
    """Inserts data from multiple JSON files into the words table."""
    # Enable JSON serialization for SQLite
    sqlite3.register_adapter(dict, json.dumps)

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # Get the base directory (where config.py is) and construct seed path
    base_dir = Path(__file__).parent.parent
    seed_directory = os.path.join(base_dir, SEED_DIR)

    json_files = {
        "Basic Greetings": "data_basic_greetings.json",
        "Common Phrases": "data_common_phrases.json",
        "Beginner Verbs": "data_verbs_beginner.json",
    }

    print(f"Looking for files in: {seed_directory}")

    for group_name, json_file in json_files.items():
        file_path = os.path.join(seed_directory, json_file)

        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                words = json.load(f)

            group_id = get_or_create_group(cursor, group_name)

            for word in words:
                # The example field is already a dictionary, so it will be automatically converted to JSON
                cursor.execute(
                    """
                    INSERT INTO words 
                    (arabic, romanized, english, example, group_id, pronunciation_audio) 
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        word["arabic"],
                        word["romanized"],
                        word["english"],
                        word["example"],  # This will be automatically converted to JSON
                        word.get(
                            "group_id", group_id
                        ),  # Use provided group_id or default to created one
                        word.get("pronunciation_audio", None),  # Optional field
                    ),
                )

            print(f"Seeded data from {json_file} into group '{group_name}'")
        else:
            print(f"File {json_file} not found at {file_path}")

    conn.commit()
    conn.close()
    print("Words seeded successfully.")
