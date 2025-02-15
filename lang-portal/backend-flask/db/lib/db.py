import sqlite3

from ..config import DATABASE

def get_db():
    print(f"Connecting to database at: {DATABASE}") 
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # Enables dictionary-like access to rows
    return conn
