import requests

def generate_completion(prompt, model="llama3.2:1b"):
    """
    Generate a completion using Ollama's API
    """
    url = "http://localhost:8008/api/generate"

    data = {
        "model": model,
        "prompt": prompt,
        "stream": False,  # Set to True if you want to stream the response
    }

    response = requests.post(url, json=data)
    return response.json()

print(generate_completion("Why is the sky blue?"))

