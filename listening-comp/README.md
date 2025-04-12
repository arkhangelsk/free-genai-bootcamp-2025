# 🔊 Language Listening Comprehension App

## A Quick Look on What I build

**Arabic Listining Practice Quiz App**

![Full Screenshot](arabic-quiz-app/screenshots/arabic-quiz-app.png)

### Solution Overview
This app has a robust system for generating Arabic quiz questions, either from YouTube content when available or from high-quality fallback content when extraction isn't possible.

This app provides different options:

#### Quiz Mode
- Standard Mode (Text & Audio)
- Listening Mode (Audio Only - Hide Arabic Text)
- Dictation Mode (Write what you hear)

#### Question Language:
- English Questions
- Arabic Questions

#### Listening Options
- Auto-play audio for each question
- Repeat audio automatically (3 times)
- Slower audio playback

Check more details & screenshots [here](arabic-quiz-app/README.md)

## 📋 Task Overview

**Objective:** Build a Language Listening Comprehension App

**Description:**
Create an app that helps students practice listening comprehension for language learning.

### 🔑 Key Tasks:
- Extract transcriptions from YouTube listening comprehension videos.
- Format the transcribed content for insertion into a vector store.
- Allow users to input a topic of interest.
- Retrieve contextually similar questions from the vector store based on the input topic.
- Generate a new listening comprehension question in the frontend UI.
- Synthesize audio so students can listen and practice.

## 💻 Technical Requirements:
* Text to Speech (TTS) eg. Amazon Polly, Google Text to Speech etc.
* (Optional) Speech to Text, (ASR) Transcribe. eg Amazon Transcribe, OpenWhisper
* Use Youtube Transcript API to download Transcript from Youtube
* LLM + Tool Use “Agent” to generate listening comprehension questions
* Use a vector store to store the transcript
* AI Coding Assistant eg. Amazon Developer Q + Windsurf
* Other AI Assistant - ChatGPT, Claude, DeepSeek R1, Google Gemini
* Frontend eg. Streamlit.
* Guardrails

## 🔧 Possible Technical Uncertainties

### General
* I only know a little Arabic so analyzing the quality of generated content will be a challenge!
* Finding good TSS for Arabic is going to be a challenge. 

### YouTube Transcription Extraction
* Can I pull transcripts for the target videos in Arabic?
* Are there legal risks in using YouTube transcripts and deriving content from them?
* What if videos doesn't have high-quality transcripts? How to mitigate this scenario?
* What tools/technologies can I use for Audio?
  * [Pydub](https://github.com/jiaaro/pydub)
* Will the generated audio sound natural and easy to understand?

### Vector Store Integration
* How to map vague or broad topics to useful content from the vector store?
* What tools to use for embeddings? 

## Domain knowledge acquired through technical uncertainty
Initially, my understanding of Arabic language processing tools was limited. Through this exercise, I learned that Arabic presents unique challenges for Text-to-Speech (TTS) as described below:

### 🎬 **YouTube Video Transcription**
- Some YouTube videos either lacked transcripts entirely or had poor-quality, auto-generated ones. To address this, I implemented logic to filter and only use videos with reliable **Arabic transcripts**.
- **Transcript formatting** was challenging. The LLM struggled to consistently convert raw transcripts into well-structured question formats. I had to iterate on the prompt multiple times to achieve reliable and meaningful output.
- I was also concerned about the legal constraints of using TouTube content. This problem can be mitigated by using content labeled for reuse or by contacting content creators for permissions. This led me to research about available datasets on platforms like Kaggle & open source Arabic dictionaries, to ensure reliable data sourcing. 

### 📚 **Pulling Data from the Vector Store**
- **Relevance issues:** The vector store didn’t always return semantically relevant results. Initial queries based on embeddings weren’t consistently aligned with the user's topic or intent.
- This occasionally resulted in **confusing or irrelevant practice questions**. I improved this by applying prompt engineering techniques—especially by providing few-shot examples to guide the LLM toward better question generation.

### 🔊 **Text-to-Speech (TTS)**
- Initially, my understanding of Arabic language processing tools was limited. Through this exercise, I learned that Arabic presents unique challenges for Text-to-Speech (TTS) output. I evaluated various TTS providers (e.g., **Google Cloud TTS**, **Edge TTS**, **Web Speech API**) to generate high-quality voice output. 
- The goal was to find a solution that supports **natural-sounding Arabic**, offers **dialect options**, and integrates easily into the app.
- I was quite impressed by Web Speech API that can generate voice pronunciation for each Arabic word which is supported in most modern browsers (Chrome, Edge, Safari). 

You can check my exploration of different text to speech options [here](text-to-speech-experiments/README.md).

I even tried different `edge-tts` voices. Check it out [here](../listening-comp/text-to-speech/edge-tts-app/README.md) - App credit: [HuggingFace: Edge-TTS-Text-to-Speech](https://huggingface.co/spaces/innoai/Edge-TTS-Text-to-Speech)

Overall, these uncertainties helped me acquire practical knowledge in:
* The challenges of Arabic speech and language processing
* Selecting appropriate tools and models for multilingual applications
* Designing fallback and filtering mechanisms for real-world data