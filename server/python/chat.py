import sys
import io
import requests
import os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

API_KEY = os.getenv("OPENAI_API_KEY")

def chat_with_ai(user_input):
    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are Ava, a friendly AI. Reply in 1–2 short sentences."},
                    {"role": "user", "content": user_input}
                ],
                "max_tokens": 60
            }
        )

        data = response.json()
        return data["choices"][0]["message"]["content"].strip()

    except Exception as e:
        return f"Error: {str(e)}"


if __name__ == "__main__":
    user_message = sys.argv[1]
    print(chat_with_ai(user_message))