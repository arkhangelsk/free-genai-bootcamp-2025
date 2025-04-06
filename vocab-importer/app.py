import streamlit as st
import openai
import json
import pandas as pd
import sqlite3
from datetime import datetime
import os
import pathlib
import requests

# Set page configuration with a custom theme
st.set_page_config(
    page_title="Arabic Vocabulary Generator",
    page_icon="🇸🇦",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Function to connect to SQLite database
def get_db_connection():
    conn = sqlite3.connect("db/words.db")
    conn.row_factory = sqlite3.Row
    return conn

# Load custom CSS
def load_css():
    css_file_path = os.path.join(os.path.dirname(__file__), "styles.css")
    try:
        with open(css_file_path, "r") as f:
            st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)
    except FileNotFoundError:
        # Fallback if the file doesn't exist
        st.warning(f"CSS file not found at {css_file_path}")

# Apply custom CSS
load_css()


# Function to get all groups from the database
def get_all_groups():
    try:
        conn = get_db_connection()
        groups = conn.execute("SELECT id, name FROM groups ORDER BY name").fetchall()
        conn.close()
        return groups
    except Exception as e:
        st.error(f"Database error: {str(e)}")
        return []

# App header
st.markdown(
    '<h1 style="text-align: left; margin-bottom: 1rem;">Arabic Vocabulary Generator</h1>',
    unsafe_allow_html=True
)

st.markdown(
    """
<div style="background-color: var(--intro-bg); padding: 15px; border-radius: 5px; margin-bottom: 20px; color: var(--text-color); border: 1px solid var(--border-color);">
<p style="margin: 0; font-size: 1.1em;">Generate Arabic vocabulary words with vowel marks (tashkeel), romanization, and example sentences using AI.</p>
</div>
""",
    unsafe_allow_html=True,
)

# Read API key from secrets
api_key = st.secrets["openai"]["api_key"]
model_name = "gpt-4-turbo"  # Default model

# Create two columns for layout
left_col, divider_col, right_col = st.columns([0.98, 0.04, 3])

# Left sidebar with instructions and groups
with divider_col:
    st.markdown(
        """
        <div style="width: 2px; background-color: var(--border-color); height: 100vh; margin: 0 auto;"></div>
        """,
        unsafe_allow_html=True
    )

with left_col:
    # Instructions panel
    st.markdown('<div class="panel">', unsafe_allow_html=True)
    st.markdown("### 📋 Instructions")
    st.markdown(
        """
    <div class="instructions">
    <ol>
        <li>Enter a vocabulary group name</li>
        <li>Select the number of words to generate</li>
        <li>Click "Generate Vocabulary"</li>
        <li>Download or save to database</li>
    </ol>
    </div>
    """,
        unsafe_allow_html=True,
    )
    st.markdown("</div>", unsafe_allow_html=True)

    # Groups panel
    st.markdown('<div class="panel">', unsafe_allow_html=True)
    st.markdown("### 📚 Existing Groups")

    # Get existing groups from database
    db_groups = get_all_groups()
    group_names = [group["name"] for group in db_groups]

    # Show existing groups in a collapsible section
    with st.expander(f"📋 View Existing Groups ({len(group_names)})" if group_names else "📋 View Groups", expanded=True):
        st.markdown('<div class="groups-list">', unsafe_allow_html=True)
        if group_names:
            for group in group_names:
                st.markdown(
                    f'<div class="group-item">{group}</div>', unsafe_allow_html=True
                )
        else:
            st.info("No groups found in database.")
        st.markdown('</div>', unsafe_allow_html=True)

        # Optional: Add counter for total groups
        if group_names:
            st.markdown(f"<div style='text-align: left; font-size: 0.8em; color: var(--text-color); margin-top: 5px;'>Total {len(group_names)} groups found in database.</div>", unsafe_allow_html=True)

# Main content
with right_col:
    # Generator panel
    st.markdown('<div class="panel">', unsafe_allow_html=True)
    st.markdown("### ✨ Generate Vocabulary")

    # Get available Ollama models
    def get_ollama_models():
        try:
            response = requests.get("http://localhost:11434/api/tags")
            if response.status_code == 200:
                models = response.json().get("models", [])
                return [f"ollama:{model['name']}" for model in models]
        except:
            return []
        return []

    # Model selection
    model_options = [
        "gpt-3.5-turbo",
        "gpt-4",
    ] + get_ollama_models()

    selected_model = st.selectbox(
        "Select Model", 
        model_options, 
        help="Choose OpenAI or local Ollama model"
    )

    # Get OpenAI API key from secrets for OpenAI models
    if not selected_model.startswith("ollama:"):
        openai_api_key = st.secrets.get("openai", {}).get("api_key", "")
    else:
        openai_api_key = None  # Not needed for Ollama

    # Input fields
    group_name = st.text_input(
        "Enter vocabulary group name",
        placeholder="e.g., Greetings, Food, Colors...",
    )
    word_count = st.slider("Number of words to generate", 1, 20, 5)

    # Show model info
    if selected_model.startswith("ollama:"):
        st.info(f"🤖 Using local Ollama model: {selected_model.split(':')[1]}")
    else:
        if not openai_api_key:
            st.error("⚠️ OpenAI API key not found in secrets.toml. Please add it under [openai] section.")
        else:
            st.info(f"🔑 Using OpenAI model: {selected_model}")

    # Generate button with styling
    st.markdown('<div class="generate-button">', unsafe_allow_html=True)
    generate_button = st.button(
        "Generate Vocabulary", 
        use_container_width=True,
        disabled=(not selected_model.startswith("ollama:") and not openai_api_key)
    )
    st.markdown("</div>", unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)


def generate_vocabulary_openai(prompt, api_key, model_name):
    """Generate vocabulary using OpenAI API"""
    try:
        client = openai.OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful Arabic language tutor. Please provide accurate Arabic vocabulary with proper diacritics, romanization, and English translations. Format your responses as valid JSON arrays.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=2000,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return None, None, f"OpenAI API Error: {str(e)}"

def generate_vocabulary_ollama(prompt, model_name):
    """Generate vocabulary using Ollama API"""
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model_name,
                "prompt": f"""You are a helpful Arabic language tutor. Please provide accurate Arabic vocabulary with proper diacritics, romanization, and English translations.
                Format your response as a valid JSON array.
                {prompt}
                Remember to return ONLY the JSON array without any additional text.""",
                "stream": False,
            },
        )
        response.raise_for_status()
        return response.json()["response"]
    except Exception as e:
        return None, None, f"Ollama API Error: {str(e)}"

def parse_llm_response(content):
    """Parse and clean LLM response to extract valid JSON"""
    import json
    import re
    try:
        # Try to find JSON content within the response
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            content = json_match.group(0)

        # Replace Python None with JSON null before parsing
        content = content.replace("None", "null").replace("none", "null")

        vocabulary = json.loads(content)
        return vocabulary, content, None
    except json.JSONDecodeError as e:
        # If there's still an error, try to clean up the JSON more aggressively
        try:
            # Clean up any Python-specific syntax
            cleaned_content = (
                content.replace("None", "null")
                .replace("True", "true")
                .replace("False", "false")
            )
            # Try to parse with a more lenient approach
            import ast
            parsed = ast.literal_eval(content)
            vocabulary = json.loads(json.dumps(parsed))
            return vocabulary, content, None
        except Exception:
            return None, content, f"Error parsing JSON: {str(e)}\n\nRaw response: {content}"

def generate_vocabulary(prompt, api_key, model_name):
    """Generate vocabulary using either OpenAI or Ollama"""
    # Determine which API to use based on model name
    if model_name.startswith("ollama:"):
        # Extract actual model name after 'ollama:' prefix
        ollama_model = model_name.split(":")[1]
        content = generate_vocabulary_ollama(prompt, ollama_model)
    else:
        if not api_key:
            return None, None, "OpenAI API key is required for OpenAI models"
        content = generate_vocabulary_openai(prompt, api_key, model_name)

    if isinstance(content, tuple) and len(content) == 3:
        return content  # Error case
    return parse_llm_response(content)


# Function to style dataframe
def style_dataframe(df):
    # Convert DataFrame to an HTML table with custom styling
    styled_html = f"""
    <div style="padding: 1rem; background: var(--card-bg); border-radius: 8px; margin: 1rem 0;">
        <table style="width:100%; border-collapse: collapse; background: var(--card-bg);">
            <thead>
                <tr style="background-color: var(--border-color); color: var(--text-color);">
                    <th style="padding: 12px 15px; border-top-right-radius: 8px;">Arabic</th>
                    <th style="padding: 12px 15px;">Romanized</th>
                    <th style="padding: 12px 15px; border-top-left-radius: 8px;">English</th>
                </tr>
            </thead>
            <tbody>
    """

    # Add rows with alternating colors
    for i, row in df.iterrows():
        bg_color = "var(--group-bg)" if i % 2 == 0 else "var(--card-bg)"
        styled_html += f"""
                <tr style="background-color: {bg_color};">
                    <td style="padding: 12px 15px; text-align: right; font-size: 1.2em; font-family: 'Noto Sans Arabic', 'Arial', sans-serif;">{row['arabic']}</td>
                    <td style="padding: 12px 15px; color: var(--text-color);">{row['romanized']}</td>
                    <td style="padding: 12px 15px; color: var(--text-color);">{row['english']}</td>
                </tr>
        """

    styled_html += """
            </tbody>
        </table>
    </div>
    """
    return styled_html


# Initialize session state
if "generated_vocabulary" not in st.session_state:
    st.session_state.generated_vocabulary = None
    st.session_state.raw_json = None
    st.session_state.db_insert_status = None
    st.session_state.db_insert_message = None
    st.session_state.last_group_name = None

if generate_button:
    if not group_name:
        with right_col:
            st.error("⚠️ Please enter a vocabulary group name")
    else:
        # Results section
        st.markdown('<div class="panel">', unsafe_allow_html=True)

        results_placeholder = st.empty()
        st.markdown("</div>", unsafe_allow_html=True)

        # Get or create group ID
        group_id = None

        # Check if group exists, if not add it
        group_exists = False
        for group in get_all_groups():
            if group["name"].lower() == group_name.lower():
                group_id = group["id"]
                group_exists = True
                break

        # Create prompt for OpenAI
        prompt = f"""Provide a list of {word_count} common Arabic vocabulary words used for {group_name}. Return ONLY the JSON response with the following structure:
                
        {{
        "arabic": "<Arabic word>",
        "romanized": "<Romanized pronunciation>",
        "english": "<English meaning>",
        "example": {{
            "arabic": "<Example sentence in Arabic>",
            "romanized": "<Romanized example sentence>",
            "english": "<English translation of the example sentence>"
        }},
        "group_id": {group_id if group_id is not None else "null"}
        }}
                
        Return the response as a valid JSON array. Do not include any additional text or explanations outside the JSON structure.
        Make sure to use proper JSON format with "null" (not None) for null values.
                
        Example:
        [
        {{
            "arabic": "مَرْحَبًا",
            "romanized": "Marhaban",
            "english": "Hello",
            "example": {{
            "arabic": "مرحبا، كيف حالك؟",
            "romanized": "Marhaban! Kayfa ḥāluka?",
            "english": "Hello, how are you?"
            }},
            "group_id": null
        }}
        ]
        """

        with right_col:
            with st.spinner("🔄 Generating vocabulary..."):
                vocabulary, raw_content, error = generate_vocabulary(
                    prompt, api_key, model_name
                )

                if error:
                    results_placeholder.error(f"❌ {error}")
                else:
                    st.session_state.generated_vocabulary = vocabulary
                    st.session_state.raw_json = raw_content

                    # Display the results with custom styling
                    df = pd.json_normalize(vocabulary)

                    # Create a styled results container
                    results_container = st.container()

                    with results_container:
                        # Show a nice title with word count
                        st.markdown(
                            f"<h3 style='color: var(--header-color);'>✨ Generated {len(vocabulary)} Arabic Words for '{group_name}'</h3>",
                            unsafe_allow_html=True,
                        )

                        vocabulary_df = []
                        for word in vocabulary:
                            vocabulary_df.append({
                                "Arabic": word.get('arabic', ''),
                                "Romanized": word.get('romanized', ''),
                                "English": word.get('english', '')
                            })

                        # Display using st.dataframe with styling
                        st.dataframe(
                            vocabulary_df,
                            use_container_width=True,
                            column_config={
                                "Arabic": st.column_config.TextColumn(
                                    "Arabic",
                                    help="Arabic word with diacritics",
                                    width="medium",
                                    # Removed the text_align parameter
                                ),
                                "Romanized": st.column_config.TextColumn(
                                    "Romanized",
                                    help="Transliteration into Latin alphabet",
                                    width="medium",
                                ),
                                "English": st.column_config.TextColumn(
                                    "English",
                                    help="English translation",
                                    width="medium",
                                ),
                            },
                            height=min(len(vocabulary) * 60 + 50, 400),
                        )

                        # Show examples in an expander
                        with st.expander("👀 View Example Sentences"):
                            for i, word in enumerate(vocabulary):
                                st.markdown(f"### {i+1}. {word.get('arabic', '')}")

                                example = word.get("example", {})
                                st.markdown("**Arabic:** " + example.get("arabic", ""))
                                st.markdown("**Romanized:** " + example.get("romanized", ""))
                                st.markdown("**English:** " + example.get("english", ""))

                                if i < len(vocabulary) - 1:
                                    st.markdown("---")

                        # Display raw JSON in collapsible section
                        with st.expander("🔍 View Raw JSON Response"):
                            st.code(raw_content, language="json")

# Show download button if vocabulary has been generated
if st.session_state.generated_vocabulary:
    with right_col:
        st.markdown('<div class="panel">', unsafe_allow_html=True)
        st.markdown("### 💾 Export Options")

        col1, col2 = st.columns([1, 1])

        with col1:
            # Export to JSON with styled button
            json_string = json.dumps(
                st.session_state.generated_vocabulary, ensure_ascii=False, indent=2
            )
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = (
                f"arabic_vocab_{group_name.lower().replace(' ', '_')}_{timestamp}.json"
            )

        with col1:
            # Function to save JSON to a specific folder
            def save_json_to_folder():
                json_string = json.dumps(
                    st.session_state.generated_vocabulary, ensure_ascii=False, indent=2
                )
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"arabic_vocab_{group_name.lower().replace(' ', '_')}_{timestamp}.json"
                
                # Create the directory if it doesn't exist
                save_dir = os.path.join(os.getcwd(), "db", "seeds")
                os.makedirs(save_dir, exist_ok=True)
                
                # Full path to save the file
                save_path = os.path.join(save_dir, filename)
                
                # Save the file
                try:
                    with open(save_path, 'w', encoding='utf-8') as f:
                        f.write(json_string)
                    return True, f"File saved to db/seeds/{filename}"
                except Exception as e:
                    return False, f"Error saving file: {str(e)}"

            st.markdown('<div class="download-button">', unsafe_allow_html=True)
            if st.button("💾 Save JSON to db/seeds", key="save_json_button"):
                success, message = save_json_to_folder()
                if success:
                    st.success(message)
                else:
                    st.error(message)
            st.markdown("</div>", unsafe_allow_html=True)
            
            # Keep the original download button for browser downloads
            json_string = json.dumps(
                st.session_state.generated_vocabulary, ensure_ascii=False, indent=2
            )
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"arabic_vocab_{group_name.lower().replace(' ', '_')}_{timestamp}.json"

        with col2:
            # Copy to clipboard button with styling
            st.markdown('<div class="copy-button">', unsafe_allow_html=True)
            st.button(
                "📋 Copy JSON to Clipboard",
                help="Copy the JSON data to clipboard",
                on_click=lambda: st.write(
                    "<script>navigator.clipboard.writeText(`"
                    + json_string.replace("`", "\\`")
                    + "`);</script>",
                    unsafe_allow_html=True,
                ),
            )
            st.markdown("</div>", unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

# Add a stylish footer
st.markdown(
    """
<div class="footer">
    <p>Arabic Vocabulary Generator for Language Learning App | Created with ❤️ for Arabic Learners</p>
</div>
""",
    unsafe_allow_html=True,
)
