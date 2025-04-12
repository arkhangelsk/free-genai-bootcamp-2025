# =============================================================================
# IMPORTS
# =============================================================================
import os
import tempfile
from difflib import SequenceMatcher
import streamlit as st
import numpy as np
import cv2
import pytesseract
from PIL import Image


# =============================================================================
# CONFIGURATION
# =============================================================================
# Set page configuration
st.set_page_config(
    page_title="Arabic Learning Portal",
    page_icon="🇦🇪", 
    layout="wide",
    initial_sidebar_state="expanded"
)

# =============================================================================
# DATA
# =============================================================================
def load_word_groups():
    """Load categorized Arabic phrases with English translations."""
    return {
        "Greetings": [
            {"english": "Hello, how are you?", "arabic": "مرحبًا، كيف حالك؟"},
            {"english": "Good morning", "arabic": "صباح الخير"},
            {"english": "Good evening", "arabic": "مساء الخير"},
            {"english": "Welcome", "arabic": "أهلاً وسهلاً"},
            {"english": "Thank you", "arabic": "شكراً لك"},
        ],
        "Food": [
            {"english": "I want to eat bread", "arabic": "أريد أن آكل الخبز"},
            {"english": "The food is delicious", "arabic": "الطعام لذيذ"},
            {"english": "I like coffee", "arabic": "أحب القهوة"},
            {"english": "This restaurant is good", "arabic": "هذا المطعم جيد"},
            {"english": "I am hungry", "arabic": "أنا جائع"},
        ],
        "Family": [
            {"english": "This is my father", "arabic": "هذا أبي"},
            {"english": "My mother is kind", "arabic": "أمي طيبة"},
            {"english": "I have two brothers", "arabic": "لدي أخوان"},
            {"english": "My sister is a doctor", "arabic": "أختي طبيبة"},
            {"english": "My family is big", "arabic": "عائلتي كبيرة"},
        ],
        "Travel": [
            {"english": "Where is the hotel?", "arabic": "أين الفندق؟"},
            {"english": "I want to go to the market", "arabic": "أريد أن أذهب إلى السوق"},
            {"english": "The airport is far", "arabic": "المطار بعيد"},
            {"english": "How much is the ticket?", "arabic": "كم ثمن التذكرة؟"},
            {"english": "I need a taxi", "arabic": "أحتاج إلى سيارة أجرة"},
        ],
    }


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================
def is_diacritic(char):
    """Check if a character is an Arabic diacritic."""
    diacritics = ["َ", "ً", "ُ", "ٌ", "ِ", "ٍ", "ْ", "ّ", "ٰ"]
    return char in diacritics


def evaluate_arabic_text(user_text, correct_text):
    """
    Evaluate similarity between user's text and correct Arabic text.
    
    Returns:
        tuple: (feedback_message, similarity_score)
    """
    similarity = SequenceMatcher(None, user_text, correct_text).ratio()
    
    if similarity >= 0.9:
        return "Excellent! Your answer is correct.", similarity
    elif similarity >= 0.7:
        return "Good job! Your answer is mostly correct.", similarity
    elif similarity >= 0.5:
        return "Nice try! Your answer is partially correct.", similarity
    else:
        return "Keep practicing! Your answer needs improvement.", similarity


# =============================================================================
# IMAGE PROCESSING
# =============================================================================
def process_image(image):
    """
    Process an image to extract Arabic text using OCR.
    
    Args:
        image: Can be file path, PIL Image, or numpy array
        
    Returns:
        str: Extracted Arabic text
    """
    try:
        # Handle different input types
        if isinstance(image, str) and os.path.isfile(image):
            img = cv2.imread(image)
            if img is None:
                st.error(f"Failed to read image from {image}")
                return ""
        elif isinstance(image, Image.Image):
            img_array = np.array(image.convert("RGB"))
            img = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        elif isinstance(image, np.ndarray):
            if len(image.shape) == 3 and image.shape[2] == 3:
                img = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            elif len(image.shape) == 3 and image.shape[2] == 4:
                img = cv2.cvtColor(image[:, :, :3], cv2.COLOR_RGB2BGR)
            elif len(image.shape) == 2:
                img = image
            else:
                st.error(f"Unsupported image format with shape {image.shape}")
                return ""
        else:
            st.error(f"Unsupported image type: {type(image)}")
            return ""

        # Convert to grayscale if needed
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

        # Apply preprocessing
        _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)
        kernel = np.ones((2, 2), np.uint8)
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        binary = cv2.dilate(binary, kernel, iterations=1)

        # Save to temp file for OCR
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp:
            temp_filename = temp.name
            cv2.imwrite(temp_filename, binary)

        # Perform OCR with Arabic language
        text = pytesseract.image_to_string(temp_filename, lang="ara")
        os.unlink(temp_filename)

        return text.strip()
    except Exception as e:
        st.error(f"Error processing image: {str(e)}")
        return ""


# =============================================================================
# STATE MANAGEMENT
# =============================================================================
def initialize_session_state():
    """Initialize or reset all session state variables."""
    defaults = {
        "current_sentence_idx": 0,
        "current_group": "Greetings",
        "correct_count": 0,
        "total_attempts": 0,
        "user_text": "",
    }
    
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def add_char(char):
    """Add a character to the user's text."""
    st.session_state.user_text += char


def add_diacritic(diacritic):
    """Add a diacritic to the last character of the user's text."""
    if st.session_state.user_text:
        chars = list(st.session_state.user_text)
        chars[-1] = chars[-1] + diacritic
        st.session_state.user_text = "".join(chars)


def backspace():
    """Remove the last character from the user's text."""
    if st.session_state.user_text:
        st.session_state.user_text = st.session_state.user_text[:-1]


def clear_text():
    """Clear the user's text."""
    st.session_state.user_text = ""


def update_progress(is_correct):
    """Update the user's progress statistics."""
    st.session_state.total_attempts += 1
    if is_correct:
        st.session_state.correct_count += 1


def new_sentence():
    """Move to the next sentence in the current group."""
    word_groups = load_word_groups()
    st.session_state.current_sentence_idx = (
        st.session_state.current_sentence_idx + 1
    ) % len(word_groups[st.session_state.current_group])
    st.session_state.user_text = ""


def change_group():
    """Handle group selection change."""
    st.session_state.current_sentence_idx = 0
    st.session_state.user_text = ""


def reset_progress():
    """Reset the user's progress statistics."""
    st.session_state.correct_count = 0
    st.session_state.total_attempts = 0


# =============================================================================
# UI COMPONENTS
# =============================================================================
def display_arabic_keyboard():
    """Display the interactive Arabic keyboard with tabs."""
    keyboard_tab1, keyboard_tab2, keyboard_tab3 = st.tabs(
        ["Letters", "Diacritics", "Punctuation"]
    )

    with keyboard_tab1:
        # Arabic letters keyboard
        keyboard_layout = [
            ["ر", "ذ", "د", "خ", "ح", "ج", "ث", "ت", "ب", "ا"],
            ["ف", "غ", "ع", "ظ", "ط", "ض", "ص", "ش", "س", "ز"],
            ["ة", "ء", "ي", "و", "ه", "ن", "م", "ل", "ك", "ق"],
            ["آ", "إ", "أ", "ؤ", "ئ", "ى", "لا", " "],
        ]
        
        for row in keyboard_layout:
            cols = st.columns(len(row))
            for i, char in enumerate(row):
                with cols[i]:
                    if st.button(char, key=f"key_{char}"):
                        add_char(char)
                        st.rerun()

    with keyboard_tab2:
        # Arabic diacritics keyboard
        diacritics_layout = [
            ["َ", "ً", "ُ", "ٌ", "ِ", "ٍ", "ْ", "ّ"],
            ["ٰ", "ٱ", "ـ"]
        ]
        
        for row in diacritics_layout:
            cols = st.columns(len(row))
            for i, char in enumerate(row):
                with cols[i]:
                    if st.button(char, key=f"diacritic_{char}"):
                        add_diacritic(char)
                        st.rerun()
        
        # Diacritics guide
        st.markdown("""
        ### Diacritics Guide
        - **َ** (Fatha): Short "a" sound
        - **ً** (Fathatain): "-an" sound
        - **ُ** (Damma): Short "u" sound
        - **ٌ** (Dammatain): "-un" sound
        - **ِ** (Kasra): Short "i" sound
        - **ٍ** (Kasratain): "-in" sound
        - **ْ** (Sukun): No vowel
        - **ّ** (Shadda): Doubles the consonant
        """)

    with keyboard_tab3:
        # Punctuation keyboard
        punctuation_layout = [
            ["،", ".", "؟", "!", ":", ";", "-", "_"],
            ["(", ")", "[", "]", "{", "}", "«", "»", '"', "'"],
        ]
        
        for row in punctuation_layout:
            cols = st.columns(len(row))
            for i, char in enumerate(row):
                with cols[i]:
                    if st.button(char, key=f"punctuation_{char}"):
                        add_char(char)
                        st.rerun()
        
        # Punctuation guide
        st.markdown("""
        ### Punctuation Guide
        - **،** : Arabic comma
        - **؟** : Arabic question mark
        - **!** : Exclamation mark
        - **«»** : Arabic quotation marks
        """)


def display_text_comparison(user_text, correct_text):
    """
    Display a visual comparison between user's text and correct text.
    
    Args:
        user_text (str): User's input text
        correct_text (str): Correct Arabic text
    """
    # Evaluate the text
    feedback, score = evaluate_arabic_text(user_text, correct_text)
    
    # Display feedback
    st.markdown(f"**Feedback:** {feedback}")
    st.progress(score)
    
    # Update progress
    is_correct = score >= 0.9
    update_progress(is_correct)
    
    # Show correct answer with breakdown
    with st.expander("See correct answer"):
        st.markdown(f"**Correct Arabic:** {correct_text}")
        st.markdown("#### Character breakdown:")
        
        # Highlight diacritics in red
        chars_html = "".join(
            f'<span style="color:red;font-weight:bold;">{char}</span>' 
            if is_diacritic(char) else char 
            for char in correct_text
        )
        
        st.markdown(
            f'<div dir="rtl" style="font-size:24px;margin:15px 0;">{chars_html}</div>',
            unsafe_allow_html=True,
        )


def display_handwriting_analysis(image, correct_text):
    """
    Process and display analysis of handwritten Arabic text.
    
    Args:
        image: Uploaded image file
        correct_text (str): Correct Arabic text to compare against
    """
    st.markdown("### Your Handwritten Text:")
    st.image(image, caption="Uploaded image", width=400)
    
    with st.spinner("Processing image..."):
        try:
            # Save to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
                temp_filename = temp_file.name
                image.save(temp_filename)
            
            # Process with OCR
            extracted_text = process_image(temp_filename)
            os.unlink(temp_filename)
            
            # Display results
            if extracted_text:
                st.success("OCR Processing Complete!")
                st.markdown("### Detected Text:")
                st.markdown(
                    f'<div dir="rtl" style="font-size:24px;margin:15px 0;">{extracted_text}</div>',
                    unsafe_allow_html=True
                )
                
                # Compare with correct text
                if correct_text:
                    display_text_comparison(extracted_text, correct_text)
            else:
                st.warning("Could not extract text. Please try with clearer writing.")
                st.markdown("""
                **Tips for better recognition:**
                - Write larger and clearer
                - Use strong, continuous strokes
                - Ensure high contrast
                - Try simpler words first
                """)
        except Exception as e:
            st.error(f"Error processing image: {str(e)}")


# =============================================================================
# MAIN APPLICATION
# =============================================================================
def main():
    """Main application function."""
    # Initialize session state
    initialize_session_state()
    
    # Application title and description
    st.title("🎓 Arabic Learning Portal")
    st.markdown("""
    Practice writing Arabic sentences with instant feedback. This interactive tool helps you:
    - Learn common Arabic phrases
    - Practice writing with an Arabic keyboard
    - Get feedback on your handwriting
    - Track your progress
    """)
    st.markdown("---")

    # Load word groups
    word_groups = load_word_groups()
    
    # Navigation controls
    with st.container():
        nav_col1, nav_col2 = st.columns([3, 1])
        
        with nav_col1:
            # Group selection
            previous_group = st.session_state.current_group
            selected_group = st.selectbox(
                "Select Word Group",
                list(word_groups.keys()),
                index=list(word_groups.keys()).index(st.session_state.current_group),
                key="group_selector",
            )
            
            if selected_group != previous_group:
                st.session_state.current_group = selected_group
                change_group()
    
    # Get current sentence
    sentences = word_groups[st.session_state.current_group]
    current_sentence = sentences[st.session_state.current_sentence_idx]
    
    # Display current exercise
    st.subheader("📝 Translate this sentence to Arabic:")
    st.markdown(f"**{current_sentence['english']}**")
    
    # New sentence button
    if st.button("🔄 New Sentence", on_click=new_sentence):
        pass
    
    # Hint system
    with st.expander("❓ Need a hint?"):
        first_char = current_sentence["arabic"][0] if current_sentence["arabic"] else ""
        st.write(f"The sentence starts with: {first_char}...")
        word_count = len(current_sentence["arabic"].split())
        st.write(f"The sentence has {word_count} word(s).")

    # Create main tabs
    tab1, tab2 = st.tabs(["✍️ Type Translation", "📷 Upload Image"])

    with tab1:
        # Text input area
        st.markdown('<div dir="rtl">', unsafe_allow_html=True)
        user_input = st.text_area(
            "Type your Arabic translation here:",
            value=st.session_state.user_text,
            height=100,
            placeholder="اكتب الترجمة العربية هنا...",
            key="user_input_area",
        )
        st.markdown("</div>", unsafe_allow_html=True)

        # Update session state
        if user_input != st.session_state.user_text:
            st.session_state.user_text = user_input

        # Arabic keyboard
        st.markdown("### ⌨️ Arabic Keyboard")
        display_arabic_keyboard()

        # Text editing controls
        col1, col2 = st.columns(2)
        with col1:
            if st.button("⌫ Backspace", help="Remove last character"):
                backspace()
                st.rerun()
        with col2:
            if st.button("🗑️ Clear Text", help="Clear all text"):
                clear_text()
                st.rerun()

        # Check answer button
        if st.button("✅ Check Answer"):
            if st.session_state.user_text:
                display_text_comparison(st.session_state.user_text, current_sentence["arabic"])
            else:
                st.warning("Please enter your translation first.")
        
        # Progress display
        st.markdown("---")
        st.subheader("📊 Your Progress")
        accuracy = (
            0 if st.session_state.total_attempts == 0
            else (st.session_state.correct_count / st.session_state.total_attempts)
        )
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Accuracy", f"{accuracy:.0%}")
        with col2:
            st.write(f"Correct: {st.session_state.correct_count} / {st.session_state.total_attempts}")

    with tab2:
        # Image upload section
        st.markdown("""
        ### 📸 Upload Image of Arabic Text
        
        Upload an image of handwritten or printed Arabic text for evaluation.
        The system will analyze your writing and provide feedback.
        """)
        
        # Upload tips
        with st.expander("💡 Tips for Better Results"):
            st.markdown("""
            For best OCR results:
            1. Use high contrast (black text on white)
            2. Write clearly and at reasonable size
            3. Ensure good lighting
            4. Keep the image focused
            5. Avoid background noise
            """)

        # File uploader
        uploaded_file = st.file_uploader(
            "Choose an image file",
            type=["jpg", "jpeg", "png"],
            label_visibility="collapsed"
        )

        # Process uploaded image
        if uploaded_file is not None:
            image = Image.open(uploaded_file)
            if st.button("🔍 Process Image"):
                display_handwriting_analysis(image, current_sentence["arabic"])

    # Sidebar content
    with st.sidebar:
        st.title("ℹ️ Learning Resources")
        
        # Statistics
        st.subheader("📈 Your Statistics")
        accuracy = (
            0 if st.session_state.total_attempts == 0
            else (st.session_state.correct_count / st.session_state.total_attempts)
        )
        st.write(f"Correct: {st.session_state.correct_count} / {st.session_state.total_attempts}")
        st.progress(accuracy)
        
        # Reset button
        if st.button("🔄 Reset Progress", on_click=reset_progress):
            pass
        
        # About section
        st.markdown("---")
        st.subheader("ℹ️ About")
        st.markdown("""
        This Arabic Learning Portal helps you practice writing Arabic sentences.
        
        Made with ❤️ using Streamlit.
        """)


# =============================================================================
# ENTRY POINT
# =============================================================================
if __name__ == "__main__":
    main()