import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # This is the 'db' folder
DATABASE = os.path.join(BASE_DIR, "words.db")  # Store database directly inside 'db/'
SEED_DIR = "seeds"
