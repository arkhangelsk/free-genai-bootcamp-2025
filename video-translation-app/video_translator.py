#!/usr/bin/env python3
"""
Video Translation App - Core functionality
This module handles YouTube video transcription, translation, and subtitle generation.
"""

import os
import sys
import argparse
import tempfile
import subprocess
from pathlib import Path
import json
import time
from typing import Dict, List, Optional, Tuple, Union

import whisper
import requests
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import SRTFormatter
import pysrt
from tqdm import tqdm

class VideoTranslator:
    """Main class for handling video transcription and translation."""
    
    def __init__(self, model_size: str = "base"):
        """
        Initialize the VideoTranslator.
        
        Args:
            model_size: Size of the Whisper model to use ('tiny', 'base', 'small', 'medium', 'large')
        """
        self.model = None
        self.model_size = model_size
        print(f"Initializing with {model_size} model...")
        
    def load_model(self):
        """Load the Whisper model if not already loaded."""
        if self.model is None:
            print(f"Loading Whisper {self.model_size} model...")
            self.model = whisper.load_model(self.model_size)
            print("Model loaded successfully.")
    
    def extract_video_id(self, youtube_url: str) -> str:
        """
        Extract the video ID from a YouTube URL.
        
        Args:
            youtube_url: The full YouTube URL
            
        Returns:
            The YouTube video ID
        """
        if "youtube.com/watch?v=" in youtube_url:
            return youtube_url.split("youtube.com/watch?v=")[1].split("&")[0]
        elif "youtu.be/" in youtube_url:
            return youtube_url.split("youtu.be/")[1].split("?")[0]
        else:
            raise ValueError("Invalid YouTube URL format")
    
    def get_youtube_transcript(self, video_id: str, language: Optional[str] = None) -> List[Dict]:
        """
        Get transcript from YouTube using YouTubeTranscriptApi.
        
        Args:
            video_id: YouTube video ID
            language: Language code for transcript (optional)
            
        Returns:
            List of transcript segments with timing information
        """
        try:
            if language:
                transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=[language])
            else:
                transcript = YouTubeTranscriptApi.get_transcript(video_id)
            return transcript
        except Exception as e:
            print(f"Error getting YouTube transcript: {e}")
            return []
    
    def download_audio(self, video_id: str, output_dir: Optional[str] = None) -> str:
        """
        Download audio from YouTube video.
        
        Args:
            video_id: YouTube video ID
            output_dir: Directory to save the audio file (optional)
            
        Returns:
            Path to the downloaded audio file
        """
        if output_dir is None:
            output_dir = tempfile.gettempdir()
        
        output_path = os.path.join(output_dir, f"{video_id}.mp3")
        
        if os.path.exists(output_path):
            print(f"Audio file already exists at {output_path}")
            return output_path
            
        youtube_url = f"https://www.youtube.com/watch?v={video_id}"
        
        # Use yt-dlp (you need to install it separately) to download audio
        try:
            command = [
                "yt-dlp",
                "-x",  # Extract audio
                "--audio-format", "mp3",
                "-o", output_path,
                youtube_url
            ]
            
            print("Downloading audio...")
            subprocess.run(command, check=True)
            print(f"Audio downloaded to {output_path}")
            return output_path
        except subprocess.CalledProcessError as e:
            print(f"Error downloading audio: {e}")
            print("Make sure yt-dlp is installed. Install with: pip install yt-dlp")
            raise
    
    def transcribe_audio(self, audio_path: str, source_language: Optional[str] = None) -> Dict:
        """
        Transcribe audio using Whisper.
        
        Args:
            audio_path: Path to the audio file
            source_language: Source language code (optional)
            
        Returns:
            Whisper transcription result
        """
        self.load_model()
        
        print(f"Transcribing audio from {audio_path}...")
        options = {}
        if source_language:
            options["language"] = source_language
            
        result = self.model.transcribe(audio_path, **options)
        return result
    
    def translate_transcript(self, transcript: Dict, target_language: str = "english") -> Dict:
        """
        Translate transcript using Whisper.
        
        Args:
            transcript: Whisper transcription result
            target_language: Target language for translation
            
        Returns:
            Translated transcript
        """
        self.load_model()
        
        # Whisper's translate task can translate to English
        if target_language.lower() != "english":
            print("Note: Whisper can only translate to English. For other languages, you'll need an additional translation service.")
            
        # For demonstration, we're just using Whisper's built-in translation to English
        audio_path = transcript.get("audio_path", "")
        if not audio_path:
            raise ValueError("No audio path in transcript")
            
        print(f"Translating to {target_language}...")
        result = self.model.transcribe(audio_path, task="translate")
        return result
    
    def generate_srt(self, segments: List[Dict], output_path: str) -> str:
        """
        Generate SRT subtitle file from transcript segments.
        
        Args:
            segments: List of transcript segments with timing information
            output_path: Path to save the SRT file
            
        Returns:
            Path to the generated SRT file
        """
        srt_content = []
        
        for i, segment in enumerate(segments, 1):
            start_time = segment['start']
            end_time = segment.get('end', start_time + segment.get('duration', 5))
            text = segment['text']
            
            # Convert seconds to SRT format (HH:MM:SS,mmm)
            start_formatted = self._format_time(start_time)
            end_formatted = self._format_time(end_time)
            
            srt_entry = f"{i}\n{start_formatted} --> {end_formatted}\n{text}\n"
            srt_content.append(srt_entry)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(srt_content))
            
        print(f"SRT file generated at {output_path}")
        return output_path
    
    def _format_time(self, seconds: float) -> str:
        """
        Format time in seconds to SRT format (HH:MM:SS,mmm).
        
        Args:
            seconds: Time in seconds
            
        Returns:
            Formatted time string
        """
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        seconds = seconds % 60
        milliseconds = int((seconds - int(seconds)) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{int(seconds):02d},{milliseconds:03d}"
    
    def align_word_timing(self, transcript_result: Dict) -> List[Dict]:
        """
        Align timing at the word level using Whisper's word-level timestamps.
        
        Args:
            transcript_result: Whisper transcription result
            
        Returns:
            List of words with timing information
        """
        aligned_words = []
        
        # Check if we have word-level timestamps from Whisper
        if "segments" in transcript_result:
            for segment in transcript_result["segments"]:
                if "words" in segment:
                    # Whisper provides word-level timestamps in some models
                    for word_info in segment["words"]:
                        aligned_words.append({
                            "word": word_info["word"],
                            "start": word_info["start"],
                            "end": word_info["end"],
                            "confidence": word_info.get("confidence", 1.0)
                        })
                else:
                    # If word-level timestamps aren't available, estimate them
                    # by dividing the segment duration by the number of words
                    text = segment["text"]
                    words = text.split()
                    start_time = segment["start"]
                    end_time = segment["end"]
                    duration = end_time - start_time
                    word_duration = duration / len(words) if words else 0
                    
                    for i, word in enumerate(words):
                        word_start = start_time + i * word_duration
                        word_end = word_start + word_duration
                        
                        aligned_words.append({
                            "word": word,
                            "start": word_start,
                            "end": word_end,
                            "confidence": segment.get("confidence", 1.0)
                        })
        
        return aligned_words
    
    def generate_word_level_srt(self, aligned_words: List[Dict], output_path: str, 
                              words_per_subtitle: int = 7) -> str:
        """
        Generate SRT with word-level timing.
        
        Args:
            aligned_words: List of words with timing information
            output_path: Path to save the SRT file
            words_per_subtitle: Number of words per subtitle line
            
        Returns:
            Path to the generated SRT file
        """
        srt_content = []
        subtitle_index = 1
        
        # Group words into subtitle chunks
        for i in range(0, len(aligned_words), words_per_subtitle):
            chunk = aligned_words[i:i+words_per_subtitle]
            if not chunk:
                continue
                
            start_time = chunk[0]["start"]
            end_time = chunk[-1]["end"]
            text = " ".join(word["word"] for word in chunk)
            
            # Convert seconds to SRT format
            start_formatted = self._format_time(start_time)
            end_formatted = self._format_time(end_time)
            
            srt_entry = f"{subtitle_index}\n{start_formatted} --> {end_formatted}\n{text}\n"
            srt_content.append(srt_entry)
            subtitle_index += 1
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(srt_content))
            
        print(f"Word-level SRT file generated at {output_path}")
        return output_path
    
    def process_youtube_video(self, youtube_url: str, target_language: str = "english", 
                           output_dir: str = "./output", word_level: bool = True) -> Dict:
        """
        Process a YouTube video: download, transcribe, translate, and generate subtitles.
        
        Args:
            youtube_url: YouTube video URL
            target_language: Target language for translation
            output_dir: Directory to save output files
            word_level: Whether to generate word-level subtitles
            
        Returns:
            Dictionary with paths to generated files
        """
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Extract video ID
        video_id = self.extract_video_id(youtube_url)
        print(f"Processing YouTube video: {video_id}")
        
        # Download audio
        audio_path = self.download_audio(video_id, output_dir)
        
        # Transcribe audio
        transcript_result = self.transcribe_audio(audio_path)
        transcript_result["audio_path"] = audio_path
        
        # Save original transcript
        transcript_path = os.path.join(output_dir, f"{video_id}_transcript.json")
        with open(transcript_path, 'w', encoding='utf-8') as f:
            # Remove audio_path from the saved transcript to avoid large file
            transcript_to_save = transcript_result.copy()
            transcript_to_save.pop("audio_path", None)
            json.dump(transcript_to_save, f, indent=2, ensure_ascii=False)
        
        # Generate SRT from transcript
        srt_path = os.path.join(output_dir, f"{video_id}_transcript.srt")
        self.generate_srt(transcript_result["segments"], srt_path)
        
        # Translate transcript if target language is different from source
        if target_language.lower() != transcript_result.get("language", "").lower():
            translation_result = self.translate_transcript(transcript_result, target_language)
            
            # Save translated transcript
            translation_path = os.path.join(output_dir, f"{video_id}_translation.json")
            with open(translation_path, 'w', encoding='utf-8') as f:
                translation_to_save = translation_result.copy()
                translation_to_save.pop("audio_path", None)
                json.dump(translation_to_save, f, indent=2, ensure_ascii=False)
            
            # Generate SRT from translation
            translation_srt_path = os.path.join(output_dir, f"{video_id}_translation.srt")
            self.generate_srt(translation_result["segments"], translation_srt_path)
        else:
            translation_result = transcript_result
            translation_path = transcript_path
            translation_srt_path = srt_path
        
        # Generate word-level aligned subtitles if requested
        word_level_srt_path = None
        if word_level:
            aligned_words = self.align_word_timing(translation_result)
            word_level_srt_path = os.path.join(output_dir, f"{video_id}_word_level.srt")
            self.generate_word_level_srt(aligned_words, word_level_srt_path)
        
        return {
            "video_id": video_id,
            "audio_path": audio_path,
            "transcript_path": transcript_path,
            "srt_path": srt_path,
            "translation_path": translation_path,
            "translation_srt_path": translation_srt_path,
            "word_level_srt_path": word_level_srt_path
        }

def main():
    """Main function to run the script from command line."""
    parser = argparse.ArgumentParser(description="Video Translation App")
    parser.add_argument("youtube_url", help="YouTube video URL")
    parser.add_argument("--target-language", default="english", help="Target language for translation")
    parser.add_argument("--output-dir", default="./output", help="Directory to save output files")
    parser.add_argument("--model-size", default="base", choices=["tiny", "base", "small", "medium", "large"],
                        help="Whisper model size")
    parser.add_argument("--transcript-only", action="store_true", help="Only extract transcript, no translation")
    parser.add_argument("--no-word-level", action="store_true", help="Don't generate word-level subtitles")
    
    args = parser.parse_args()
    
    translator = VideoTranslator(model_size=args.model_size)
    
    if args.transcript_only:
        # Extract video ID
        video_id = translator.extract_video_id(args.youtube_url)
        print(f"Extracting transcript for YouTube video: {video_id}")
        
        # Get transcript from YouTube
        transcript = translator.get_youtube_transcript(video_id)
        
        # Save transcript
        os.makedirs(args.output_dir, exist_ok=True)
        transcript_path = os.path.join(args.output_dir, f"{video_id}_youtube_transcript.json")
        with open(transcript_path, 'w', encoding='utf-8') as f:
            json.dump(transcript, f, indent=2, ensure_ascii=False)
        
        # Generate SRT from YouTube transcript
        srt_path = os.path.join(args.output_dir, f"{video_id}_youtube_transcript.srt")
        translator.generate_srt(transcript, srt_path)
        
        print(f"Transcript extracted and saved to {transcript_path}")
        print(f"SRT file generated at {srt_path}")
    else:
        # Full processing
        result = translator.process_youtube_video(
            args.youtube_url,
            target_language=args.target_language,
            output_dir=args.output_dir,
            word_level=not args.no_word_level
        )
        
        print("\nProcessing complete!")
        print(f"Video ID: {result['video_id']}")
        print(f"Audio: {result['audio_path']}")
        print(f"Transcript: {result['transcript_path']}")
        print(f"Transcript SRT: {result['srt_path']}")
        
        if result['translation_path'] != result['transcript_path']:
            print(f"Translation: {result['translation_path']}")
            print(f"Translation SRT: {result['translation_srt_path']}")
        
        if result['word_level_srt_path']:
            print(f"Word-level SRT: {result['word_level_srt_path']}")

if __name__ == "__main__":
    main()
