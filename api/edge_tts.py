import json
import asyncio
from http.server import BaseHTTPRequestHandler
import edge_tts

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        try:
            body = json.loads(post_data.decode('utf-8'))
        except json.JSONDecodeError:
            self._send_error(400, "Invalid JSON body")
            return

        text = body.get('text', '')
        voice = body.get('voice', 'en-US-EricNeural')
        rate = body.get('rate', '+0%')
        pitch = body.get('pitch', '+0Hz')

        if not text or len(text.strip()) < 2:
            self._send_error(400, "Text is required")
            return

        # Truncate to reasonable limits to prevent timeouts
        text = text[:1500]

        try:
            # Generate audio bytes asynchronously
            audio_data = asyncio.run(self._generate_audio(text, voice, rate, pitch))
            
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'audio/mpeg')
            self.send_header('Content-Length', str(len(audio_data)))
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            
            self.wfile.write(audio_data)
        except Exception as e:
            print(f"Edge TTS Error: {e}")
            self._send_error(500, f"TTS Generation Error: {str(e)}")

    async def _generate_audio(self, text: str, voice: str, rate: str, pitch: str) -> bytes:
        from io import BytesIO
        audio_stream = BytesIO()
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_stream.write(chunk["data"])
                
        return audio_stream.getvalue()

    def _send_error(self, status: int, message: str):
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode('utf-8'))
