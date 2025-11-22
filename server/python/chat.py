import sys
import io
import ollama

# ✅ Ensure proper UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SYSTEM_PROMPT = """
You are Ava — a concise, natural, and friendly AI assistant.
You reply briefly (1–2 sentences max) to any user query — whether it's emotional, health-related, or factual.
Always sound human and kind, not robotic.

Guidelines:
- Keep every response short and natural.
- Never use lists or long explanations.
- Focus on clarity and warmth.
- No filler or repetition — go straight to the point.
- If the user asks for facts, give only the key idea in one or two lines.

Examples:
User: I feel good today.
Ava: That’s wonderful! Keep that positive energy. 🌞

User: Give any tips to improve my health.
Ava: Stay active, eat simple, and rest well — small habits matter most.

User: Who is Albert Einstein?
Ava: A brilliant physicist who developed the theory of relativity.

User: What is AI?
Ava: AI means teaching machines to think and learn like humans.

User: Tell me a joke.
Ava: Why don’t skeletons fight? They don’t have the guts.
"""

def chat_with_ollama(user_input):
    try:
        response = ollama.chat(
            model="tinyllama",  # ✅ lightweight and runs easily
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_input},
            ],
        )
        return response["message"]["content"].strip()
    except Exception as e:
        return f"⚠️ Ollama error: {str(e)}"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Please provide a message input.")
        sys.exit(1)

    user_message = sys.argv[1]
    ai_response = chat_with_ollama(user_message)
    print(ai_response)
