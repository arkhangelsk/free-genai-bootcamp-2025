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
  description TEXT,  -- Optional: A brief description of the activity
  type TEXT NOT NULL CHECK (type IN ('flashcards', 'quiz', 'practice', 'game')),  -- The type of activity
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),  -- The difficulty level of the activity
  url TEXT NOT NULL,  -- The full url of the study activity
  preview_url TEXT    -- The url to the preview image for the activity
);

CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    study_activity_id INTEGER NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    notes TEXT,  -- Added from migration script
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (study_activity_id) REFERENCES study_activities(id) ON DELETE CASCADE
);

-- Create table for storing individual responses in quiz/game sessions
CREATE TABLE IF NOT EXISTS session_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    user_response TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE
);

-- Create index for faster queries on session responses
CREATE INDEX IF NOT EXISTS idx_session_responses_session_id ON session_responses(session_id);