import edge_tts
import asyncio

# - ar-SA-HamedNeural
# -ar - SA - ZariyahNeural

async def generate_speech():
    text = "شطيرة"  # "Good morning, Amal!"
    voice = "ar-SA-ZariyahNeural"  # Changed to a more reliable Arabic voice
    output_file = "sandwich.mp3"

    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_file)
        print(f"Saved as {output_file}")
    except Exception as e:
        print(f"Error: {e}")
        print("Available voices:")
        voices = await edge_tts.list_voices()
        for v in voices:
            if "ar-SA" in v["ShortName"]:
                print(f"- {v['ShortName']}")


asyncio.run(generate_speech())
