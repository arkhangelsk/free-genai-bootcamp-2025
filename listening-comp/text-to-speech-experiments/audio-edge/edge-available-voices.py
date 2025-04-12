# This script lists all available Arabic voices using the edge-tts library.

import edge_tts
import asyncio

async def list_arabic_voices():
    voices = await edge_tts.list_voices()
    print("Available Arabic voices:")
    for v in voices:
        if "ar-SA" in v["ShortName"]:
            print(f"- {v['ShortName']}")

asyncio.run(list_arabic_voices())
