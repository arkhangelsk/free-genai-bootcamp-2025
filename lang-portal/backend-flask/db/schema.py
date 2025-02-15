import sqlite3
import os
from .config import DATABASE


def init_db():
    """Creates database tables from SQL schema."""
    # Ensure 'db' directory exists
    db_dir = os.path.dirname(DATABASE)
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)

    conn = sqlite3.connect(DATABASE)
    with open("db/sql/setup.sql", "r") as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print(f"Database initialized successfully at {DATABASE}.")
