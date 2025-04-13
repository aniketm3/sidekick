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

class QueryRequest(BaseModel):
    text: str
    mode: str = "explain"
    history: list[dict[str, str]] = []

@app.post("/query")
def query_api(req: QueryRequest):
    response = answer(req.text, mode=req.mode, history=req.history)
    return {"response": response}

