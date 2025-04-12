"""
YouTube Transcription Extractor for Arabic Learning Content

This module extracts transcriptions from YouTube videos about Arabic language learning,
identifies Arabic phrases with their English translations, and generates quiz questions.
"""

import os
import json
import re
import argparse
import base64
from typing import List, Dict, Any, Tuple
import googleapiclient.discovery
from youtube_transcript_api import YouTubeTranscriptApi
from googleapiclient.errors import HttpError
import chromadb
from sentence_transformers import SentenceTransformer
import uuid
import time
from dotenv import load_dotenv

# Import for text-to-speech functionality
try:
    from gtts import gTTS
    TTS_AVAILABLE = True
except ImportError:
    print("gTTS not installed. Audio generation will be disabled.")
    print("Install with: pip install gtts")
    TTS_AVAILABLE = False

class YouTubeArabicExtractor:
    def __init__(self, api_key: str, output_dir: str = "questions"):
        """
        Initialize the YouTube Arabic Extractor.
        
        Args:
            api_key: YouTube Data API key
            output_dir: Directory to save extracted questions
        """
        self.api_key = api_key
        self.output_dir = output_dir
        self.youtube = googleapiclient.discovery.build(
            "youtube", "v3", developerKey=api_key
        )
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Initialize embedding model for vector store
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize ChromaDB
        self.db_dir = "chroma_db"
        os.makedirs(self.db_dir, exist_ok=True)
        self.client = chromadb.PersistentClient(path=self.db_dir)
        
        # Create or get the collection
        try:
            self.collection = self.client.get_collection("arabic_quiz_questions")
            print(f"Loaded existing collection with {self.collection.count()} questions")
        except:
            self.collection = self.client.create_collection(
                name="arabic_quiz_questions",
                metadata={"hnsw:space": "cosine"}
            )
            print("Created new collection for Arabic quiz questions")
    
    def search_videos(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Search for YouTube videos based on a query.
        
        Args:
            query: Search query (e.g., "learn arabic basic phrases")
            max_results: Maximum number of results to return
            
        Returns:
            List of video information dictionaries
        """
        try:
            search_response = self.youtube.search().list(
                q=query,
                part="id,snippet",
                maxResults=max_results,
                type="video",
                relevanceLanguage="ar",  # Prefer Arabic content
            ).execute()
            
            videos = []
            for item in search_response.get("items", []):
                if item["id"]["kind"] == "youtube#video":
                    video_id = item["id"]["videoId"]
                    title = item["snippet"]["title"]
                    channel = item["snippet"]["channelTitle"]
                    description = item["snippet"]["description"]
                    
                    # Get video duration and view count
                    video_response = self.youtube.videos().list(
                        part="contentDetails,statistics",
                        id=video_id
                    ).execute()
                    
                    if video_response["items"]:
                        content_details = video_response["items"][0]["contentDetails"]
                        statistics = video_response["items"][0]["statistics"]
                        
                        videos.append({
                            "id": video_id,
                            "title": title,
                            "channel": channel,
                            "description": description,
                            "duration": content_details.get("duration", ""),
                            "view_count": statistics.get("viewCount", "0")
                        })
            
            return videos
        
        except HttpError as e:
            print(f"An HTTP error occurred: {e}")
            return []
    
    def get_transcript(self, video_id: str) -> List[Dict[str, Any]]:
        """
        Get the transcript for a YouTube video.
        
        Args:
            video_id: YouTube video ID
            
        Returns:
            List of transcript segments with text and timestamps
        """
        try:
            # Try to get the Arabic transcript first
            try:
                return YouTubeTranscriptApi.get_transcript(video_id, languages=['ar'])
            except Exception as ar_error:
                print(f"Could not get Arabic transcript: {ar_error}")
                # Fall back to any available transcript
                return YouTubeTranscriptApi.get_transcript(video_id)
            
        except Exception as e:
            print(f"Error getting transcript for video {video_id}: {e}")
            
            # Try one more approach - list available transcripts and get the first one
            try:
                transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                available_transcripts = list(transcript_list._manually_created_transcripts.values())
                available_transcripts.extend(list(transcript_list._generated_transcripts.values()))
                
                if available_transcripts:
                    print(f"Found {len(available_transcripts)} available transcripts")
                    transcript = available_transcripts[0]
                    return transcript.fetch()
                else:
                    print("No transcripts available")
            except Exception as list_error:
                print(f"Error listing transcripts: {list_error}")
                
            return []
    
    def extract_arabic_phrases(self, transcript: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract Arabic phrases and their English translations from the transcript.
        
        Args:
            transcript: List of transcript segments
            
        Returns:
            List of dictionaries containing Arabic phrases and translations
        """
        phrases = []
        
        # Check if transcript is empty
        if not transcript:
            print("Warning: Empty transcript provided to extract_arabic_phrases")
            return phrases
        
        # Join transcript segments into a single text
        try:
            # The YouTube transcript API returns a list of dictionaries with 'text' keys
            full_text = " ".join([segment.get("text", "") for segment in transcript])
            print(f"Transcript length: {len(full_text)} characters")
            
            # Check if we have Arabic characters in the transcript
            arabic_char_pattern = r'[\u0600-\u06FF]'
            has_arabic = bool(re.search(arabic_char_pattern, full_text))
            print(f"Transcript contains Arabic characters: {has_arabic}")
            
            # If no Arabic characters found, try to extract individual words/phrases that might be transliterated
            if not has_arabic:
                print("No Arabic characters found, looking for transliterated content")
                # Look for words that might be Arabic food terms (common in transliterated content)
                food_terms = [
                    "shawarma", "falafel", "hummus", "tabouleh", "baba ghanoush", "tahini", 
                    "halal", "kebab", "kofta", "baklava", "kanafeh", "mandi", "kabsa", 
                    "mansaf", "mulukhiyah", "fattoush", "manakish", "labneh", "za'atar"
                ]
                
                for term in food_terms:
                    if term.lower() in full_text.lower():
                        # Find the sentence containing this term
                        sentences = re.split(r'[.!?]\s+', full_text)
                        for sentence in sentences:
                            if term.lower() in sentence.lower():
                                # Create a phrase entry
                                phrases.append({
                                    "arabic_text": term,  # Use transliterated term as placeholder
                                    "english_text": sentence.strip()
                                })
                                print(f"Found food term: {term} in sentence: {sentence.strip()}")
        except Exception as e:
            print(f"Error processing transcript: {e}")
            return phrases
        
        # Pattern 1: Arabic phrase followed by translation in parentheses
        pattern1 = r'([\u0600-\u06FF\s]+)\s*\(([^)]+)\)'
        matches1 = re.findall(pattern1, full_text)
        
        for arabic, english in matches1:
            if len(arabic.strip()) > 0 and len(english.strip()) > 0:
                phrases.append({
                    "arabic_text": arabic.strip(),
                    "english_text": english.strip()
                })
        
        # Pattern 2: English phrase followed by Arabic in quotes
        pattern2 = r'([A-Za-z\s]+)[\s:"]*(["\'])([\u0600-\u06FF\s]+)(\2)'
        matches2 = re.findall(pattern2, full_text)
        
        for english, _, arabic, _ in matches2:
            if len(arabic.strip()) > 0 and len(english.strip()) > 0:
                phrases.append({
                    "arabic_text": arabic.strip(),
                    "english_text": english.strip()
                })
        
        # Pattern 3: Arabic phrase followed by English translation with a dash or colon
        pattern3 = r'([\u0600-\u06FF\s]+)\s*[-:]\s*([A-Za-z\s]+)'
        matches3 = re.findall(pattern3, full_text)
        
        for arabic, english in matches3:
            if len(arabic.strip()) > 0 and len(english.strip()) > 0:
                phrases.append({
                    "arabic_text": arabic.strip(),
                    "english_text": english.strip()
                })
        
        return phrases
    
    def generate_audio(self, text: str, output_path: str) -> str:
        """
        Generate audio file for Arabic text using gTTS.
        
        Args:
            text: Arabic text to convert to speech
            output_path: Directory to save the audio file
            
        Returns:
            Path to the generated audio file or empty string if generation failed
        """
        if not TTS_AVAILABLE:
            return ""
            
        try:
            # Create a unique filename based on text content
            filename = f"audio_{base64.b64encode(text.encode('utf-8')).decode('utf-8')[:20].replace('/', '_')}.mp3"
            audio_path = os.path.join(output_path, filename)
            
            # Check if file already exists
            if os.path.exists(audio_path):
                return audio_path
                
            # Create directory if it doesn't exist
            os.makedirs(output_path, exist_ok=True)
            
            # Generate audio using gTTS
            tts = gTTS(text=text, lang='ar', slow=False)
            tts.save(audio_path)
            
            print(f"Generated audio for: {text}")
            return audio_path
        except Exception as e:
            print(f"Error generating audio: {e}")
            return ""
    
    def generate_quiz_questions(self, phrases: List[Dict[str, Any]], category: str, use_arabic_questions: bool = False) -> List[Dict[str, Any]]:
        """
        Generate quiz questions from extracted phrases.
        
        Args:
            phrases: List of dictionaries containing Arabic phrases and translations
            category: Category for the questions (e.g., "greetings", "food")
            use_arabic_questions: If True, questions will be in Arabic instead of English
            
        Returns:
            List of quiz questions in the format used by the quiz app
        """
        questions = []
        
        # Create audio directory
        audio_dir = os.path.join("static", "audio", category)
        os.makedirs(audio_dir, exist_ok=True)
        
        for i, phrase in enumerate(phrases):
            arabic = phrase["arabic_text"]
            english = phrase["english_text"]
            
            # Skip if either text is too short
            if len(arabic) < 2 or len(english) < 2:
                continue
            
            # 1. Create a multiple-choice question (for every 3rd phrase)
            if i % 3 == 0:
                # Get incorrect options from other phrases
                incorrect_options = []
                for j, other_phrase in enumerate(phrases):
                    if j != i and len(incorrect_options) < 3:
                        incorrect_options.append(other_phrase["english_text"])
                
                # If we don't have enough incorrect options, add some generic ones
                generic_options = ["Not a valid translation", "Incorrect phrase", "Different meaning"]
                while len(incorrect_options) < 3:
                    incorrect_options.append(generic_options[len(incorrect_options) % 3])
                
                # Create the question
                options = [english] + incorrect_options
                import random
                random.shuffle(options)
                correct_index = options.index(english)
                
                # Generate audio for the Arabic text
                audio_path = self.generate_audio(arabic, audio_dir)
                
                # Create question text in Arabic or English
                question_text = "ما معنى هذه العبارة؟" if use_arabic_questions else "What does this phrase mean?"
                
                questions.append({
                    "type": "multiple_choice",
                    "arabic_text": arabic,
                    "question": question_text,
                    "options": options,
                    "correct_index": correct_index,
                    "audio_path": audio_path.replace("static/", "") if audio_path else "",
                    "category": category,
                    "question_language": "arabic" if use_arabic_questions else "english"
                })
            
            # 2. Create a true/false question (for every 3rd phrase + 1)
            elif i % 3 == 1:
                # Decide if we'll show the correct or incorrect translation
                import random
                is_true = random.choice([True, False])
                
                if use_arabic_questions:
                    if is_true:
                        statement = f"هذه العبارة تعني '{english}'"
                    else:
                        # Get a different translation
                        incorrect_english = phrases[(i + 1) % len(phrases)]["english_text"]
                        statement = f"هذه العبارة تعني '{incorrect_english}'"
                else:
                    if is_true:
                        statement = f"This phrase means '{english}'"
                    else:
                        # Get a different translation
                        incorrect_english = phrases[(i + 1) % len(phrases)]["english_text"]
                        statement = f"This phrase means '{incorrect_english}'"
                
                # Generate audio for the Arabic text
                audio_path = self.generate_audio(arabic, audio_dir)
                
                questions.append({
                    "type": "true_false",
                    "arabic_text": arabic,
                    "statement": statement,
                    "is_true": is_true,
                    "audio_path": audio_path.replace("static/", "") if audio_path else "",
                    "category": category,
                    "question_language": "arabic" if use_arabic_questions else "english"
                })
            
            # 3. Create a fill-in-the-blank question (for every 3rd phrase + 2)
            else:
                # Generate audio for the Arabic text
                audio_path = self.generate_audio(arabic, audio_dir)
                
                # Create question text in Arabic or English
                question_text = "ما هي الترجمة الإنجليزية؟" if use_arabic_questions else "What is the English translation?"
                
                questions.append({
                    "type": "fill_blank",
                    "arabic_text": arabic,
                    "question": question_text,
                    "answer": english,
                    "audio_path": audio_path.replace("static/", "") if audio_path else "",
                    "category": category,
                    "question_language": "arabic" if use_arabic_questions else "english"
                })
        
        return questions
    
    def save_questions_to_file(self, questions: List[Dict[str, Any]], category: str) -> str:
        """
        Save generated questions to a JSON file.
        
        Args:
            questions: List of quiz questions
            category: Category name for the file
            
        Returns:
            Path to the saved file
        """
        # Clean the category name for filename
        clean_category = re.sub(r'[^\w\s]', '', category).lower().replace(' ', '_')
        
        # Create the file path
        file_path = os.path.join(self.output_dir, f"{clean_category}.json")
        
        # Save the questions
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        
        print(f"Saved {len(questions)} questions to {file_path}")
        return file_path
    
    def add_to_vector_store(self, questions: List[Dict[str, Any]], category: str) -> None:
        """
        Add questions to the vector store.
        
        Args:
            questions: List of quiz questions
            category: Category name
        """
        # Prepare data for indexing
        ids = []
        documents = []
        metadatas = []
        
        for question in questions:
            # Create a unique ID for each question
            question_id = str(uuid.uuid4())
            
            # Create the document text based on question type
            document_text = f"Arabic: {question['arabic_text']} "
            
            if question['type'] == 'multiple_choice':
                document_text += f"Question: {question['question']} "
                document_text += f"Options: {', '.join(question['options'])} "
            elif question['type'] == 'true_false':
                document_text += f"Statement: {question['statement']} "
            elif question['type'] == 'fill_blank':
                document_text += f"Question: {question['question']} "
                document_text += f"Answer: {question['answer']} "
            
            document_text += f"Category: {category}"
            
            # Create metadata
            metadata = {
                'type': question['type'],
                'category': category,
                'arabic_text': question['arabic_text']
            }
            
            # Add to batch
            ids.append(question_id)
            documents.append(document_text)
            metadatas.append(metadata)
        
        # Add to collection
        if ids:
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            
            print(f"Added {len(ids)} questions to vector store")
    
    def process_video(self, video_id: str, category: str) -> Tuple[int, str]:
        """
        Process a single video: extract transcript, generate questions, save to file.
        
        Args:
            video_id: YouTube video ID
            category: Category for the questions
            
        Returns:
            Tuple of (number of questions generated, file path)
        """
        # Get the transcript
        transcript = self.get_transcript(video_id)
        if not transcript:
            return 0, ""
        
        # Extract Arabic phrases
        phrases = self.extract_arabic_phrases(transcript)
        if not phrases:
            print(f"No Arabic phrases found in video {video_id}")
            return 0, ""
        
        # Generate quiz questions
        questions = self.generate_quiz_questions(phrases, category)
        if not questions:
            print(f"No questions generated for video {video_id}")
            return 0, ""
        
        # Save questions to file
        file_path = self.save_questions_to_file(questions, category)
        
        # Add to vector store
        self.add_to_vector_store(questions, category)
        
        return len(questions), file_path
    
    def process_topic(self, topic: str, max_videos: int = 5) -> List[Tuple[str, int, str]]:
        """
        Process a topic: search videos, extract transcripts, generate questions.
        
        Args:
            topic: Topic to search for (e.g., "arabic greetings", "arabic food vocabulary")
            max_videos: Maximum number of videos to process
            
        Returns:
            List of tuples (video_id, number of questions, file path)
        """
        # Extract category from topic
        category_match = re.search(r'arabic\s+(\w+)', topic.lower())
        category = category_match.group(1) if category_match else "general"
        
        # If no questions are found after processing videos, create some sample questions
        # This ensures we always have some content for testing
        self.fallback_questions = {
            "food": [
                {"arabic_text": "خبز", "english_text": "bread"},
                {"arabic_text": "ماء", "english_text": "water"},
                {"arabic_text": "لحم", "english_text": "meat"},
                {"arabic_text": "دجاج", "english_text": "chicken"},
                {"arabic_text": "سمك", "english_text": "fish"},
                {"arabic_text": "خضروات", "english_text": "vegetables"},
                {"arabic_text": "فواكه", "english_text": "fruits"},
                {"arabic_text": "أرز", "english_text": "rice"},
                {"arabic_text": "حلويات", "english_text": "desserts"},
                {"arabic_text": "قهوة", "english_text": "coffee"}
            ],
            "shopping": [
                {"arabic_text": "سوق", "english_text": "market"},
                {"arabic_text": "متجر", "english_text": "store"},
                {"arabic_text": "بكم هذا؟", "english_text": "How much is this?"},
                {"arabic_text": "رخيص", "english_text": "cheap"},
                {"arabic_text": "غالي", "english_text": "expensive"}
            ],
            "greetings": [
                {"arabic_text": "مرحبا", "english_text": "hello"},
                {"arabic_text": "صباح الخير", "english_text": "good morning"},
                {"arabic_text": "مساء الخير", "english_text": "good evening"},
                {"arabic_text": "مع السلامة", "english_text": "goodbye"}
            ]
        }
        
        # Search for videos
        videos = self.search_videos(topic, max_results=max_videos)
        if not videos:
            print(f"No videos found for topic: {topic}")
            return []
        
        results = []
        for video in videos:
            print(f"Processing video: {video['title']} (ID: {video['id']})")
            
            # Process the video
            num_questions, file_path = self.process_video(video['id'], category)
            
            if num_questions > 0:
                results.append((video['id'], num_questions, file_path))
            
            # Be nice to the API
            time.sleep(2)
        
        # If no questions were generated from videos, use fallback questions
        if not results and category in self.fallback_questions:
            print(f"No questions generated from videos. Using fallback {category} questions.")
            fallback_phrases = self.fallback_questions[category]
            # Pass use_arabic_questions parameter from the app.py
            use_arabic_questions = getattr(self, 'use_arabic_questions', False)
            print(f"Generating fallback questions with Arabic questions: {use_arabic_questions}")
            questions = self.generate_quiz_questions(fallback_phrases, category, use_arabic_questions=use_arabic_questions)
            file_path = self.save_questions_to_file(questions, category)
            self.add_to_vector_store(questions, category)
            results.append(("fallback", len(questions), file_path))
        
        return results


def main():
    # Load environment variables from .env file
    load_dotenv()
    
    # Get API key from environment variable
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        print("Error: YOUTUBE_API_KEY not found in .env file")
        print("Please create a .env file with your YouTube API key")
        print("Example: YOUTUBE_API_KEY=your_api_key_here")
        return
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Extract Arabic phrases from YouTube videos and generate quiz questions")
    parser.add_argument("--topic", "-t", type=str, help="Topic to search for (e.g., 'arabic food vocabulary')")
    parser.add_argument("--videos", "-v", type=int, default=int(os.getenv("MAX_VIDEOS_PER_TOPIC", 3)),
                        help="Maximum number of videos to process per topic")
    parser.add_argument("--output", "-o", type=str, default=os.getenv("OUTPUT_DIRECTORY", "questions"),
                        help="Directory to save extracted questions")
    parser.add_argument("--list-topics", "-l", action="store_true", help="List predefined topics and exit")
    parser.add_argument("--process-all", "-a", action="store_true", help="Process all predefined topics")
    
    args = parser.parse_args()
    
    # Predefined topics
    predefined_topics = [
        "learn arabic greetings and introductions",
        "arabic food vocabulary",
        "arabic shopping phrases",
        "arabic travel phrases",
        "arabic family vocabulary",
        "arabic numbers and counting",
        "arabic weather vocabulary",
        "arabic time and date expressions"
    ]
    
    # List topics and exit if requested
    if args.list_topics:
        print("Predefined topics:")
        for i, topic in enumerate(predefined_topics, 1):
            print(f"{i}. {topic}")
        return
    
    # Create the extractor
    extractor = YouTubeArabicExtractor(api_key, output_dir=args.output)
    
    # Process topics
    if args.process_all:
        topics_to_process = predefined_topics
    elif args.topic:
        topics_to_process = [args.topic]
    else:
        # If no topic specified, show usage and exit
        parser.print_help()
        print("\nUse --topic to specify a topic or --process-all to process all predefined topics")
        print("Example: python youtube_extractor.py --topic 'arabic food vocabulary'")
        return
    
    for topic in topics_to_process:
        print(f"\nProcessing topic: {topic}")
        results = extractor.process_topic(topic, max_videos=args.videos)
        
        print(f"Results for topic '{topic}':")
        for video_id, num_questions, file_path in results:
            print(f"Video {video_id}: Generated {num_questions} questions, saved to {file_path}")


if __name__ == "__main__":
    main()
