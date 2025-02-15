CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  arabic TEXT NOT NULL,
  romanized TEXT NOT NULL,
  english TEXT NOT NULL,
  example JSON, -- Explanation of the word in English 
  group_id INTEGER NOT NULL,
  pronunciation_audio TEXT,  -- Optional: link to an audio file  
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS words_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,  -- e.g., "Flashcards", "Quiz", "Typing Tutor", "Game"
  url TEXT NOT NULL,  -- The full url of the study activity
  preview_url TEXT    -- The url to the preview image for the activity
);

CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    study_activity_id INTEGER NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,  
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (study_activity_id) REFERENCES study_activities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS word_review_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL,
    study_session_id INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 1), -- 0 = incorrect, 1 = correct
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
    FOREIGN KEY (study_session_id) REFERENCES study_sessions(id) ON DELETE CASCADE
);