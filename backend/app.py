from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from .query_engine import answer

app = FastAPI()

# Optional: allow frontend to access backend from another port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify ['http://localhost:3000'] if you build a frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    text: str
    mode: str = "explain"

@app.post("/query")
def query_api(req: QueryRequest):
    response = answer(req.text, mode=req.mode)
    return {"response": response}

