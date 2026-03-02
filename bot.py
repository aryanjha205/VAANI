import random
import requests
import urllib.parse

class VaaniAI:
    def __init__(self):
        self.system_prompt = "You are VAANI, a helpful and friendly AI assistant. Answer the user's question clearly and concisely."
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
        
    def generate_response(self, user_message):
        # 0. Quick responses for very short messages to feel "instantly"
        lowered = user_message.lower().strip()
        if lowered in ['hi', 'hello', 'hey', 'hello vaani']:
            return "Hello! How can I help you today? 😊"
        if lowered in ['who are you?', 'who are you', 'what is your name?']:
            return "I am VAANI, your futuristic AI assistant. I'm here to make your messaging experience smarter!"

        # Multi-stage free AI fallback system (No Key Required)
        models = ["openai", "mistral", "llama"]
        
        for model in models:
            url = "https://text.pollinations.ai/"
            payload = {
                "messages": [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "model": model,
                "stream": False,
                "cache": True
            }
            
            try:
                # Very tight timeout for faster model rotation
                response = self.session.post(url, json=payload, timeout=5)
                if response.status_code == 200 and response.text.strip():
                    return response.text.strip()
            except:
                continue # Try next model
        
        # Last ditch: GET request (sometimes bypasses POST issues)
        try:
            clean_msg = urllib.parse.quote(user_message)
            fb_url = f"https://text.pollinations.ai/{clean_msg}?model=openai&cache=true"
            response = self.session.get(fb_url, timeout=5)
            if response.status_code == 200 and response.text.strip():
                return response.text.strip()
        except:
            pass

        return self._fallback_response()

    def _fallback_response(self):
        responses = [
            "I'm experiencing a bit of a brain freeze. Can you say that again? 🥶",
            "My artificial circuits are getting a bit warm! 🤖�",
            "I'm here, but I'm having trouble connecting to my thoughts. �",
            "Give me a moment, my wisdom gears are turning slowly! ⚙️"
        ]
        return random.choice(responses)

# Singleton instance
ai_bot = VaaniAI()

def get_ai_response(message):
    return ai_bot.generate_response(message)
