import streamlit as st
import re
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from crew_setup import create_arabic_grammar_crew
from utils import (
    parse_exercises_from_response,
    clean_response,
    format_arabic_text,
    extract_grammar_rules,
    add_transliteration,
)

# Load environment variables
load_dotenv()

# Set page configuration
st.set_page_config(
    page_title="Arabic Grammar Explainer",
    page_icon="🇸🇦",
    layout="wide",
    initial_sidebar_state="expanded",
)


# Add custom CSS
def add_custom_css():
    st.markdown(
        """
    <style>
        /* Import Arabic fonts */
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
        
        /* Force light mode and override dark mode */
        html, body, [data-testid="stAppViewContainer"] {
            background-color: white !important;
            color: #2c3e50 !important;
        }
        
        /* Ensure main content area is light */
        .main .block-container {
            background-color: white !important;
        }
        
        /* Override dark mode text colors */
        p, span, div, li, h1, h2, h3, h4, h5, h6 {
            color: #2c3e50 !important;
        }
        
        /* Sidebar background */
        [data-testid="stSidebar"] {
            background-color: #f5f7fa !important;
        }

        [data-testid="stBottomBlockContainer"] {
            background-color: #f5f7fa !important;
        }

        [data-testid="stHeader"] {
            background-color: #f5f7fa !important;
        }
        
        /* Styling for Arabic text */
        .arabic-text {
            font-family: 'Amiri', 'Traditional Arabic', serif;
            font-size: 24px;
            line-height: 1.8;
            direction: rtl;
            text-align: right;
            margin: 15px 0;
            padding: 15px;
            background-color: #f7f9fc;
            border-radius: 8px;
            border-right: 4px solid #4ac9df;
            color: #2c3e50 !important;
        }
        
        /* Main heading */
        h1 {
            color: #2c3e50 !important;
            font-weight: bold !important;
            font-size: 2.5rem !important;
        }
        
        /* Subheadings */
        h2, h3 {
            color: #4ac9df !important;
            font-weight: 600 !important;
        }
        
        /* Bullet points - make them visible on white background */
        ul {
            list-style-type: disc;
            color: #2c3e50 !important;
        }
        
        ul li {
            color: #2c3e50 !important;
            font-size: 1.1rem;
            line-height: 1.7;
            margin-bottom: 12px;
        }
        
        /* Styling for transliteration */
        .transliteration {
            font-style: italic;
            color: #34495e !important;
            margin-bottom: 12px;
            font-size: 16px;
        }
        
        /* Styling for example boxes */
        .example-box {
            border-left: 4px solid #4ac9df;
            padding: 12px 18px;
            margin: 18px 0;
            background-color: #eef5fd;
            border-radius: 8px;
            color: #2c3e50 !important;
        }
        
        /* Styling for rule boxes */
        .rule-box {
            border-left: 4px solid #f39c12;
            padding: 12px 18px;
            margin: 18px 0;
            background-color: #fef9e7;
            border-radius: 8px;
            color: #2c3e50 !important;
        }
        
        /* Styling for correct examples */
        .correct-example {
            color: #27ae60 !important;
            font-weight: bold;
        }
        
        /* Styling for incorrect examples */
        .incorrect-example {
            color: #e74c3c !important;
            text-decoration: line-through;
        }
        
        /* Topic buttons */
        .stButton > button {
            background-color: #4ac9df !important;
            border: 1px solid #2980b9 !important;
            color: white !important;
            transition: all 0.3s;
            margin-bottom: 6px;
            font-weight: 500;
            width: 100%;
        }
        
        .stButton > button:hover {
            background-color: #25b8d1 !important;
            border-color: #25b8d1 !important;
            transform: translateY(-2px);
        }
        
        /* Exercise styling */
        .exercise-container {
            background-color: #f7f9fc;
            padding: 18px;
            border-radius: 8px;
            margin: 24px 0;
            border-left: 4px solid #27ae60;
            color: #2c3e50 !important;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }
        
        /* Difficulty badges */
        .beginner-badge {
            background-color: #27ae60;
            color: white !important;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            margin-left: 6px;
            font-weight: 600;
        }
        
        .intermediate-badge {
            background-color: #f39c12;
            color: white !important;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            margin-left: 6px;
            font-weight: 600;
        }
        
        .advanced-badge {
            background-color: #e74c3c;
            color: white !important;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            margin-left: 6px;
            font-weight: 600;
        }
        
        /* Chat message styling */
        .chat-message {
            padding: 18px;
            border-radius: 8px;
            margin-bottom: 14px;
            color: #2c3e50 !important;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }
        
        .user-message {
            background-color: #eef5fd;
            border-left: 4px solid #4ac9df;
        }
        
        .assistant-message {
            background-color: #f7f9fc;
            border-left: 4px solid #9b59b6;
        }
        
        /* Input field styling */
        .stTextInput > div > div > input {
            border: 2px solid #bdc3c7;
            padding: 8px 12px;
            border-radius: 6px;
            color: #2c3e50 !important;
            background-color: white !important;
        }
        
        .stTextInput > div > div > input:focus {
            border-color: #4ac9df;
            box-shadow: 0 0 5px rgba(52, 152, 219, 0.5);
        }
        
        /* Success/Error messages */
        .stSuccess {
            background-color: #d4efdf !important;
            color: #27ae60 !important;
        }
        
        .stError {
            background-color: #f9ebea !important;
            color: #e74c3c !important;
        }
        
        /* Info box */
        .stInfo {
            background-color: #e8f4fd !important;
            color: #4ac9df !important;
        }
        
        /* Progress bars */
        .stProgress > div > div > div {
            background-color: #4ac9df !important;
        }
        
        /* Make sure sidebar text is readable */
        .sidebar .sidebar-content {
            background-color: #f5f7fa !important;
        }
        
        [data-testid="stSidebar"] h1, 
        [data-testid="stSidebar"] h2, 
        [data-testid="stSidebar"] h3, 
        [data-testid="stSidebar"] p, 
        [data-testid="stSidebar"] span, 
        [data-testid="stSidebar"] div {
            color: #2c3e50 !important;
        }
        
        /* Improve the main section welcome text */
        .main-welcome {
            background-color: #eef5fd;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 5px solid #4ac9df;
        }
        
        /* Specific fix for the welcome screen title */
        h1:contains("Welcome to Arabic Grammar Explainer") {
            color: #2c3e50 !important;
            font-size: 2.5rem !important;
            font-weight: bold !important;
        }
        
        /* Ensure all text in the main area is visible */
        .main .block-container p, 
        .main .block-container li, 
        .main .block-container div {
            color: #2c3e50 !important;
        }
    </style>
    """,
        unsafe_allow_html=True,
    )

def show_welcome_message():
    st.markdown(
        """
        <div class="main-welcome">
            <h1>Welcome to Arabic Grammar Explainer!</h1>
            <p style="font-size: 1.2rem; margin-bottom: 20px;">This app helps you learn Arabic grammar through:</p>
            <ul>
                <li>Step-by-step explanations of grammar concepts</li>
                <li>Interactive exercises to practice what you've learned</li>
                <li>Vocabulary building to expand your Arabic knowledge</li>
                <li>Spaced repetition to help you retain what you've learned</li>
            </ul>
            <h3>Getting Started</h3>
            <ol>
                <li>Select a grammar topic from the sidebar</li>
                <li>Ask questions or use our suggested questions</li>
                <li>Practice with exercises</li>
                <li>Track your progress</li>
            </ol>
            <h3>Choose a topic based on your level:</h3>
            <p><span style="color: #27ae60 !important; font-weight: bold;">Beginner</span>: Start with Arabic Alphabet, Definite Articles, or Gender</p>
            <p><span style="color: #f39c12 !important; font-weight: bold;">Intermediate</span>: Move on to Verb Conjugation and Sentence Structure</p>
            <p><span style="color: #e74c3c !important; font-weight: bold;">Advanced</span>: Dive deeper with Noun Cases and Verb Forms</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


# Call the function to add custom CSS
add_custom_css()

# Initialize session state
if "messages" not in st.session_state:
    st.session_state.messages = []

if "current_topic" not in st.session_state:
    st.session_state.current_topic = None

if "exercises" not in st.session_state:
    st.session_state.exercises = []

if "show_exercises" not in st.session_state:
    st.session_state.show_exercises = False

if "crew" not in st.session_state:
    st.session_state.crew = create_arabic_grammar_crew()

if "learning_progress" not in st.session_state:
    st.session_state.learning_progress = {}

if "last_activity_time" not in st.session_state:
    st.session_state.last_activity_time = datetime.now()

if "vocabulary" not in st.session_state:
    st.session_state.vocabulary = []

if "spaced_repetition" not in st.session_state:
    st.session_state.spaced_repetition = {"learned_concepts": {}, "review_schedule": {}}


# Function to add a word to vocabulary
def save_vocabulary_word(arabic_word, english_translation, example_sentence, topic):
    st.session_state.vocabulary.append(
        {
            "arabic": arabic_word,
            "english": english_translation,
            "example": example_sentence,
            "topic": topic,
            "date_added": datetime.now().date(),
        }
    )


# Function to update spaced repetition
def update_spaced_repetition(topic):
    today = datetime.now().date()

    # Add to learned concepts
    if topic not in st.session_state.spaced_repetition["learned_concepts"]:
        st.session_state.spaced_repetition["learned_concepts"][topic] = {
            "first_learned": today,
            "last_reviewed": today,
            "review_count": 0,
        }

    # Schedule next review based on spaced repetition algorithm
    # (1 day, 3 days, 7 days, 14 days, 30 days, etc.)
    review_intervals = [1, 3, 7, 14, 30, 60]
    review_count = st.session_state.spaced_repetition["learned_concepts"][topic][
        "review_count"
    ]
    interval = review_intervals[min(review_count, len(review_intervals) - 1)]

    next_review = today + timedelta(days=interval)
    st.session_state.spaced_repetition["review_schedule"][
        next_review.strftime("%Y-%m-%d")
    ] = topic


# Function to get difficulty badge
def get_difficulty_badge(topic):
    if topic in beginner_topics:
        return '<span class="beginner-badge">Beginner</span>'
    elif topic in intermediate_topics:
        return '<span class="intermediate-badge">Intermediate</span>'
    else:
        return '<span class="advanced-badge">Advanced</span>'


# Update learning progress
def update_learning_progress(
    topic, time_spent=0, exercises_completed=0, exercises_correct=0
):
    if topic not in st.session_state.learning_progress:
        st.session_state.learning_progress[topic] = {
            "lessons_completed": 0,
            "exercises_completed": 0,
            "exercises_correct": 0,
            "time_spent": 0,
            "last_studied": datetime.now().date(),
        }

    # Update progress data
    progress = st.session_state.learning_progress[topic]
    
    # Update exercise counts
    if exercises_completed > 0:
        progress["exercises_completed"] += exercises_completed
    
    # Only update correct answers if an exercise was actually completed
    # and ensure we're not adding more correct answers than completed exercises
    if exercises_correct > 0 and exercises_completed > 0:
        progress["exercises_correct"] += min(exercises_correct, exercises_completed)
    elif exercises_correct > 0 and exercises_completed == 0:
        # If only marking a correct answer (e.g., when checking an answer)
        # increment the completed count too to maintain proper ratio
        progress["exercises_completed"] += 1
        progress["exercises_correct"] += 1
    
    # Update time spent
    progress["time_spent"] += time_spent
    progress["last_studied"] = datetime.now().date()

    # If exercises were completed, increment lesson counter
    if exercises_completed > 0:
        progress["lessons_completed"] += 1

    # Also update spaced repetition
    update_spaced_repetition(topic)


# App title and description
st.title("🇸🇦 Arabic Grammar Explainer")
st.markdown(
    """
This interactive tool helps you learn Arabic grammar through simple explanations and practical examples.
Choose a grammar topic from the sidebar to get started!
"""
)

# Sidebar for topic selection
st.sidebar.title("Grammar Topics")

# Organize topics by difficulty
beginner_topics = [
    "Arabic Alphabet & Phonetics (الحروف والأصوات)",
    "Definite Article (ال)",
    "Gender: Masculine & Feminine (المذكر والمؤنث)",
    "Personal Pronouns (الضمائر الشخصية)",
    "Question Words (أدوات الاستفهام)",
]

intermediate_topics = [
    "Nominal vs. Verbal Sentences (الجمل الاسمية والفعلية)",
    "Past Tense Verb Conjugation (تصريف الفعل الماضي)",
    "Present Tense Verb Conjugation (تصريف الفعل المضارع)",
    "Attached Pronouns (Possession) (ضمائر الملكية المتصلة)",
    "Adjective-Noun Agreement (مطابقة الصفة والموصوف)",
    "Prepositions (حروف الجر)",
]

advanced_topics = [
    "Numbers & Counting Rules (الأرقام وقواعد العد)",
    "Verb Forms (أوزان)",
    "Noun Cases (إعراب)",
    "Dual and Plural Forms (المثنى والجمع)",
    "Definite and Indefinite (المعرفة والنكرة)",
]

# Display topics by difficulty level with badges
st.sidebar.subheader("Beginner")
for topic in beginner_topics:
    badge = get_difficulty_badge(topic)
    topic_label = f"{topic} {badge}"
    if st.sidebar.button(topic, key=f"btn_{topic}", use_container_width=True):
        st.session_state.current_topic = topic
        st.session_state.messages = []
        st.session_state.exercises = []
        st.session_state.messages.append(
            {
                "role": "assistant",
                "content": f"Let's learn about {topic}! What specific aspect would you like to understand?",
            }
        )
        # Reset last activity time
        st.session_state.last_activity_time = datetime.now()
        st.rerun()

st.sidebar.subheader("Intermediate")
for topic in intermediate_topics:
    badge = get_difficulty_badge(topic)
    topic_label = f"{topic} {badge}"
    if st.sidebar.button(topic, key=f"btn_{topic}", use_container_width=True):
        st.session_state.current_topic = topic
        st.session_state.messages = []
        st.session_state.exercises = []
        st.session_state.messages.append(
            {
                "role": "assistant",
                "content": f"Let's learn about **{topic}**! What specific aspect would you like to understand?",
            }
        )
        # Reset last activity time
        st.session_state.last_activity_time = datetime.now()
        st.rerun()

st.sidebar.subheader("Advanced")
for topic in advanced_topics:
    badge = get_difficulty_badge(topic)
    topic_label = f"{topic} {badge}"
    if st.sidebar.button(topic, key=f"btn_{topic}", use_container_width=True):
        st.session_state.current_topic = topic
        st.session_state.messages = []
        st.session_state.exercises = []
        st.session_state.messages.append(
            {
                "role": "assistant",
                "content": f"Let's learn about **{topic}**! What specific aspect would you like to understand?",
            }
        )
        # Reset last activity time
        st.session_state.last_activity_time = datetime.now()
        st.rerun()

# Show vocabulary section in sidebar
if st.session_state.vocabulary:
    st.sidebar.markdown("---")
    st.sidebar.subheader("Your Vocabulary")

    # Group by topic
    vocab_by_topic = {}
    for word in st.session_state.vocabulary:
        if word["topic"] not in vocab_by_topic:
            vocab_by_topic[word["topic"]] = []
        vocab_by_topic[word["topic"]].append(word)

    # Show expandable sections for each topic
    for topic, words in vocab_by_topic.items():
        with st.sidebar.expander(f"{topic} ({len(words)} words)"):
            for word in words:
                st.markdown(f"**{word['arabic']}** - {word['english']}")

# Display spaced repetition reminders
today = datetime.now().date().strftime("%Y-%m-%d")
if today in st.session_state.spaced_repetition["review_schedule"]:
    st.sidebar.markdown("---")
    st.sidebar.subheader("Review Reminder")
    topic_to_review = st.session_state.spaced_repetition["review_schedule"][today]
    st.sidebar.warning(f"Time to review: **{topic_to_review}**")

    if st.sidebar.button("Start Review"):
        st.session_state.current_topic = topic_to_review
        st.session_state.messages = []
        st.session_state.exercises = []
        st.session_state.messages.append(
            {
                "role": "assistant",
                "content": f"Let's review **{topic_to_review}**! What would you like to focus on?",
            }
        )
        # Update review count
        st.session_state.spaced_repetition["learned_concepts"][topic_to_review][
            "review_count"
        ] += 1
        st.session_state.spaced_repetition["learned_concepts"][topic_to_review][
            "last_reviewed"
        ] = datetime.now().date()
        # Remove from schedule
        del st.session_state.spaced_repetition["review_schedule"][today]
        st.rerun()

# Show selected topic
if st.session_state.current_topic:
    # Calculate time spent on this topic
    current_time = datetime.now()
    time_difference = (
        current_time - st.session_state.last_activity_time
    ).total_seconds() / 60  # Convert to minutes
    if time_difference < 60:  # Cap at 60 minutes to avoid counting inactive time
        update_learning_progress(
            st.session_state.current_topic, time_spent=time_difference
        )
    st.session_state.last_activity_time = current_time

    # Display current topic with badge
    badge = get_difficulty_badge(st.session_state.current_topic)
    st.markdown(
        f"## Currently Learning: **{st.session_state.current_topic}** {badge}",
        unsafe_allow_html=True,
    )

    # Show suggested questions for the selected topic
    st.markdown("### Suggested Questions")

    # Generate suggested questions based on the topic
    suggested_questions = {
        "Arabic Alphabet & Phonetics (الحروف والأصوات)": [
            "How are Arabic letters written and pronounced?",
            "What are the different forms of Arabic letters?",
            "How do vowels work in Arabic?",
        ],
        "Definite Article (ال)": [
            "How is the definite article used in Arabic?",
            "Are there any special rules for the definite article?",
            "How does the definite article change with different letters?",
        ],
        "Gender: Masculine & Feminine (المذكر والمؤنث)": [
            "How do I know if a word is masculine or feminine in Arabic?",
            "What are the rules for feminine endings?",
            "How do words change between masculine and feminine forms?",
        ],
        "Personal Pronouns (الضمائر الشخصية)": [
            "What are the personal pronouns in Arabic?",
            "How do pronouns change based on gender?",
            "How do I use pronouns in sentences?",
        ],
        "Question Words (أدوات الاستفهام)": [
            "What are the common question words in Arabic?",
            "How do I form questions in Arabic?",
            "Are there different rules for different types of questions?",
        ],
        "Nominal vs. Verbal Sentences (الجمل الاسمية والفعلية)": [
            "What's the difference between nominal and verbal sentences?",
            "How do I form a basic nominal sentence?",
            "When should I use each type of sentence?",
        ],
        "Past Tense Verb Conjugation (تصريف الفعل الماضي)": [
            "How do I conjugate verbs in the past tense?",
            "Are there irregular past tense verbs?",
            "How do past tense verbs change with different pronouns?",
        ],
        "Present Tense Verb Conjugation (تصريف الفعل المضارع)": [
            "How do I conjugate verbs in the present tense?",
            "What are the present tense prefixes and suffixes?",
            "How do present tense verbs change with different pronouns?",
        ],
        "Prepositions (حروف الجر)": [
            "What are the common prepositions in Arabic?",
            "How do prepositions affect the words that follow them?",
            "Can you give examples of prepositions in sentences?",
        ],
    }

    # Use default questions if none defined for this topic
    if st.session_state.current_topic not in suggested_questions:
        suggested_questions[st.session_state.current_topic] = [
            "Can you explain the basics of this topic?",
            "What are the most important rules to remember?",
            "How is this used in everyday Arabic conversation?",
        ]

    # Function to process user input with CrewAI
    def process_with_crew(user_input):
        st.session_state.messages.append({"role": "user", "content": user_input})

        # Display user message
        with st.chat_message("user"):
            st.markdown(
                f'<div class="chat-message user-message">{user_input}</div>',
                unsafe_allow_html=True,
            )

        # Process with CrewAI
        with st.spinner("The Arabic grammar tutor is thinking..."):
            # Track start time for processing
            start_time = time.time()

            # Format task descriptions with the selected topic
            for task in st.session_state.crew.tasks:
                task.description = task.description.replace(
                    "{topic}", st.session_state.current_topic
                )

            # Get response from crew
            raw_response = st.session_state.crew.kickoff(
                inputs={
                    "topic": st.session_state.current_topic,
                    "user_query": user_input,
                    "conversation_history": st.session_state.messages,
                }
            )

            # Process the response
            # Get the raw response as a string first
            if hasattr(raw_response, 'result'):
                raw_response_str = str(raw_response.result)
            else:
                raw_response_str = str(raw_response)
                
            # Now clean the response
            cleaned_response = clean_response(raw_response_str)

            # Extract exercises if any - IMPORTANT: Extract from raw response before cleaning
            print(f"DEBUG APP: Extracting exercises from raw response")
            exercises = parse_exercises_from_response(raw_response_str)
            if exercises:
                print(f"DEBUG APP: Found {len(exercises)} exercises")
                # Store exercises in session state and mark as not revealed
                for exercise in exercises:
                    exercise["revealed"] = False
                st.session_state.exercises = exercises
                
                # Update progress with number of exercises
                update_learning_progress(
                    st.session_state.current_topic, exercises_completed=len(exercises)
                )
                
                # Log the first exercise for debugging
                if len(exercises) > 0:
                    print(f"DEBUG APP: First exercise question: {exercises[0]['question'][:100]}...")
                    print(f"DEBUG APP: First exercise answer: {exercises[0]['answer'][:100]}...")

            # Extract grammar rules if any
            grammar_rules = extract_grammar_rules(raw_response_str)

            # Add response to chat history
            st.session_state.messages.append(
                {"role": "assistant", "content": cleaned_response}
            )

            # Extract any Arabic vocabulary words for vocabulary builder
            arabic_pattern = r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+\s*-\s*([a-zA-Z\s]+)"
            vocab_matches = re.finditer(arabic_pattern, cleaned_response)

            for match in vocab_matches:
                arabic_word = match.group(0).split("-")[0].strip()
                english_translation = match.group(1).strip()

                # Only add if not already in vocabulary
                if not any(
                    word["arabic"] == arabic_word
                    for word in st.session_state.vocabulary
                ):
                    save_vocabulary_word(
                        arabic_word=arabic_word,
                        english_translation=english_translation,
                        example_sentence="",  # Could extract from context
                        topic=st.session_state.current_topic,
                    )

            # Debug information
            print(f"DEBUG APP: Raw response type: {type(raw_response).__name__}")
            print(f"DEBUG APP: Cleaned response length: {len(cleaned_response)}")
            print(f"DEBUG APP: Cleaned response preview: {cleaned_response[:300]}...")
            
            # Display response
            with st.chat_message("assistant"):
                # Add a clear lesson header
                st.markdown("## Arabic Grammar Lesson: " + st.session_state.current_topic)
                
                # Force display of the raw response if cleaned response is empty
                if len(cleaned_response.strip()) < 50:
                    print("DEBUG APP: Cleaned response too short, using raw response")
                    # Try to get the raw response as a string
                    if hasattr(raw_response, 'result'):
                        display_content = str(raw_response.result)
                    else:
                        display_content = str(raw_response)
                else:
                    display_content = cleaned_response
                
                # Display the main lesson content
                st.markdown(
                    f'<div class="chat-message assistant-message">{display_content}</div>',
                    unsafe_allow_html=True,
                )

                # Display grammar rules in a structured way if available
                if grammar_rules:
                    st.markdown("### Grammar Rules")
                    for i, rule in enumerate(grammar_rules):
                        with st.expander(f"Rule {i+1}", expanded=(i == 0)):
                            st.markdown(rule["rule"])
                            if rule["example"]:
                                st.markdown("**Example:**")
                                st.markdown(
                                    format_arabic_text(rule["example"]),
                                    unsafe_allow_html=True,
                                )

            # Calculate processing time
            processing_time = time.time() - start_time
            st.session_state.last_activity_time = datetime.now()

    # Display suggestion buttons
    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button(
            suggested_questions[st.session_state.current_topic][0],
            use_container_width=True,
        ):
            process_with_crew(suggested_questions[st.session_state.current_topic][0])
            st.rerun()

    with col2:
        if st.button(
            suggested_questions[st.session_state.current_topic][1],
            use_container_width=True,
        ):
            process_with_crew(suggested_questions[st.session_state.current_topic][1])
            st.rerun()

    with col3:
        if st.button(
            suggested_questions[st.session_state.current_topic][2],
            use_container_width=True,
        ):
            process_with_crew(suggested_questions[st.session_state.current_topic][2])
            st.rerun()

    # Display chat messages
    st.markdown("### Conversation")
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            if message["role"] == "user":
                st.markdown(
                    f'<div class="chat-message user-message">{message["content"]}</div>',
                    unsafe_allow_html=True,
                )
            else:
                st.markdown(
                    f'<div class="chat-message assistant-message">{message["content"]}</div>',
                    unsafe_allow_html=True,
                )

    # User input for custom questions
    user_input = st.chat_input("Ask a question about this grammar topic...")

    if user_input:
        process_with_crew(user_input)
        st.rerun()

    # Display exercises only after the user has read the introduction and explicitly chooses to see them
    if st.session_state.exercises:
        st.markdown("---")
        
        # Add a button to show exercises only after reading the introduction
        if "show_exercises" not in st.session_state:
            st.session_state.show_exercises = False
            
        if not st.session_state.show_exercises:
            # Create a visually distinct card for exercises notification
            with st.container():
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.info("📝 Practice exercises are available for this topic!")
                with col2:
                    if st.button("Show exercises", use_container_width=True):
                        st.session_state.show_exercises = True
                        st.rerun()
        else:
            # Create a visually distinct section for exercises
            st.subheader("📝 Practice Exercises")
            st.markdown("<div style='background-color:#f0f2f6;padding:15px;border-radius:10px;margin-bottom:20px;'>"
                        "<h4>Let's practice what you've learned:</h4>"
                        "</div>", unsafe_allow_html=True)

        # Only show exercises if the user has clicked the button
        if st.session_state.get("show_exercises", False):
            # Generate a unique identifier for this session to avoid key conflicts
            if "exercise_session_id" not in st.session_state:
                st.session_state.exercise_session_id = int(time.time())
                
            for i, exercise in enumerate(st.session_state.exercises):
                # Create a unique key for this exercise using session ID and index
                exercise_key = f"{st.session_state.exercise_session_id}_{i}"
                st.markdown(f"<div class='exercise-container'>", unsafe_allow_html=True)
                st.markdown(f"### Exercise {i+1}")

                # Format the question with proper RTL for Arabic text
                question_text = exercise["question"]
                
                # Split the question into lines (for multiple choice questions)
                question_lines = question_text.split('\n')
                
                # The first line is the question stem
                question_stem = question_lines[0].strip()
                
                # Format any Arabic text in the question stem
                if any(ord(c) > 127 for c in question_stem):
                    arabic_pattern = r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+"
                    arabic_matches = re.finditer(arabic_pattern, question_stem)
                    for match in arabic_matches:
                        arabic_text = match.group(0)
                        formatted_arabic = format_arabic_text(arabic_text)
                        question_stem = question_stem.replace(arabic_text, formatted_arabic)
                
                # Display the question stem
                st.markdown(question_stem, unsafe_allow_html=True)
                
                # Check if this is a multiple choice question (has more than one line)
                if len(question_lines) > 1:
                    # Display each option on a separate line
                    for i in range(1, len(question_lines)):
                        option_text = question_lines[i].strip()
                        if not option_text:  # Skip empty lines
                            continue
                            
                        # Format any Arabic text in the option
                        if any(ord(c) > 127 for c in option_text):
                            arabic_pattern = r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+"
                            arabic_matches = re.finditer(arabic_pattern, option_text)
                            for arabic_match in arabic_matches:
                                arabic_text = arabic_match.group(0)
                                formatted_arabic = format_arabic_text(arabic_text)
                                option_text = option_text.replace(arabic_text, formatted_arabic)
                        
                        # Display the option with a line break after it
                        st.markdown(f"<div style='margin-bottom:10px;'>{option_text}</div>", unsafe_allow_html=True)

                # User input for exercise answer if not revealed
                if not exercise.get("revealed", False):
                    user_answer = st.text_input("Your answer:", key=f"answer_{exercise_key}")

                    col1, col2 = st.columns([1, 3])
                    with col1:
                        if st.button("Check Answer", key=f"check_{exercise_key}"):
                            exercise["user_answer"] = user_answer
                            exercise["revealed"] = True
                            st.rerun()
                    with col2:
                        if st.button("Show Solution", key=f"reveal_{exercise_key}"):
                            exercise["revealed"] = True
                            st.rerun()

                # Show answer and explanation if revealed
                if exercise.get("revealed", False):
                    st.markdown("#### Answer")

                    # Format the answer with proper RTL for Arabic text
                    answer_text = exercise["answer"]
                    if any(ord(c) > 127 for c in answer_text):
                        st.markdown(format_arabic_text(answer_text), unsafe_allow_html=True)
                    else:
                        st.markdown(answer_text)

                    st.markdown("#### Explanation")
                    st.markdown(exercise["explanation"])

                    # If user provided an answer, show feedback
                    if exercise.get("user_answer"):
                        user_answer = exercise.get("user_answer")
                        correct_answer = exercise["answer"]

                        # Simple check if the user's answer contains the correct answer or vice versa
                        if (
                            user_answer.lower() in correct_answer.lower()
                            or correct_answer.lower() in user_answer.lower()
                        ):
                            st.success("Your answer is correct! 🎉")
                            # Update progress with correct answer
                            update_learning_progress(
                                st.session_state.current_topic, exercises_correct=1
                            )
                        else:
                            st.error(
                                "Your answer needs some work. Review the explanation above."
                            )

                st.markdown("</div>", unsafe_allow_html=True)
else:
    # No topic selected yet
    st.info("👈 Please select a grammar topic from the sidebar to begin learning")

    # Show a welcome message with app features
    show_welcome_message()
    

# Learning progress in sidebar
if st.session_state.current_topic:
    st.sidebar.markdown("---")
    st.sidebar.subheader("Your Learning")

    # Initialize progress for current topic if not exists
    if st.session_state.current_topic not in st.session_state.learning_progress:
        st.session_state.learning_progress[st.session_state.current_topic] = {
            "lessons_completed": 0,
            "exercises_completed": 0,
            "exercises_correct": 0,
            "time_spent": 0,
            "last_studied": datetime.now().date(),
        }

    # Check if we have a snapshot for this topic (after Save Progress was clicked)
    use_snapshot = False
    if "progress_snapshot" in st.session_state and st.session_state.current_topic in st.session_state.progress_snapshot:
        progress = st.session_state.progress_snapshot[st.session_state.current_topic]
        use_snapshot = True
    else:
        # Use the current progress data
        progress = st.session_state.learning_progress[st.session_state.current_topic]
    
    # Display progress
    st.sidebar.markdown(f"**Topic:** {st.session_state.current_topic}")
    st.sidebar.markdown(f"**Lessons completed:** {progress['lessons_completed']}")
    st.sidebar.markdown(f"**Exercises attempted:** {progress['exercises_completed']}")
    st.sidebar.markdown(f"**Time spent:** {progress['time_spent']:.1f} minutes")

    if progress["exercises_completed"] > 0:
        # Ensure exercises_correct doesn't exceed exercises_completed
        corrected_count = min(progress["exercises_correct"], progress["exercises_completed"])
        
        # Calculate accuracy based on the corrected count
        accuracy = (corrected_count / progress["exercises_completed"]) * 100
        
        # Ensure accuracy is between 0 and 100%
        accuracy = min(accuracy, 100.0)
        
        st.sidebar.markdown(f"**Accuracy:** {accuracy:.1f}%")

        # Progress bar - value is already guaranteed to be between 0 and 1
        progress_value = accuracy / 100
        st.sidebar.progress(progress_value)

    # Add a "Save my progress" button
    if st.sidebar.button("Save Progress"):
        # Create a snapshot of the current progress to prevent accumulation on multiple clicks
        if "progress_snapshot" not in st.session_state:
            st.session_state.progress_snapshot = {}
            
        # Store a snapshot of the current progress
        st.session_state.progress_snapshot[st.session_state.current_topic] = {
            "lessons_completed": progress["lessons_completed"],
            "exercises_completed": progress["exercises_completed"],
            "exercises_correct": progress["exercises_correct"],
            "time_spent": progress["time_spent"],
            "last_studied": progress["last_studied"],
        }
        
        st.sidebar.success("Progress saved successfully!")

    # Add reset progress button
    if st.sidebar.button("Reset Progress"):
        # Clear both the actual progress and any snapshot
        if st.session_state.current_topic in st.session_state.learning_progress:
            del st.session_state.learning_progress[st.session_state.current_topic]
            
        # Also clear the snapshot if it exists
        if "progress_snapshot" in st.session_state and st.session_state.current_topic in st.session_state.progress_snapshot:
            del st.session_state.progress_snapshot[st.session_state.current_topic]
            
        st.sidebar.error("Progress reset for this topic")
        st.rerun()