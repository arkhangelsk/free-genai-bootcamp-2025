#!/usr/bin/env python3
"""
Video Translation App - Web Interface
This module provides a web interface for the video translation functionality.
"""

import os
import json
import tempfile
import urllib.parse
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS

from video_translator import VideoTranslator

app = Flask(__name__)
CORS(app)

# Create output directory
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Create static and templates directories if they don't exist
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(TEMPLATES_DIR, exist_ok=True)

# Initialize the translator with a small model by default
# Users can change this in the web interface
translator = VideoTranslator(model_size="small")

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/api/process', methods=['POST'])
def process_video():
    """Process a YouTube video and return the results."""
    data = request.json
    youtube_url = data.get('youtube_url')
    target_language = data.get('target_language', 'english')
    model_size = data.get('model_size', 'small')
    word_level = data.get('word_level', True)
    
    if not youtube_url:
        return jsonify({'error': 'YouTube URL is required'}), 400
    
    # Update model size if needed
    if model_size != translator.model_size:
        translator.model_size = model_size
        translator.model = None  # Force model reload
    
    try:
        # Process the video
        result = translator.process_youtube_video(
            youtube_url,
            target_language=target_language,
            output_dir=OUTPUT_DIR,
            word_level=word_level
        )
        
        # Convert file paths to relative URLs
        response = {
            'video_id': result['video_id'],
            'transcript_url': f'/output/{os.path.basename(result["transcript_path"])}',
            'srt_url': f'/output/{os.path.basename(result["srt_path"])}',
            'translation_url': f'/output/{os.path.basename(result["translation_path"])}',
            'translation_srt_url': f'/output/{os.path.basename(result["translation_srt_path"])}'
        }
        
        if result.get('word_level_srt_path'):
            response['word_level_srt_url'] = f'/output/{os.path.basename(result["word_level_srt_path"])}'
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/transcript-only', methods=['POST'])
def extract_transcript_only():
    """Extract transcript from a YouTube video without transcription/translation."""
    data = request.json
    youtube_url = data.get('youtube_url')
    
    if not youtube_url:
        return jsonify({'error': 'YouTube URL is required'}), 400
    
    try:
        # Extract video ID
        video_id = translator.extract_video_id(youtube_url)
        
        # Get transcript from YouTube
        transcript = translator.get_youtube_transcript(video_id)
        
        if not transcript:
            return jsonify({'error': 'No transcript available for this video'}), 404
        
        # Save transcript
        transcript_path = os.path.join(OUTPUT_DIR, f"{video_id}_youtube_transcript.json")
        with open(transcript_path, 'w', encoding='utf-8') as f:
            json.dump(transcript, f, indent=2, ensure_ascii=False)
        
        # Generate SRT from YouTube transcript
        srt_path = os.path.join(OUTPUT_DIR, f"{video_id}_youtube_transcript.srt")
        translator.generate_srt(transcript, srt_path)
        
        response = {
            'video_id': video_id,
            'transcript_url': f'/output/{os.path.basename(transcript_path)}',
            'srt_url': f'/output/{os.path.basename(srt_path)}'
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/output/<path:filename>')
def serve_output(filename):
    """Serve files from the output directory."""
    return send_from_directory(OUTPUT_DIR, filename)

@app.route('/api/models')
def get_models():
    """Get available Whisper models."""
    models = [
        {"id": "tiny", "name": "Tiny (fastest, least accurate)"},
        {"id": "base", "name": "Base (fast, decent accuracy)"},
        {"id": "small", "name": "Small (balanced speed/accuracy)"},
        {"id": "medium", "name": "Medium (slower, more accurate)"},
        {"id": "large", "name": "Large (slowest, most accurate)"}
    ]
    return jsonify(models)

@app.route('/api/languages')
def get_languages():
    """Get available languages for translation."""
    languages = [
        {"code": "english", "name": "English"}
    ]
    return jsonify(languages)

if __name__ == '__main__':
    # Create HTML template if it doesn't exist
    index_html_path = os.path.join(TEMPLATES_DIR, 'index.html')
    if not os.path.exists(index_html_path):
        with open(index_html_path, 'w', encoding='utf-8') as f:
            f.write('''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Translation App</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
    <style>
        body {
            padding-top: 2rem;
            padding-bottom: 2rem;
            background-color: #f8f9fa;
        }
        .header {
            margin-bottom: 2rem;
            text-align: center;
        }
        .form-container {
            background-color: white;
            border-radius: 10px;
            padding: 2rem;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
            margin-bottom: 2rem;
        }
        .results-container {
            background-color: white;
            border-radius: 10px;
            padding: 2rem;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
            display: none;
        }
        .loading {
            text-align: center;
            display: none;
            margin: 2rem 0;
        }
        .spinner-border {
            width: 3rem;
            height: 3rem;
        }
        .result-item {
            margin-bottom: 1rem;
        }
        .youtube-preview {
            margin-top: 1rem;
            margin-bottom: 2rem;
            text-align: center;
        }
        .error-message {
            color: #dc3545;
            margin-top: 1rem;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Video Translation App</h1>
            <p class="lead">Transcribe, translate, and generate subtitles for YouTube videos</p>
        </div>
        
        <div class="form-container">
            <form id="videoForm">
                <div class="mb-3">
                    <label for="youtubeUrl" class="form-label">YouTube Video URL</label>
                    <input type="url" class="form-control" id="youtubeUrl" placeholder="https://www.youtube.com/watch?v=..." required>
                </div>
                
                <div class="mb-3">
                    <label for="targetLanguage" class="form-label">Target Language</label>
                    <select class="form-select" id="targetLanguage">
                        <!-- Will be populated via API -->
                    </select>
                </div>
                
                <div class="mb-3">
                    <label for="modelSize" class="form-label">Whisper Model Size</label>
                    <select class="form-select" id="modelSize">
                        <!-- Will be populated via API -->
                    </select>
                    <div class="form-text">Larger models are more accurate but slower.</div>
                </div>
                
                <div class="mb-3 form-check">
                    <input type="checkbox" class="form-check-input" id="wordLevel" checked>
                    <label class="form-check-label" for="wordLevel">Generate word-level subtitles</label>
                </div>
                
                <div class="mb-3 form-check">
                    <input type="checkbox" class="form-check-input" id="transcriptOnly">
                    <label class="form-check-label" for="transcriptOnly">Extract transcript only (faster)</label>
                </div>
                
                <button type="submit" class="btn btn-primary">Process Video</button>
            </form>
            
            <div class="youtube-preview" id="youtubePreview"></div>
            <div class="error-message" id="errorMessage"></div>
        </div>
        
        <div class="loading" id="loading">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Processing video... This may take a few minutes depending on the video length and model size.</p>
        </div>
        
        <div class="results-container" id="results">
            <h2>Results</h2>
            <div id="resultsList"></div>
        </div>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Fetch available models
            fetch('/api/models')
                .then(response => response.json())
                .then(models => {
                    const modelSelect = document.getElementById('modelSize');
                    models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model.id;
                        option.textContent = model.name;
                        if (model.id === 'small') {
                            option.selected = true;
                        }
                        modelSelect.appendChild(option);
                    });
                });
            
            // Fetch available languages
            fetch('/api/languages')
                .then(response => response.json())
                .then(languages => {
                    const languageSelect = document.getElementById('targetLanguage');
                    languages.forEach(language => {
                        const option = document.createElement('option');
                        option.value = language.code;
                        option.textContent = language.name;
                        if (language.code === 'english') {
                            option.selected = true;
                        }
                        languageSelect.appendChild(option);
                    });
                });
            
            // Handle form submission
            const videoForm = document.getElementById('videoForm');
            videoForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const youtubeUrl = document.getElementById('youtubeUrl').value;
                const targetLanguage = document.getElementById('targetLanguage').value;
                const modelSize = document.getElementById('modelSize').value;
                const wordLevel = document.getElementById('wordLevel').checked;
                const transcriptOnly = document.getElementById('transcriptOnly').checked;
                
                // Show YouTube preview
                const youtubePreview = document.getElementById('youtubePreview');
                const videoId = extractVideoId(youtubeUrl);
                if (videoId) {
                    youtubePreview.innerHTML = `
                        <div class="ratio ratio-16x9" style="max-width: 560px; margin: 0 auto;">
                            <iframe src="https://www.youtube.com/embed/${videoId}" 
                                    title="YouTube video player" 
                                    frameborder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowfullscreen></iframe>
                        </div>
                    `;
                }
                
                // Show loading spinner
                document.getElementById('loading').style.display = 'block';
                document.getElementById('results').style.display = 'none';
                document.getElementById('errorMessage').style.display = 'none';
                
                // Determine which API endpoint to use
                const endpoint = transcriptOnly ? '/api/transcript-only' : '/api/process';
                
                // Prepare request data
                const requestData = {
                    youtube_url: youtubeUrl
                };
                
                if (!transcriptOnly) {
                    requestData.target_language = targetLanguage;
                    requestData.model_size = modelSize;
                    requestData.word_level = wordLevel;
                }
                
                // Send request
                fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(data => {
                            throw new Error(data.error || 'An error occurred');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    // Hide loading spinner
                    document.getElementById('loading').style.display = 'none';
                    
                    // Show results
                    const resultsList = document.getElementById('resultsList');
                    resultsList.innerHTML = '';
                    
                    // Add video ID
                    const videoIdItem = document.createElement('div');
                    videoIdItem.className = 'result-item';
                    videoIdItem.innerHTML = `<strong>Video ID:</strong> ${data.video_id}`;
                    resultsList.appendChild(videoIdItem);
                    
                    // Add transcript links
                    addResultItem(resultsList, 'Transcript (JSON)', data.transcript_url);
                    addResultItem(resultsList, 'Transcript (SRT)', data.srt_url);
                    
                    // Add translation links if available
                    if (data.translation_url && data.translation_url !== data.transcript_url) {
                        addResultItem(resultsList, 'Translation (JSON)', data.translation_url);
                    }
                    
                    if (data.translation_srt_url && data.translation_srt_url !== data.srt_url) {
                        addResultItem(resultsList, 'Translation (SRT)', data.translation_srt_url);
                    }
                    
                    // Add word-level SRT if available
                    if (data.word_level_srt_url) {
                        addResultItem(resultsList, 'Word-level Subtitles (SRT)', data.word_level_srt_url);
                    }
                    
                    document.getElementById('results').style.display = 'block';
                })
                .catch(error => {
                    // Hide loading spinner
                    document.getElementById('loading').style.display = 'none';
                    
                    // Show error message
                    const errorMessage = document.getElementById('errorMessage');
                    errorMessage.textContent = error.message;
                    errorMessage.style.display = 'block';
                });
            });
            
            // Helper function to add a result item
            function addResultItem(container, label, url) {
                const item = document.createElement('div');
                item.className = 'result-item';
                item.innerHTML = `
                    <strong>${label}:</strong> 
                    <a href="${url}" target="_blank" download>Download</a> | 
                    <a href="${url}" target="_blank">View</a>
                `;
                container.appendChild(item);
            }
            
            // Helper function to extract video ID from YouTube URL
            function extractVideoId(url) {
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                const match = url.match(regExp);
                return (match && match[2].length === 11) ? match[2] : null;
            }
            
            // Toggle form fields based on transcript-only checkbox
            document.getElementById('transcriptOnly').addEventListener('change', function(e) {
                const isTranscriptOnly = e.target.checked;
                document.getElementById('targetLanguage').disabled = isTranscriptOnly;
                document.getElementById('modelSize').disabled = isTranscriptOnly;
                document.getElementById('wordLevel').disabled = isTranscriptOnly;
            });
        });
    </script>
</body>
</html>''')
    
    # Create CSS file if it doesn't exist
    css_path = os.path.join(STATIC_DIR, 'style.css')
    if not os.path.exists(css_path):
        with open(css_path, 'w', encoding='utf-8') as f:
            f.write('''/* Main styles */
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
    background-color: #f8f9fa;
}

.container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

h1, h2, h3 {
    color: #2c3e50;
}

/* Form styles */
.form-control, .form-select {
    border-radius: 0.25rem;
    border: 1px solid #ced4da;
    padding: 0.5rem;
    margin-bottom: 1rem;
    width: 100%;
}

.btn {
    cursor: pointer;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-weight: 500;
    transition: all 0.3s ease;
}

.btn-primary {
    background-color: #3498db;
    border: none;
    color: white;
}

.btn-primary:hover {
    background-color: #2980b9;
}

/* Results styles */
.result-link {
    color: #3498db;
    text-decoration: none;
    margin-right: 1rem;
}

.result-link:hover {
    text-decoration: underline;
}

/* Responsive styles */
@media (max-width: 768px) {
    .container {
        padding: 1rem;
    }
}''')
    
    print("Starting web server...")
    app.run(host='0.0.0.0', port=8080, debug=True)
