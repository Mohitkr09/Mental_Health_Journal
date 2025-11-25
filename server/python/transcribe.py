import sys
import os
from faster_whisper import WhisperModel

# Load fast English model
model = WhisperModel("small.en", device="cpu", compute_type="int8")

def transcribe_audio(audio_path):
    """Return English transcription."""
    segments, info = model.transcribe(audio_path, beam_size=5)

    print("\nWHISPER SEGMENTS:", file=sys.stderr)
    lines = []
    for seg in segments:
        print(f"[{seg.start:.2f} → {seg.end:.2f}] {seg.text}", file=sys.stderr)
        lines.append(seg.text.strip())

    text = " ".join(lines).strip()

    # Return text even if one segment exists
    if text:
        return text

    return "No speech detected"


if __name__ == "__main__":
    input_audio = sys.argv[1]

    print("DEBUG INPUT:", input_audio, file=sys.stderr)
    print("DEBUG SIZE:", os.path.getsize(input_audio), "bytes", file=sys.stderr)

    result = transcribe_audio(input_audio)

    # PRINT ONLY THE FINAL TEXT FOR NODE TO READ
    print(result)
