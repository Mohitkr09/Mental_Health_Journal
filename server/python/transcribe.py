# server/python/voice_transcribe.py
from flask import Blueprint, request, jsonify
import subprocess
import tempfile
import os

voice_bp = Blueprint("voice", __name__)

@voice_bp.route("/api/auth/voice-transcribe", methods=["POST"])
def voice_transcribe():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            file.save(tmp.name)
            input_path = tmp.name

        # ✅ Run your existing transcribe.py script
        result = subprocess.run(
            ["python", "python/transcribe.py", input_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        os.remove(input_path)

        if result.returncode != 0:
            print("⚠️ Transcription error:", result.stderr)
            return jsonify({"error": "Transcription failed"}), 500

        transcript = result.stdout.strip()
        return jsonify({"text": transcript})

    except Exception as e:
        print("⚠️ Voice transcription error:", e)
        return jsonify({"error": str(e)}), 500
