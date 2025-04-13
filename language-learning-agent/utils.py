import re
import json
from typing import List, Dict, Any


def parse_exercises_from_response(response) -> List[Dict[str, Any]]:
    """
    Parse exercises from the CrewAI agent's response

    Args:
        response: The response from the CrewAI agent (can be str or CrewOutput)

    Returns:
        List[Dict[str, Any]]: List of exercise dictionaries with question, answer, and explanation
    """
    print(f"DEBUG PARSE: Starting to parse exercises from response")
    # Convert CrewOutput to string if needed
    if not isinstance(response, str):
        try:
            # Try to access the 'result' attribute if it's a CrewOutput object
            if hasattr(response, 'result'):
                response = str(response.result)
            else:
                response = str(response)
        except Exception as e:
            print(f"Error converting CrewOutput to string in parse_exercises: {e}")
            return []
    
    # Look for exercise patterns in the response
    # More flexible pattern that can match different exercise formats
    exercise_pattern = r"(?:Exercise\s*\d+:?|Practice\s*Exercise\s*\d+:?|Exercise:)\s*(.*?)(?=(?:Exercise\s*\d+:|Practice\s*Exercise\s*\d+:|Exercise:)|$)"
    
    exercises = []

    # Find all exercises in the response
    exercise_matches = re.finditer(
        exercise_pattern, response, re.DOTALL | re.IGNORECASE
    )

    for match in exercise_matches:
        exercise_text = match.group(1).strip()
        print(f"DEBUG PARSE: Found exercise text: {exercise_text[:100]}...")
        
        # For multiple-choice questions, we need to identify the question stem and options separately
        # First, check if this looks like a multiple-choice question by searching for option patterns
        option_pattern = r'\s*(?:\([a-z]\)|[A-Z]\.)\s*(.+?)(?=\s*(?:\([a-z]\)|[A-Z]\.|$))'
        option_matches = list(re.finditer(option_pattern, exercise_text, re.DOTALL))
        
        # If we have option matches, this is likely a multiple-choice question
        if option_matches:
            # The question stem is everything before the first option
            first_option_pos = option_matches[0].start()
            question_stem = exercise_text[:first_option_pos].strip()
            
            # Collect all options
            options = []
            for match in option_matches:
                option_text = match.group(0).strip()
                options.append(option_text)
            
            # Combine question stem and options
            question = question_stem + "\n" + "\n".join(options)
            
            # Try to find the answer and explanation
            answer_match = re.search(r"(?:Answer|Correct Answer|Solution):?\s*(.*?)(?=(?:Explanation|Reason|Why):?|$)", 
                                    exercise_text, re.DOTALL | re.IGNORECASE)
            explanation_match = re.search(r"(?:Explanation|Reason|Why):?\s*(.*?)$", 
                                        exercise_text, re.DOTALL | re.IGNORECASE)
            
            # Extract the answer - for multiple choice, it's usually just the option letter
            if answer_match:
                answer_text = answer_match.group(1).strip()
                # Try to extract just the option identifier (a, b, c, etc.)
                option_in_answer = re.search(r'\s*(?:\([a-z]\)|[A-Z]\.)\s*', answer_text)
                if option_in_answer:
                    answer = option_in_answer.group(0).strip()
                else:
                    answer = answer_text
            else:
                answer = ""
                
            explanation = explanation_match.group(1).strip() if explanation_match else ""
        else:
            # Not a multiple-choice question, use the standard approach
            question_match = re.search(r"(?:Question|Task|Problem|Q\d+):?\s*(.*?)(?=(?:Answer|Correct Answer|Solution):?|$)", 
                                      exercise_text, re.DOTALL | re.IGNORECASE)
            answer_match = re.search(r"(?:Answer|Correct Answer|Solution):?\s*(.*?)(?=(?:Explanation|Reason|Why):?|$)", 
                                    exercise_text, re.DOTALL | re.IGNORECASE)
            explanation_match = re.search(r"(?:Explanation|Reason|Why):?\s*(.*?)$", 
                                        exercise_text, re.DOTALL | re.IGNORECASE)
            
            # If structured format found, use it
            if question_match:
                question = question_match.group(1).strip()
            else:
                # Try to find any answer pattern in the text and split there
                answer_split = re.search(r"(?:Answer|Correct Answer|Solution):?", exercise_text, re.IGNORECASE)
                if answer_split:
                    # Split at the answer marker
                    split_pos = answer_split.start()
                    question = exercise_text[:split_pos].strip()
                else:
                    # If no answer marker found, treat the whole text as the question
                    question = exercise_text.strip()
                
            answer = answer_match.group(1).strip() if answer_match else ""
            explanation = explanation_match.group(1).strip() if explanation_match else ""

        exercises.append(
            {
                "question": question,
                "answer": answer,
                "explanation": explanation,
                "revealed": False,
            }
        )

    print(f"DEBUG PARSE: Extracted {len(exercises)} exercises")
    return exercises


def clean_response(response) -> str:
    """
    Clean the response from CrewAI agents to remove any JSON or formatting artifacts

    Args:
        response: The raw response from the CrewAI agent (can be str or CrewOutput)

    Returns:
        str: Cleaned response text
    """
    # Convert CrewOutput to string if needed
    if not isinstance(response, str):
        try:
            print(f"DEBUG: Raw response type: {type(response).__name__}")
            
            # Try to access different attributes that might contain the result
            if hasattr(response, 'result'):
                response = str(response.result)
            elif hasattr(response, 'raw_output'):
                response = str(response.raw_output)
            elif hasattr(response, 'output'):
                response = str(response.output)
            else:
                # Last resort - direct string conversion
                response = str(response)
        except Exception as e:
            print(f"Error converting CrewOutput to string: {e}")
            return "Error processing response"
    
    # Remove any JSON blocks that might be in the response
    response = re.sub(r"\{[\s\S]*?\}", "", response)

    # COMPLETELY remove all exercise sections from the main content display
    original_length = len(response)
    
    # First, remove any "Practice Exercises:" headers and content that follows
    response = re.sub(r"Practice Exercises:?[\s\S]*$", "", response, flags=re.DOTALL)
    
    # Remove any "Exercise X:" sections
    response = re.sub(r"Exercise\s*\d+:?[\s\S]*?(?=Exercise\s*\d+:|$)", "", response, flags=re.DOTALL)
    
    # Remove any standalone "Exercise:" sections
    response = re.sub(r"Exercise:?[\s\S]*?(?=Exercise:|$)", "", response, flags=re.DOTALL)
    
    # Remove any "Correct Answer:" sections
    response = re.sub(r"Correct Answer:.*?(?=\n\n|$)", "", response, flags=re.DOTALL)
    
    print(f"DEBUG: Response length after removing exercises: {len(response)}")

    # Preserve code blocks and tables (don't remove markdown for these)
    code_blocks = []
    table_blocks = []

    # Extract and preserve code blocks
    code_pattern = r"```[\s\S]*?```"
    code_matches = re.finditer(code_pattern, response)
    for i, match in enumerate(code_matches):
        code_blocks.append(match.group(0))
        response = response.replace(match.group(0), f"CODE_BLOCK_{i}")

    # Extract and preserve tables (markdown tables)
    table_pattern = r"\|[\s\S]*?\|[\s\S]*?(?=\n\n|\n$|$)"
    table_matches = re.finditer(table_pattern, response)
    for i, match in enumerate(table_matches):
        table_blocks.append(match.group(0))
        response = response.replace(match.group(0), f"TABLE_BLOCK_{i}")

    # Clean up extra whitespace
    response = re.sub(r"\n{3,}", "\n\n", response)

    # Put back the code blocks and tables
    for i, block in enumerate(code_blocks):
        response = response.replace(f"CODE_BLOCK_{i}", block)

    for i, block in enumerate(table_blocks):
        response = response.replace(f"TABLE_BLOCK_{i}", block)

    print(f"DEBUG: Final response length: {len(response)}")
    print(f"DEBUG: Final response preview: {response[:500]}...")
    return response.strip()


def format_arabic_text(text: str) -> str:
    """
    Format Arabic text with styling but keep it left-aligned for exercises

    Args:
        text (str): The Arabic text to format

    Returns:
        str: HTML-formatted Arabic text
    """
    # Keep Arabic text in the same flow as English text (left-aligned)
    # We use inline-block to keep it in the natural flow of text
    return f"<span style=\"font-size:18px;margin:0 5px;font-family:'Amiri', 'Traditional Arabic', serif;display:inline-block;color:#93bcd9;\">{text}</span>"


def extract_grammar_rules(response) -> List[Dict[str, str]]:
    """
    Extract grammar rules from the response

    Args:
        response: The response from the CrewAI agent (can be str or CrewOutput)

    Returns:
        List[Dict[str, str]]: List of grammar rules with rule and example
    """
    # Convert CrewOutput to string if needed
    if not isinstance(response, str):
        try:
            # Try to access the 'result' attribute if it's a CrewOutput object
            if hasattr(response, 'result'):
                response = str(response.result)
            else:
                response = str(response)
        except Exception as e:
            print(f"Error converting CrewOutput to string in extract_grammar_rules: {e}")
            return []
    # Look for rule patterns in the response
    rule_pattern = r"(?:Rule\s*\d*:|Grammar Rule\s*\d*:|Key Rule\s*\d*:)\s*(.*?)(?=(?:Rule\s*\d*:|Grammar Rule\s*\d*:|Key Rule\s*\d*:|Example|Examples):?|$)"
    example_pattern = r"(?:Example|Examples):?\s*(.*?)(?=(?:Rule\s*\d*:|Grammar Rule\s*\d*:|Key Rule\s*\d*:)|$)"

    rules = []

    # Find all rules in the response
    rule_matches = re.finditer(rule_pattern, response, re.DOTALL | re.IGNORECASE)

    for match in rule_matches:
        rule_text = match.group(1).strip()

        # Find the example that follows this rule
        start_pos = match.end()
        example_match = re.search(
            example_pattern, response[start_pos:], re.DOTALL | re.IGNORECASE
        )

        example = example_match.group(1).strip() if example_match else ""

        rules.append({"rule": rule_text, "example": example})

    return rules


def add_transliteration(text: str) -> str:
    """
    Add simple transliteration for Arabic text in parentheses

    Args:
        text (str): The text containing Arabic that needs transliteration

    Returns:
        str: Text with transliterations added
    """
    # This is a simplified implementation
    # For a complete solution, you would need a proper Arabic transliteration library

    # Common transliteration mappings (simplified)
    transliterations = {
        "ا": "a",
        "ب": "b",
        "ت": "t",
        "ث": "th",
        "ج": "j",
        "ح": "h",
        "خ": "kh",
        "د": "d",
        "ذ": "dh",
        "ر": "r",
        "ز": "z",
        "س": "s",
        "ش": "sh",
        "ص": "s",
        "ض": "d",
        "ط": "t",
        "ظ": "z",
        "ع": "'",
        "غ": "gh",
        "ف": "f",
        "ق": "q",
        "ك": "k",
        "ل": "l",
        "م": "m",
        "ن": "n",
        "ه": "h",
        "و": "w",
        "ي": "y",
        "ة": "a",
        "ء": "'",
        "أ": "a",
        "إ": "i",
        "آ": "aa",
        "ى": "a",
        "ئ": "y",
        "ؤ": "w",
        "َ": "a",
        "ُ": "u",
        "ِ": "i",
        "ّ": "",
        "ْ": "",
    }

    # This function would normally use a more sophisticated algorithm
    # For now, we'll just return the original text
    return text