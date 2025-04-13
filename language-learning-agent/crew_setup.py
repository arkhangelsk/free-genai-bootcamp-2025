# crew_setup_improved.py
import os
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI

def create_arabic_grammar_crew():
    """
    Create a CrewAI crew for Arabic grammar tutoring with improved multiple choice exercises
    """
    openai_api_key = os.getenv("OPENAI_API_KEY")
    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.3, api_key=openai_api_key)

    grammar_expert = Agent(
        role="Arabic Grammar Expert",
        goal="Teach Arabic grammar to beginners using clear explanations and abundant examples",
        backstory="""
        You are a seasoned Arabic linguist known for simplifying grammar for absolute beginners.
        You follow a structured teaching method:
        1. Introduce concepts from the simplest to more complex
        2. Use plain, non-technical language
        3. Offer multiple illustrative examples for every point
        4. Highlight common mistakes using contrastive examples
        5. Use tables and visuals where possible
        Your teaching style is patient, accessible, and engaging.
        """,
        verbose=False,
        allow_delegation=False,
        llm=llm,
    )

    exercise_creator = Agent(
        role="Exercise Creator",
        goal="Design beginner-level Arabic grammar multiple choice exercises that reinforce understanding",
        backstory="""
        You're a specialist in Arabic language pedagogy with expertise in crafting effective multiple choice exercises.
        Your exercises help learners practice grammar in an interactive, clear, and supportive manner.
        
        You follow these principles:
        1. Each exercise is in multiple choice format with 4 options (A, B, C, D)
        2. Options include the correct answer and common misconceptions
        3. Each exercise includes the correct answer clearly marked
        4. Every exercise has a detailed explanation that breaks down why the correct answer is right
           and why the other options are wrong
        5. Exercises progress from simple recognition to application of concepts
        
        Example exercise format:
        
        Question 1: [Clear, focused question about the grammar concept]
        A. [Option A]
        B. [Option B]
        C. [Option C]
        D. [Option D]
        
        Correct Answer: [Letter of correct answer]
        
        Explanation:
        [Clear explanation of why the correct answer is right]
        [Brief explanation of why each incorrect option is wrong]
        [Connection back to the main grammar concept]
        """,
        verbose=False,
        allow_delegation=False,
        llm=llm,
    )

    language_tutor = Agent(
        role="Language Tutor",
        goal="Respond to learners with warm, easy-to-follow Arabic grammar help and interactive feedback",
        backstory="""
        You're a supportive Arabic tutor with a gift for explaining grammar in a conversational way.
        You help learners build confidence by answering their questions clearly, encouraging progress,
        and giving feedback that highlights growth opportunities. You also weave in practice to reinforce concepts.
        
        When presenting multiple choice exercises to learners, you:
        1. Frame them as an opportunity to apply what they've learned
        2. Encourage learners to try the exercises before looking at the answers
        3. Provide positive reinforcement regardless of the learner's performance
        4. Connect the exercises back to the main concepts from the lesson
        """,
        verbose=False,
        allow_delegation=False,
        llm=llm,
    )

    explain_grammar_task = Task(
        description="""
        Provide a step-by-step, beginner-friendly explanation of the selected Arabic grammar topic.
        Focus exclusively on the topic given (e.g., "{topic}") and avoid introducing unrelated concepts.

        Instructions:
        1. Start with a short, simple introduction to the topic
        2. Break it into logical components with easy explanations
        3. For each component:
           - Use plain language (avoid jargon)
           - Add 3–4 clear examples
           - Include pronunciation help for Arabic terms
           - Show at least one common mistake with correction
        4. Use tables/visuals if it enhances clarity
        5. End with a summary of key takeaways

        Input:
        - Topic: {topic}
        - User query
        - Chat history

        Output:
        - A structured, engaging, beginner-level explanation with multiple examples
        """,
        agent=grammar_expert,
        expected_output="A thorough, easy-to-understand explanation tailored to beginners, with clear examples and common mistake alerts.",
    )

    create_exercises_task = Task(
        description="""
        Create 3-4 multiple choice exercises that help users practice the selected grammar concept.
        Stay focused on the topic provided (e.g., "{topic}").

        Each multiple choice exercise must include:
        1. A clear question about the grammar concept
        2. Four answer options labeled A, B, C, and D
        3. The correct answer clearly marked
        4. A detailed explanation for why the correct answer is right and why others are wrong

        Example Exercise Format:
        ```
        Question 1: Which of the following sentences correctly uses the definite article "ال" (al) in Arabic?
        A. كتاب جميل (kitaab jamiil) - a beautiful book
        B. جميل الكتاب (jamiil al-kitaab) - beautiful the book
        C. الكتاب الجميل (al-kitaab al-jamiil) - the beautiful book
        D. الجميل كتاب (al-jamiil kitaab) - the beautiful book

        Correct Answer: C

        Explanation:
        C is correct because in Arabic, the definite article "ال" (al) is attached to both the noun and its adjective when describing a definite noun. In "الكتاب الجميل" (al-kitaab al-jamiil), both "book" and "beautiful" have the definite article.

        Option A has no definite article at all, making it "a beautiful book" rather than "the beautiful book."
        Option B has incorrect word order, as adjectives follow nouns in Arabic.
        Option D has incorrect word order and would translate awkwardly to "the beautiful is a book."
        ```

        Guidelines:
        - Use simple vocabulary suitable for beginners
        - Ensure each question tests understanding of the specific grammar concept
        - Include options that represent common mistakes learners make
        - Provide pronunciation guidance in parentheses
        - Make sure the explanation reinforces the grammar rule being tested

        Input:
        - Topic: {topic}
        - Grammar Expert's explanation
        - Chat history

        Output:
        - 3-4 multiple choice exercises following the example format above
        """,
        agent=exercise_creator,
        expected_output="A set of 3-4 multiple choice exercises with clear questions, 4 options each, correct answers marked, and detailed explanations.",
    )

    tutor_response_task = Task(
        description="""
        Deliver a final, user-friendly summary that incorporates the grammar explanation and multiple choice exercises.

        Make the response:
        1. Friendly and encouraging in tone
        2. Clear and logically organized
        3. Focused strictly on the user's selected topic (e.g., "{topic}")
        4. Personalized to the user's question and learning level

        Structure:
        - Brief intro reaffirming the topic
        - Summary of the key grammar points with simplified language
        - Highlights from the examples (use some to reinforce)
        - Introduction to the practice exercises with encouragement to try them
        - Present the multiple choice exercises in a clear format
        - Closing encouragement and suggestion for next steps

        Example of how to present an exercise:
        ```
        Let's practice what you've learned with a few exercises!

        Question 1: Which of the following sentences correctly uses the definite article "ال" (al) in Arabic?
        A. كتاب جميل (kitaab jamiil) - a beautiful book
        B. جميل الكتاب (jamiil al-kitaab) - beautiful the book
        C. الكتاب الجميل (al-kitaab al-jamiil) - the beautiful book
        D. الجميل كتاب (al-jamiil kitaab) - the beautiful book

        Take a moment to think about your answer before checking below!

        [Answer and explanation below]
        ```

        Input:
        - Topic: {topic}
        - Grammar explanation
        - Multiple choice exercises
        - User's question

        Output:
        - An all-in-one tutorial message with an approachable tone, simplified grammar explanation, and helpful multiple choice exercises.
        """,
        agent=language_tutor,
        expected_output="An all-in-one tutorial message with an approachable tone, simplified grammar explanation, and helpful multiple choice exercises with clear presentation and encouraging guidance."
    )

    crew = Crew(
        agents=[grammar_expert, exercise_creator, language_tutor],
        tasks=[explain_grammar_task, create_exercises_task, tutor_response_task],
        process=Process.sequential,
        verbose=False,
    )

    return crew