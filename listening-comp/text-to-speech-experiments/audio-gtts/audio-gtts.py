from gtts import gTTS

# Arabic text
arabic_text = "صباح الخير يا أمل"

# Convert text to speech
tts = gTTS(text=arabic_text, lang="ar")

# Save the output file
tts.save("good_morning_amal.mp3")

print("Audio file saved as 'good_morning_amal.mp3'")
