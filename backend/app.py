from fastapi import FastAPI, Request, UploadFile
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from query_engine import answer
from dotenv import load_dotenv
import os
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

# Optional: allow frontend to access backend from another port
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000',
                   "https://perplexity-take-home-seven.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/transcribe")
async def transcribe(file: UploadFile):
    try:
        # Check if we're in mock mode (no valid API key or quota)
        if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your-openai-api-key-here":
            print("Using mock transcription (no valid API key)")
            return {"text": "This is a mock transcription for testing. The audio would normally be transcribed by OpenAI Whisper."}
        
        with open("temp_audio.webm", "wb") as f:
            f.write(await file.read())

        with open("temp_audio.webm", "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        print("Transcript", transcript)
        return {"text": transcript}
    except Exception as e:
        print(f"Transcription error: {e}")
        # Fallback to mock if API fails (quota exceeded, etc.)
        print("Falling back to mock transcription")
        return {"text": "Mock transcription (API error): The audio would be transcribed here with a working OpenAI API key and credits."}

class QueryRequest(BaseModel):
    text: str
    mode: str = "explain"
    history: list[dict[str, str]] = []

@app.post("/query")
def query_api(req: QueryRequest):
    try:
        response = answer(req.text, mode=req.mode, history=req.history)
        return {"response": response["answer"], "sources": response["sources"]}
    except Exception as e:
        print(f"Query error: {e}")
        # Fallback response for API errors
        mock_response = f"Mock response for '{req.text}': "
        if req.mode == "explain":
            mock_response += "This would normally be an AI explanation of what you heard, powered by OpenAI GPT and RAG search."
        else:
            mock_response += "Here would be a suggested follow-up question to continue the conversation."
        return {"response": mock_response, "sources": ["Mock Source 1", "Mock Source 2"]}