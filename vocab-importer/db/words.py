# db/seeds/words.py
import sqlite3
import json
import os
import argparse
import glob
from pathlib import Path

# Get project root directory (one level up from 'db' folder)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE = os.path.join(BASE_DIR, "db", "words.db")
SEED_DIR = os.path.join("db", "seeds")


def get_or_create_group(cursor, group_name):
    """Ensures the group exists and returns its ID."""
    cursor.execute("SELECT id FROM groups WHERE name = ?", (group_name,))
    row = cursor.fetchone()

    if row:
        return row[0]

    cursor.execute("INSERT INTO groups (name) VALUES (?)", (group_name,))
    return cursor.lastrowid


def setup_database():
    """Creates the database tables if they don't exist."""
    # Ensure the db directory exists
    os.makedirs(os.path.dirname(DATABASE), exist_ok=True)

    # Connect to database
    print(f"Connecting to database at: {DATABASE}")
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # Create tables if they don't exist
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            arabic TEXT NOT NULL,
            romanized TEXT NOT NULL,
            english TEXT NOT NULL,
            example JSON,
            group_id INTEGER NOT NULL,
            pronunciation_audio TEXT,
            FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
        )
    """
    )

    conn.commit()
    return conn


def seed_words_from_file(conn, group_name, json_file):
    """Seeds words from a specific JSON file into a specific group."""
    cursor = conn.cursor()

    # Enable JSON serialization for SQLite
    sqlite3.register_adapter(dict, json.dumps)

    file_path = os.path.join(BASE_DIR, SEED_DIR, json_file)

    if not os.path.exists(file_path):
        print(f"File {json_file} not found at {file_path}")
        return False

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            words = json.load(f)

        group_id = get_or_create_group(cursor, group_name)

        added_count = 0
        skipped_count = 0

        for word in words:
            try:
                # Check if word already exists
                cursor.execute(
                    "SELECT id FROM words WHERE arabic = ? AND group_id = ?",
                    (word["arabic"], group_id),
                )
                existing = cursor.fetchone()

                if not existing:
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
                            word[
                                "example"
                            ],  # This will be automatically converted to JSON
                            group_id,  # Always use the group_id from the current group
                            word.get("pronunciation_audio", None),  # Optional field
                        ),
                    )
                    added_count += 1
                else:
                    skipped_count += 1
            except Exception as e:
                print(f"Error inserting word {word['arabic']}: {str(e)}")

        conn.commit()
        print(
            f"Seeded {added_count} words from {json_file} into group '{group_name}' (skipped {skipped_count} existing words)"
        )
        return True
    except Exception as e:
        print(f"Error processing file {json_file}: {str(e)}")
        return False


def list_available_files():
    """Lists all JSON files in the seed directory."""
    seed_directory = os.path.join(BASE_DIR, SEED_DIR)
    json_files = glob.glob(os.path.join(seed_directory, "*.json"))
    return [os.path.basename(f) for f in json_files]


def main():
    parser = argparse.ArgumentParser(
        description="Seed Arabic vocabulary words into the database."
    )
    parser.add_argument("--file", help="Specific JSON file to use (without path)")
    parser.add_argument("--group", help="Group name for the words")
    # Removed description parameter
    parser.add_argument(
        "--all",
        action="store_true",
        help="Process all JSON files in the seed directory",
    )
    parser.add_argument("--list", action="store_true", help="List available JSON files")
    parser.add_argument(
        "--mapping", help="JSON file containing mappings between files and groups"
    )

    args = parser.parse_args()

    if args.list:
        print("Available JSON files:")
        for filename in list_available_files():
            print(f"  - {filename}")
        return

    # Setup database connection
    conn = setup_database()

    try:
        if args.mapping:
            # Use mapping file
            mapping_path = os.path.join(BASE_DIR, SEED_DIR, args.mapping)
            if not os.path.exists(mapping_path):
                print(f"Mapping file not found: {mapping_path}")
                return

            with open(mapping_path, "r", encoding="utf-8") as f:
                mappings = json.load(f)

            for item in mappings:
                seed_words_from_file(conn, item["group"], item["file"])

        elif args.all:
            # Process all JSON files (except mapping files)
            files = list_available_files()
            for file in files:
                if file.lower() != args.mapping and not file.startswith("mapping"):
                    # Use filename without extension as default group name
                    group_name = os.path.splitext(file)[0].replace("_", " ").title()
                    seed_words_from_file(conn, group_name, file)

        elif args.file and args.group:
            # Process specific file and group
            seed_words_from_file(conn, args.group, args.file)

        else:
            # Default behavior: use hardcoded mappings
            json_files = {
                "Clothing": "arabic_vocab_hobbies.json",
                "Colors": "arabic_vocab_numbers.json",
            }

            for group_name, json_file in json_files.items():
                seed_words_from_file(conn, group_name, json_file)

    finally:
        conn.close()

    print("Seeding process completed.")


if __name__ == "__main__":
    main()
