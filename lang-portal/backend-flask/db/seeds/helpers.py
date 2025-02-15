import sqlite3
from ..config import DATABASE


def get_or_create_group(cursor, group_name):
    """Ensures the group exists and returns its ID."""
    cursor.execute("SELECT id FROM groups WHERE name = ?", (group_name,))
    row = cursor.fetchone()

    if row:
        return row[0]

    cursor.execute("INSERT INTO groups (name) VALUES (?)", (group_name,))
    return cursor.lastrowid
