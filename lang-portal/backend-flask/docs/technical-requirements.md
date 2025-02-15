# Arabic Language Learning Portal - Technical Requirements Document

## Core Technologies
- Python programming language for the backend implementation
- SQLite3 as the primary database
- Flask framework for REST API development

## API Design
- All endpoints will return JSON responses
- Single-user system with no authentication/authorization required
- Stateless API design following RESTful principles

## Technical Constraints
- Data persistence handled exclusively through SQLite3
- No multi-user support or session management

## Database Schema (Main Tables)
TO DO: Pagination with 100 items per page
1. **Words** (`words`): Stores individual words and their metadata 
   - id INTEGER PRIMARY KEY AUTOINCREMENT,
   - arabic TEXT NOT NULL,
   - romanized TEXT NOT NULL,
   - english TEXT NOT NULL,
   - example JSON, -- Explanation of the word in English 
   - group_id INTEGER NOT NULL,
   - pronunciation_audio TEXT,  -- Optional: link to an audio file  
   - FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE

```json
{
  "items": [
    {
      "id": 1,
      "arabic": "مرحبا",
      "romanized": "marhaban",
      "english": "hello",
      "example": {
        "arabic": "مرحبا، كيف حالك؟",
        "english": "Hello, how are you?"
      },
      "pronunciation_audio": "https://example.com/audio/marhaban.mp3"
    },
    {
      "id": 2,
      "arabic": "شكرا",
      "romanized": "shukran",
      "english": "thank you",
      "example": {
        "arabic": "شكرا جزيلا!",
        "english": "Thank you very much!"
      },
      "pronunciation_audio": "https://example.com/audio/shukran.mp3"
    },
    ....
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 500,
    "items_per_page": 100
  }
}
```



1. **Word Groups** (`word_groups_mappings`): Stores categories of words (e.g., verbs, nouns, greetings)
   - id INTEGER PRIMARY KEY AUTOINCREMENT,
   - name TEXT UNIQUE NOT NULL (e.g., Verbs, Nouns, Greetings)

2. **Word Group Mappings** (`words_groups`): Maps words to word groups (many-to-many relationship)
   - id INTEGER PRIMARY KEY AUTOINCREMENT,
   - word_id INTEGER NOT NULL,
   - word_group_id INTEGER NOT NULL,
   - FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
   - FOREIGN KEY (word_group_id) REFERENCES word_groups(id) ON DELETE CASCADE

3. **Study Activities** (`study_activities`): Stores different types of study activities (e.g., quizzes, flashcards)  
   - id INTEGER PRIMARY KEY AUTOINCREMENT, 
   - name TEXT NOT NULL UNIQUE, (e.g., Vocabulary Quiz, Sentence Completion, Flash Cards)  
   - `description` (TEXT)  

4. **Study Sessions** (`study_sessions`): Tracks user study sessions
   - id INTEGER PRIMARY KEY AUTOINCREMENT,  
   - start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
   - end_time DATETIME, 

5. **Session Activities** (`session_activities`): Tracks activities performed during a study session
   - id INTEGER PRIMARY KEY AUTOINCREMENT,
   - study_session_id INTEGER NOT NULL,
   - study_activity_id INTEGER NOT NULL,
   - quiz_id INTEGER, -- Optional, if the activity is a quiz
   - start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
   - end_time DATETIME,
   - FOREIGN KEY (study_session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
   - FOREIGN KEY (study_activity_id) REFERENCES study_activities(id) ON DELETE CASCADE,
   - FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE

6. **Quizzes** (`quizzes`): Stores metadata about quizzes
   - id INTEGER PRIMARY KEY AUTOINCREMENT,
   - study_activity_id INTEGER NOT NULL,
   - title TEXT NOT NULL,
   - description TEXT,
   - total_questions INTEGER NOT NULL,
   - created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   - FOREIGN KEY (study_activity_id) REFERENCES study_activities(id) ON DELETE CASCADE

7. **Quiz Questions** (`quiz_questions`): Stores quiz questions and their correct answers  
   - id INTEGER PRIMARY KEY AUTOINCREMENT,
   - quiz_id INTEGER NOT NULL,
   - question_text TEXT NOT NULL,
   - correct_answer TEXT NOT NULL,
   - FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
 
8. **Quiz Options** (`quiz_options`): Stores multiple-choice options for each question  
   - id INTEGER PRIMARY KEY AUTOINCREMENT,
   - question_id INTEGER NOT NULL,
   - option_text TEXT NOT NULL,
   - is_correct BOOLEAN NOT NULL, -- Indicates if this option is the correct answer
   - FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE

9.  **Quiz Results** (`quiz_results`): Stores results of quiz attempts
    - id INTEGER PRIMARY KEY AUTOINCREMENT,
    - session_activity_id INTEGER NOT NULL,
    - score INTEGER NOT NULL,
    - total_questions INTEGER NOT NULL,
    - completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    - FOREIGN KEY (session_activity_id) REFERENCES session_activities(id) ON DELETE CASCADE

10. **User Answers** (`user_answers`): Stores user-selected answers for quiz questions
    - id INTEGER PRIMARY KEY AUTOINCREMENT,
    - quiz_result_id INTEGER NOT NULL,
    - question_id INTEGER NOT NULL,
    - selected_option_id INTEGER NOT NULL,
    - is_correct BOOLEAN NOT NULL,
    - FOREIGN KEY (quiz_result_id) REFERENCES quiz_results(id) ON DELETE CASCADE,
    - FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    - FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE CASCADE

11. **User Practice Statistics** (`user_practice_statistics`):   
   - id INTEGER PRIMARY KEY AUTOINCREMENT,  
   - `session_id` (FK → study_sessions.id)  
   - `quiz_id` (FK → quizzes.id)  
   - `questions_attempted` (INT)  
   - `correct_answers` (INT)  
   - `created_at` (TIMESTAMP)  

## **API Endpoints**  

### **1. Study Session Management**  
- `POST /study-sessions/start` → Start a new study session  
- `POST /study-sessions/end/:session_id` → End the session and return overall progress  
- `GET /study-sessions/:session_id` → Get session details  

### **2. Study Activities & Quizzes**  
- `GET /study-activities` → Get all study activities  
- `GET /study-activities/:id/quizzes` → Get quizzes for a specific activity  
- `GET /quizzes/:quiz_id` → Get a quiz with its questions
- `POST/quizzes/{id}/start`	→ Start a quiz attempt { "study_session_id": 1 }  
- `POST /quizzes/:quiz_id/submit` → Submit answers and receive results { "answers": [ { "question_id": 1, "selected_option_id": 3 }, ... ] }  
- `GET /quizzes/:quiz_id/questions` → Get questions for a quiz  

### **3. Word & Word Groups** 
- `GET /words` → Get all words  
- `GET /word-groups` → Get all word groups  
- `GET /word-groups/:id/words` → Get words from a specific group  

### **4. User Practice Statistics**  
- `GET /study-sessions/:session_id/statistics` → Get quiz statistics for a session
- `GET /study-sessions/statistics` → Get overall practice statistics
  - Total words studied
  - Total words available
  - Mastery progress (percentage)

### Dashboard
The **dashboard API** will need to fetch data for the following sections:
- `GET /api/dashboard/last_study_session` → Fetch details of the last study session |
- `GET /api/dashboard/study_progress` → Get the total words studied and mastery progress |
- `GET /api/dashboard/quick-stats` → Get success rate, total study sessions, active groups, and study streak   

### Example Data Flow
- Start Session: POST /study-sessions
- Select Quiz: GET /quizzes
- Start Quiz: POST /quizzes/{id}/start
- Submit Answers: POST /quizzes/{id}/submit
- End Session: PUT /study-sessions/{id}/end