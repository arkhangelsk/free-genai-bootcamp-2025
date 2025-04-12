import requests

API_URL = "https://api-inference.huggingface.co/models/facebook/mms-tts-ar"
headers = {"Authorization": f"Bearer YOUR_HUGGINGFACE_API_KEY"}

arabic_text = "صباح الخير يا أمل!"

response = requests.post(API_URL, headers=headers, json={"inputs": arabic_text})

# Save the output
with open("output.wav", "wb") as f:
    f.write(response.content)
