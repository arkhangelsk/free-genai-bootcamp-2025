from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
import os
import json
import uuid
import hashlib
from pathlib import Path
from gtts import gTTS
from vector_search import QuizVectorSearch

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Create necessary directories
os.makedirs("questions", exist_ok=True)
os.makedirs("audio_cache", exist_ok=True)
os.makedirs("static/audio", exist_ok=True)

class QuizManager:
    def __init__(self):
        self.active_quizzes = {}  # Store active quiz sessions
        
    def _generate_audio(self, arabic_text):
        """Generate audio for Arabic text using gTTS."""
        if not arabic_text:
            return ""
            
        try:
            # Create a unique filename based on text content
            text_hash = hashlib.md5(arabic_text.encode('utf-8')).hexdigest()
            filename = f"audio_{text_hash}.mp3"
            audio_dir = os.path.join("static", "audio")
            audio_path = os.path.join(audio_dir, filename)
            
            # Check if file already exists
            if os.path.exists(audio_path):
                return audio_path.replace("static/", "")
                
            # Create directory if it doesn't exist
            os.makedirs(audio_dir, exist_ok=True)
            
            # Generate audio using gTTS
            tts = gTTS(text=arabic_text, lang='ar', slow=False)
            tts.save(audio_path)
            
            print(f"Generated audio for: {arabic_text}")
            return audio_path.replace("static/", "")
        except Exception as e:
            print(f"Error generating audio: {e}")
            return ""
        
    def load_quiz(self, questions_file):
        """Load questions from a JSON file and prepare a quiz."""
        try:
            with open(questions_file, 'r', encoding='utf-8') as f:
                questions = json.load(f)
                
            quiz_id = str(hash(questions_file))
            self.active_quizzes[quiz_id] = {
                'questions': questions,
                'current_question': 0,
                'score': 0,
                'answers': [],
                'total_questions': len(questions)
            }
            return quiz_id
        except Exception as e:
            print(f"Error loading quiz: {e}")
            return None
            
    def get_current_question(self, quiz_id):
        """Get the current question for a quiz."""
        if quiz_id not in self.active_quizzes:
            return None
            
        quiz = self.active_quizzes[quiz_id]
        if quiz['current_question'] >= len(quiz['questions']):
            return None
            
        question = quiz['questions'][quiz['current_question']]
        # Prepare question data based on type
        
        # Ensure audio is available for the question
        if 'arabic_text' in question and question['arabic_text']:
            # Generate audio for Arabic text if not already available
            audio_path = self._generate_audio(question['arabic_text'])
            if audio_path:
                question['audio_path'] = audio_path
                
        # Include quiz mode information in the response
        question_data = {
            'index': quiz['current_question'],
            'total': quiz['total_questions'],
            'type': question['type'],
            'arabic_text': question['arabic_text'],
            'audio_path': question.get('audio_path', ''),
            'quiz_mode': quiz.get('quiz_mode', 'standard'),
            'auto_play': quiz.get('auto_play', False),
            'repeat_audio': quiz.get('repeat_audio', False),
            'slow_audio': quiz.get('slow_audio', False)
        }
        
        # Add type-specific fields
        if question['type'] == 'multiple_choice':
            question_data.update({
                'question': question.get('question', ''),
                'options': question.get('options', [])
            })
        elif question['type'] == 'true_false':
            question_data.update({
                'statement': question.get('statement', '')
            })
        elif question['type'] == 'fill_blank':
            question_data.update({
                'question': question.get('question', '')
            })
        return question_data
        
    def submit_answer(self, quiz_id, answer):
        """Submit an answer and get feedback."""
        if quiz_id not in self.active_quizzes:
            return None
            
        quiz = self.active_quizzes[quiz_id]
        if quiz['current_question'] >= len(quiz['questions']):
            return None
            
        current_q = quiz['questions'][quiz['current_question']]
        is_correct = False
        
        print(f'Processing answer: {answer} for question type: {current_q["type"]}')  # Debug log
        
        # Initialize the answers array if it doesn't exist
        if 'answers' not in quiz:
            quiz['answers'] = []
            
        # Add a placeholder for this answer
        quiz['answers'].append({
            'question_index': quiz['current_question'],
            'user_answer': answer,
            'is_correct': False
        })
        
        try:
            if current_q['type'] == 'multiple_choice':
                if 'correct_index' in current_q:
                    is_correct = int(answer) == current_q['correct_index']
                else:
                    print(f"Warning: Missing correct_index in multiple_choice question")
                    is_correct = False
                    
            elif current_q['type'] == 'true_false':
                # Convert string 'true'/'false' to boolean
                user_answer = answer.lower() == 'true'
                if 'is_true' in current_q:
                    correct_answer = current_q['is_true']
                    is_correct = user_answer == correct_answer
                    print(f'True/False - User answer: {user_answer}')
                    print(f'True/False - Correct answer: {correct_answer}')
                    print(f'True/False - Is correct? {is_correct}')
                else:
                    print(f"Warning: Missing is_true in true_false question")
                    is_correct = False
                    
            elif current_q['type'] == 'fill_blank':
                if 'answer' in current_q:
                    # Case-insensitive comparison and normalize whitespace
                    user_answer = ' '.join(answer.lower().strip().split())
                    correct_answer = ' '.join(current_q['answer'].lower().strip().split())
                    
                    # Check for exact match
                    is_correct = user_answer == correct_answer
                    
                    # Store original answer for display
                    quiz['answers'][-1]['original_answer'] = answer.strip()
                    
                    # Check for common mistakes and store feedback
                    if not is_correct:
                        try:
                            # Calculate similarity (how many words match)
                            user_words = set(user_answer.split())
                            correct_words = set(correct_answer.split())
                            common_words = user_words.intersection(correct_words)
                            similarity = len(common_words) / max(len(user_words), len(correct_words))
                            
                            # Store similarity for feedback
                            quiz['answers'][-1]['similarity'] = similarity
                            quiz['answers'][-1]['feedback'] = None
                            
                            # Check for specific common errors
                            if 'him' in user_answer and 'you' in correct_answer:
                                quiz['answers'][-1]['feedback'] = "You wrote 'him' instead of 'you'."
                            elif 'you' in user_answer and 'him' in correct_answer:
                                quiz['answers'][-1]['feedback'] = "You wrote 'you' instead of 'him'."
                            elif similarity > 0.7:  # More than 70% similar
                                quiz['answers'][-1]['feedback'] = "Your answer was very close to the correct one."
                        except Exception as e:
                            print(f"Error calculating similarity: {e}")
                else:
                    print(f"Warning: Missing answer in fill_blank question")
                    is_correct = False
        except Exception as e:
            print(f'Error processing answer: {e}')
            # Don't return None here, continue with the error handling
            
        # Update the existing answer record with the correct status
        quiz['answers'][-1]['is_correct'] = is_correct
        
        if is_correct:
            quiz['score'] += 1
            
        feedback = {
            'is_correct': is_correct,
            'correct_answer': self._get_correct_answer(current_q),
            'score': quiz['score'],
            'total': quiz['current_question'] + 1
        }
        
        quiz['current_question'] += 1
        
        # Check if quiz is complete
        if quiz['current_question'] >= len(quiz['questions']):
            feedback['quiz_complete'] = True
            feedback['final_score'] = {
                'correct': quiz['score'],
                'total': len(quiz['questions']),
                'percentage': (quiz['score'] / len(quiz['questions'])) * 100
            }
            
        return feedback
        
    def _get_correct_answer(self, question):
        """Get the correct answer in a human-readable format."""
        try:
            if question['type'] == 'multiple_choice':
                if 'correct_index' in question and 'options' in question and len(question['options']) > question['correct_index']:
                    return f"Option {question['correct_index'] + 1}: {question['options'][question['correct_index']]}"
                return "[Answer information not available]"
            elif question['type'] == 'true_false':
                if 'is_true' in question:
                    return 'True' if question['is_true'] else 'False'
                return "[Answer information not available]"
            elif question['type'] == 'fill_blank':
                if 'answer' in question:
                    return question['answer']
                return "[Answer information not available]"
        except Exception as e:
            print(f'Error getting correct answer: {e}')
            return "[Error retrieving answer]"
        return "[Unknown question type]"
        
    def get_quiz_summary(self, quiz_id):
        """Get a summary of the quiz results."""
        if quiz_id not in self.active_quizzes:
            return None
            
        quiz = self.active_quizzes[quiz_id]
        
        # Enhance the answers with question details and correct answers
        detailed_answers = []
        for answer in quiz['answers']:
            question_index = answer['question_index']
            if question_index < len(quiz['questions']):
                question = quiz['questions'][question_index]
                answer_detail = {
                    'question_index': question_index,
                    'arabic_text': question['arabic_text'],
                    'type': question['type'],
                    'user_answer': answer['user_answer'],
                    'is_correct': answer['is_correct'],
                }
                
                # Add any additional fields from the answer
                for key in answer:
                    if key not in answer_detail and key not in ['question_index', 'user_answer', 'is_correct']:
                        answer_detail[key] = answer[key]
                
                # Add type-specific details
                if question['type'] == 'multiple_choice':
                    answer_detail['question'] = question['question']
                    answer_detail['options'] = question['options']
                    answer_detail['correct_answer'] = question['options'][question['correct_index']]
                    answer_detail['correct_index'] = question['correct_index']
                    answer_detail['user_answer_text'] = question['options'][int(answer['user_answer'])] if answer['user_answer'].isdigit() and int(answer['user_answer']) < len(question['options']) else 'Invalid answer'
                elif question['type'] == 'true_false':
                    answer_detail['statement'] = question['statement']
                    answer_detail['correct_answer'] = 'True' if question['is_true'] else 'False'
                elif question['type'] == 'fill_blank':
                    answer_detail['question'] = question['question']
                    answer_detail['correct_answer'] = question['answer']
                
                detailed_answers.append(answer_detail)
        
        return {
            'score': quiz['score'],
            'total': len(quiz['questions']),
            'percentage': (quiz['score'] / len(quiz['questions'])) * 100,
            'answers': detailed_answers
        }

# Initialize quiz manager
quiz_manager = QuizManager()

# Initialize vector search for quizzes
vector_search = QuizVectorSearch()

# Index questions on startup
try:
    # Force reindexing to ensure all categories are properly indexed
    vector_search.index_questions(force_reindex=True)
except Exception as e:
    print(f"Error indexing questions: {e}")

def get_available_quizzes():
    """Get list of available quiz files with metadata."""
    quiz_files = []
    questions_dir = os.path.join(os.getcwd(), 'questions')
    
    if os.path.exists(questions_dir):
        for file in os.listdir(questions_dir):
            if file.endswith('.json'):
                file_path = os.path.join(questions_dir, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        questions = json.load(f)
                        quiz_files.append({
                            'id': file.replace('.json', ''),
                            'name': file.replace('.json', '').replace('_', ' ').replace('&', ' & ').title(),
                            'path': file_path,
                            'num_questions': len(questions)
                        })
                except Exception as e:
                    print(f'Error reading {file}: {e}')
    
    return sorted(quiz_files, key=lambda x: x['name'])

def create_custom_quiz(questions, quiz_mode='standard', auto_play=False, repeat_audio=False, slow_audio=False, question_language='english'):
    """Create a custom quiz from a list of questions."""
    # Generate a unique ID for the custom quiz
    quiz_id = str(uuid.uuid4())
    
    # Save the quiz in memory
    quiz_manager.active_quizzes[quiz_id] = {
        'questions': questions,
        'current_question': 0,
        'score': 0,
        'answers': [],
        'total_questions': len(questions),
        'quiz_mode': quiz_mode,
        'auto_play': auto_play,
        'repeat_audio': repeat_audio,
        'slow_audio': slow_audio,
        'question_language': question_language
    }
    
    return quiz_id

@app.route('/')
def index():
    """Main quiz page."""
    quizzes = get_available_quizzes()
    return render_template('index.html', quizzes=quizzes)

@app.route('/search_quiz', methods=['POST'])
def search_quiz():
    """Search for questions and create a custom quiz."""
    query = request.form.get('query')
    category = request.form.get('category')
    num_questions = int(request.form.get('num_questions', 5))
    
    # Get quiz mode parameters
    quiz_mode = request.form.get('quiz_mode', 'standard')
    auto_play = request.form.get('auto_play') == 'true'
    repeat_audio = request.form.get('repeat_audio') == 'true'
    slow_audio = request.form.get('slow_audio') == 'true'
    question_language = request.form.get('question_language', 'english')
    use_arabic_questions = question_language == 'arabic'
    
    print(f"Quiz mode: {quiz_mode}, Auto-play: {auto_play}, Repeat: {repeat_audio}, Slow: {slow_audio}, Question Language: {question_language}")
    
    if not query:
        return jsonify({'error': 'No search query provided'}), 400
    
    print(f"Search request - Query: '{query}', Category: '{category}', Num Questions: {num_questions}")
    
    # Search for questions manually instead of using vector search
    try:
        # Get all available quizzes
        quizzes = get_available_quizzes()
        all_questions = []
        
        # If category is specified, only search in that category
        if category and category.strip():
            # Find the quiz with the matching category
            quiz = next((q for q in quizzes if q['name'] == category), None)
            if quiz:
                with open(quiz['path'], 'r', encoding='utf-8') as f:
                    questions = json.load(f)
                    all_questions.extend(questions)
        else:
            # Search in all categories
            for quiz in quizzes:
                try:
                    with open(quiz['path'], 'r', encoding='utf-8') as f:
                        questions = json.load(f)
                        all_questions.extend(questions)
                except Exception as e:
                    print(f"Error loading {quiz['path']}: {e}")
        
        # Print all available categories for debugging
        print(f"Available categories: {[q['name'] for q in quizzes]}")
        
        # Special case for 'shopping' category
        if query.lower() == 'shopping':
            print("Special handling for shopping category")
            # Find the shopping quiz
            shopping_quiz = next((q for q in quizzes if q['id'].lower() == 'shopping'), None)
            if shopping_quiz:
                print(f"Found shopping quiz: {shopping_quiz['name']} with {shopping_quiz['num_questions']} questions")
                try:
                    with open(shopping_quiz['path'], 'r', encoding='utf-8') as f:
                        questions = json.load(f)
                        # Return all questions from the shopping category
                        selected_questions = questions[:num_questions]
                        if selected_questions:
                            quiz_id = create_custom_quiz(
                                selected_questions,
                                quiz_mode=quiz_mode,
                                auto_play=auto_play,
                                repeat_audio=repeat_audio,
                                slow_audio=slow_audio,
                                question_language=question_language
                            )
                            return jsonify({
                                'quiz_id': quiz_id,
                                'name': f'Shopping Quiz',
                                'num_questions': len(selected_questions),
                                'quiz_mode': quiz_mode
                            })
                except Exception as e:
                    print(f"Error loading shopping quiz: {e}")
        
        # Enhanced keyword matching
        query_words = query.lower().split()
        matched_questions = []
        
        for question in all_questions:
            # Check if any query word is in the question or answer
            question_text = question.get('question', '')
            statement = question.get('statement', '')
            answer = question.get('answer', '')
            options = ' '.join(question.get('options', []))
            arabic_text = question.get('arabic_text', '')
            
            # Include all text fields in the search
            text_to_search = (question_text + ' ' + statement + ' ' + answer + ' ' + 
                             options + ' ' + arabic_text).lower()
            
            # Also check if the query matches the category name
            match_count = sum(1 for word in query_words if word in text_to_search)
            
            if match_count > 0:
                # Add a score based on match count
                question['match_score'] = match_count
                matched_questions.append(question)
        
        # Sort by match score
        matched_questions.sort(key=lambda q: q.get('match_score', 0), reverse=True)
        
        # Limit to requested number of questions
        selected_questions = matched_questions[:num_questions]
        
        if not selected_questions:
            return jsonify({'error': 'No questions found for this topic'}), 404
        
        # Create a custom quiz with quiz mode parameters
        quiz_id = create_custom_quiz(
            selected_questions,
            quiz_mode=quiz_mode,
            auto_play=auto_play,
            repeat_audio=repeat_audio,
            slow_audio=slow_audio,
            question_language=question_language
        )
        
        quiz_name = f'Custom Quiz: {query.title()}'
        if category:
            quiz_name += f' ({category})'
            
        return jsonify({
            'quiz_id': quiz_id,
            'name': quiz_name,
            'num_questions': len(selected_questions),
            'quiz_mode': quiz_mode
        })
    except Exception as e:
        print(f"Error searching quiz: {e}")
        return jsonify({'error': f'Error creating quiz: {str(e)}'}), 500

@app.route('/start_quiz/<quiz_id>', methods=['POST'])
def start_quiz(quiz_id):
    """Start a new quiz from a quiz ID."""
    quizzes = get_available_quizzes()
    quiz = next((q for q in quizzes if q['id'] == quiz_id), None)
    
    if not quiz:
        return jsonify({'error': 'Quiz not found'}), 404
    
    # Get quiz mode parameters from request if available
    quiz_mode = request.form.get('quiz_mode', 'standard')
    auto_play = request.form.get('auto_play') == 'true'
    repeat_audio = request.form.get('repeat_audio') == 'true'
    slow_audio = request.form.get('slow_audio') == 'true'
    
    quiz_id = quiz_manager.load_quiz(quiz['path'])
    if not quiz_id:
        return jsonify({'error': 'Failed to load quiz'}), 500
    
    # Store quiz mode settings
    if quiz_id in quiz_manager.active_quizzes:
        quiz_manager.active_quizzes[quiz_id]['quiz_mode'] = quiz_mode
        quiz_manager.active_quizzes[quiz_id]['auto_play'] = auto_play
        quiz_manager.active_quizzes[quiz_id]['repeat_audio'] = repeat_audio
        quiz_manager.active_quizzes[quiz_id]['slow_audio'] = slow_audio
    
    return jsonify({
        'quiz_id': quiz_id,
        'name': quiz['name'],
        'num_questions': quiz['num_questions'],
        'quiz_mode': quiz_mode
    })

@app.route('/get_question/<quiz_id>')
def get_question(quiz_id):
    """Get the current question for a quiz."""
    try:
        question = quiz_manager.get_current_question(quiz_id)
        if not question:
            return jsonify({'error': 'Question not found'}), 404
        
        # Add quiz mode information to the response
        if quiz_id in quiz_manager.active_quizzes:
            quiz = quiz_manager.active_quizzes[quiz_id]
            question['quiz_mode'] = quiz.get('quiz_mode', 'standard')
            question['auto_play'] = quiz.get('auto_play', False)
            question['repeat_audio'] = quiz.get('repeat_audio', False)
            question['slow_audio'] = quiz.get('slow_audio', False)
        
        # Generate a unique audio ID based on the Arabic text
        arabic_text = question.get('arabic_text', '')
        if arabic_text:
            # Create a hash of the Arabic text to use as a filename
            text_hash = hashlib.md5(arabic_text.encode('utf-8')).hexdigest()
            audio_filename = f"{text_hash}.mp3"
            question['audio_url'] = f'/audio/{audio_filename}'
        
        return jsonify({
            'success': True,
            **question
        })
    except Exception as e:
        print(f"Error loading question: {e}")
        return jsonify({'error': f'Error loading question: {str(e)}'}), 500

@app.route('/submit_answer/<quiz_id>', methods=['POST'])
def submit_answer(quiz_id):
    """Submit an answer and get feedback."""
    answer = request.form.get('answer')
    if answer is None:
        return jsonify({'error': 'No answer provided'}), 400
        
    feedback = quiz_manager.submit_answer(quiz_id, answer)
    if not feedback:
        return jsonify({'error': 'Failed to submit answer'}), 500
        
    return jsonify(feedback)

@app.route('/submit_dictation/<quiz_id>', methods=['POST'])
def submit_dictation(quiz_id):
    """Submit a dictation answer (Arabic text that was heard)."""
    try:
        data = request.json
        if not data or 'user_answer' not in data:
            return jsonify({'error': 'No answer provided'}), 400
            
        user_answer = data.get('user_answer', '')
        correct_answer = data.get('correct_answer', '')
        is_correct = data.get('is_correct', False)
        
        # Get the current question
        if quiz_id not in quiz_manager.active_quizzes:
            return jsonify({'error': 'Quiz not found'}), 404
            
        quiz = quiz_manager.active_quizzes[quiz_id]
        if quiz['current_question'] >= len(quiz['questions']):
            return jsonify({'error': 'No more questions'}), 400
            
        current_q = quiz['questions'][quiz['current_question']]
        
        # Store the answer
        quiz['answers'].append({
            'question_index': quiz['current_question'],
            'user_answer': user_answer,
            'correct_answer': correct_answer,
            'is_correct': is_correct
        })
        
        # Update score
        if is_correct:
            quiz['score'] += 1
        
        return jsonify({
            'success': True,
            'is_correct': is_correct,
            'user_answer': user_answer,
            'correct_answer': correct_answer,
            'score': quiz['score'],
            'total': quiz['current_question'] + 1
        })
    except Exception as e:
        print(f"Error submitting dictation: {e}")
        return jsonify({'error': f'Error submitting dictation: {str(e)}'}), 500

@app.route('/quiz_summary/<quiz_id>')
def quiz_summary(quiz_id):
    """Get a summary of quiz results."""
    summary = quiz_manager.get_quiz_summary(quiz_id)
    if not summary:
        return jsonify({'error': 'Quiz not found'}), 404
    return jsonify(summary)

@app.route('/update_settings/<quiz_id>', methods=['POST'])
def update_settings(quiz_id):
    """Update quiz settings like repeat_audio and slow_audio."""
    try:
        if quiz_id not in quiz_manager.active_quizzes:
            return jsonify({'error': 'Quiz not found'}), 404
            
        data = request.json
        quiz = quiz_manager.active_quizzes[quiz_id]
        
        # Update settings if provided
        if 'quiz_mode' in data:
            quiz['quiz_mode'] = data['quiz_mode']
            
        if 'auto_play' in data:
            quiz['auto_play'] = data['auto_play']
            
        if 'repeat_audio' in data:
            quiz['repeat_audio'] = data['repeat_audio']
            
        if 'slow_audio' in data:
            quiz['slow_audio'] = data['slow_audio']
            
        return jsonify({
            'success': True,
            'quiz_mode': quiz.get('quiz_mode', 'standard'),
            'auto_play': quiz.get('auto_play', False),
            'repeat_audio': quiz.get('repeat_audio', False),
            'slow_audio': quiz.get('slow_audio', False)
        })
    except Exception as e:
        print(f"Error updating settings: {e}")
        return jsonify({'error': f'Error updating settings: {str(e)}'}), 500

@app.route('/audio/<path:filename>')
def serve_audio(filename):
    """Generate and serve audio for Arabic text."""
    try:
        # Check if the audio file already exists in cache
        audio_path = os.path.join('audio_cache', filename)
        if os.path.exists(audio_path):
            return send_file(audio_path, mimetype='audio/mpeg')
        
        # If not in cache, find the corresponding quiz question
        text_hash = filename.split('.')[0]  # Remove the .mp3 extension
        arabic_text = None
        
        # Search through all active quizzes for matching Arabic text
        for quiz_id, quiz in quiz_manager.active_quizzes.items():
            for question in quiz['questions']:
                question_hash = hashlib.md5(question['arabic_text'].encode('utf-8')).hexdigest()
                if question_hash == text_hash:
                    arabic_text = question['arabic_text']
                    break
            if arabic_text:
                break
        
        if not arabic_text:
            return jsonify({'error': 'Arabic text not found'}), 404
        
        # Generate audio using gTTS
        tts = gTTS(text=arabic_text, lang='ar', slow=False)
        tts.save(audio_path)
        
        return send_file(audio_path, mimetype='audio/mpeg')
    except Exception as e:
        print(f"Error generating audio: {e}")
        return jsonify({'error': f'Error generating audio: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)  # Use a different port from the main app
