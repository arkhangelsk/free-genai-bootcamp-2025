import gradio as gr
import edge_tts
import asyncio
import tempfile
import os


async def get_voices():
    voices = await edge_tts.list_voices()
    return {
        f"{v['ShortName']} - {v['Locale']} ({v['Gender']})": v["ShortName"]
        for v in voices
    }


async def text_to_speech(text, voice, rate, pitch):
    if not text.strip():
        return None, "Please enter text to convert."
    if not voice:
        return None, "Please select a voice."

    voice_short_name = voice.split(" - ")[0]
    rate_str = f"{rate:+d}%"
    pitch_str = f"{pitch:+d}Hz"
    communicate = edge_tts.Communicate(
        text, voice_short_name, rate=rate_str, pitch=pitch_str
    )
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp_file:
        tmp_path = tmp_file.name
        await communicate.save(tmp_path)
    return tmp_path, None


async def tts_interface(text, voice, rate, pitch):
    audio, warning = await text_to_speech(text, voice, rate, pitch)
    if warning:
        return audio, gr.Warning(warning)
    return audio, None


async def create_demo():
    voices = await get_voices()

    description = """
    Customize the speech rate and pitch using the given settings . A value of 0 represents the default; positive numbers increase the rate or pitch, while negative numbers decrease them.
    """

    demo = gr.Interface(
        fn=tts_interface,
        inputs=[
            gr.Textbox(label="Input Text", lines=5),
            gr.Dropdown(
                choices=[""] + list(voices.keys()), label="Select Voice", value=""
            ),
            gr.Slider(
                minimum=-50,
                maximum=50,
                value=0,
                label="Speech Rate Adjustment (%)",
                step=1,
            ),
            gr.Slider(
                minimum=-20, maximum=20, value=0, label="Pitch Adjustment (Hz)", step=1
            ),
        ],
        outputs=[
            gr.Audio(label="Generated Audio", type="filepath"),
            gr.Markdown(label="Warning", visible=False),
        ],
        title="Edge TTS Text-to-Speech",
        description=description,
        analytics_enabled=False,
        allow_flagging="manual",
        api_name=None,
    )
    return demo


async def main():
    demo = await create_demo()
    demo.queue(default_concurrency_limit=5)
    demo.launch(show_api=False)


if __name__ == "__main__":
    asyncio.run(main())
