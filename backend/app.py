from fastapi import FastAPI, Request, UploadFile, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from query_engine import answer
from dotenv import load_dotenv
import os
from openai import OpenAI
import pickle
import json
import uuid
from datetime import datetime
from typing import List, Optional

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Interview data storage (in production, use a proper database)
INTERVIEWS_FILE = "backend/interviews.json"

def load_interviews():
    """Load interviews from JSON file"""
    try:
        if os.path.exists(INTERVIEWS_FILE):
            with open(INTERVIEWS_FILE, 'r') as f:
                return json.load(f)
        return {}
    except Exception as e:
        print(f"Error loading interviews: {e}")
        return {}

def save_interviews(interviews_data):
    """Save interviews to JSON file"""
    try:
        os.makedirs(os.path.dirname(INTERVIEWS_FILE), exist_ok=True)
        with open(INTERVIEWS_FILE, 'w') as f:
            json.dump(interviews_data, f, indent=2)
    except Exception as e:
        print(f"Error saving interviews: {e}")

def get_interview_by_id(interview_id: str):
    """Get interview by ID"""
    interviews = load_interviews()
    return interviews.get(interview_id)

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

class InterviewCreateRequest(BaseModel):
    title: str
    company: str = ""
    role: str = ""
    topics: str = ""
    description: str = ""

class DocumentAddRequest(BaseModel):
    title: str
    content: str
    source: str = ""

class Document(BaseModel):
    id: str
    title: str
    content: str
    source: str
    word_count: int
    created_at: str

class Interview(BaseModel):
    id: str
    title: str
    company: str
    role: str
    topics: str
    description: str
    documents: List[Document]
    created_at: str
    updated_at: str

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

@app.get("/corpus")
def get_corpus():
    """Get the corpus information - documents, sources, and metadata"""
    try:
        # Load the metadata from the pickle file
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        meta_path = os.path.join(BASE_DIR, "index/metadata.pkl")
        
        with open(meta_path, "rb") as f:
            metadata = pickle.load(f)
        
        # Structure the corpus data for frontend consumption
        corpus_data = []
        texts = metadata.get("texts", [])
        sources = metadata.get("sources", [])
        ids = metadata.get("ids", [])
        
        for i, (text, source, doc_id) in enumerate(zip(texts, sources, ids)):
            corpus_data.append({
                "id": doc_id,
                "title": source,  # Use source as title
                "content": text,
                "source": source,
                "word_count": len(text.split()),
                "index": i
            })
        
        return {
            "documents": corpus_data,
            "total_count": len(corpus_data),
            "corpus_info": {
                "total_documents": len(corpus_data),
                "total_words": sum(len(text.split()) for text in texts)
            }
        }
    
    except Exception as e:
        print(f"Corpus retrieval error: {e}")
        # Fallback mock data
        return {
            "documents": [
                {
                    "id": "mock_1",
                    "title": "Mock Research Paper 1",
                    "content": "This is a mock research paper for demonstration purposes.",
                    "source": "Mock Journal 2024",
                    "word_count": 12,
                    "index": 0
                }
            ],
            "total_count": 1,
            "corpus_info": {
                "total_documents": 1,
                "total_words": 12
            }
        }

# Interview Management Endpoints

@app.get("/interviews")
def get_interviews():
    """Get all interviews"""
    try:
        interviews_data = load_interviews()
        interviews_list = []
        
        for interview_id, interview in interviews_data.items():
            interviews_list.append({
                "id": interview_id,
                "title": interview["title"],
                "company": interview.get("company", ""),
                "role": interview.get("role", ""),
                "topics": interview.get("topics", ""),
                "document_count": len(interview.get("documents", [])),
                "created_at": interview["created_at"],
                "updated_at": interview["updated_at"]
            })
        
        # Sort by updated_at descending
        interviews_list.sort(key=lambda x: x["updated_at"], reverse=True)
        
        return {"interviews": interviews_list}
    except Exception as e:
        print(f"Error getting interviews: {e}")
        return {"interviews": []}

@app.post("/interviews")
def create_interview(request: InterviewCreateRequest):
    """Create a new interview"""
    try:
        interview_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        interview_data = {
            "id": interview_id,
            "title": request.title,
            "company": request.company,
            "role": request.role,
            "topics": request.topics,
            "description": request.description,
            "documents": [],
            "created_at": now,
            "updated_at": now
        }
        
        interviews = load_interviews()
        interviews[interview_id] = interview_data
        save_interviews(interviews)
        
        return {"interview": interview_data}
    except Exception as e:
        print(f"Error creating interview: {e}")
        raise HTTPException(status_code=500, detail="Failed to create interview")

@app.get("/interviews/{interview_id}")
def get_interview(interview_id: str):
    """Get specific interview with documents"""
    try:
        interview = get_interview_by_id(interview_id)
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        return {"interview": interview}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting interview {interview_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get interview")

@app.post("/interviews/{interview_id}/documents")
def add_document_to_interview(interview_id: str, request: DocumentAddRequest):
    """Add a document to an interview"""
    try:
        interviews = load_interviews()
        interview = interviews.get(interview_id)
        
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        document_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        document = {
            "id": document_id,
            "title": request.title,
            "content": request.content,
            "source": request.source or request.title,
            "word_count": len(request.content.split()),
            "created_at": now
        }
        
        interview["documents"].append(document)
        interview["updated_at"] = now
        
        interviews[interview_id] = interview
        save_interviews(interviews)
        
        return {"document": document, "message": "Document added successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding document to interview {interview_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to add document")

@app.post("/interviews/{interview_id}/suggest-papers")
def suggest_papers_for_interview(interview_id: str):
    """Generate AI suggestions for relevant papers based on interview details"""
    try:
        print(f"POST /interviews/{interview_id}/suggest-papers - Getting suggestions...")
        interview = get_interview_by_id(interview_id)
        print(f"Interview found: {interview is not None}")
        
        if not interview:
            print("Interview not found, returning 404")
            raise HTTPException(status_code=404, detail="Interview not found")
        
        print(f"Interview details: {interview}")
        
        # Check if we're in mock mode
        api_key = os.getenv("OPENAI_API_KEY")
        print(f"OpenAI API key present: {api_key is not None and api_key != 'your-openai-api-key-here'}")
        
        if not api_key or api_key == "your-openai-api-key-here":
            print("Using mock suggestions (no valid API key)")
            return {
                "suggestions": [
                    {
                        "title": "Mock Paper 1: Machine Learning Fundamentals",
                        "reason": "Relevant for ML engineer interviews"
                    },
                    {
                        "title": "Mock Paper 2: System Design Patterns",
                        "reason": "Important for senior engineering roles"
                    }
                ]
            }
        
        print("Making OpenAI API request for suggestions...")
        
        # Create prompt for AI suggestions
        prompt = f"""
Given this interview preparation context:
- Company: {interview.get('company', 'Not specified')}
- Role: {interview.get('role', 'Not specified')}
- Topics: {interview.get('topics', 'Not specified')}
- Description: {interview.get('description', 'Not specified')}

Suggest 5 relevant research papers, academic topics, or technical concepts that would be valuable to study for this interview. 

Format your response as a JSON array with objects containing 'title' and 'reason' fields.
Example: [{{"title": "Paper/Topic Name", "reason": "Why this is relevant"}}]
        """
        
        print(f"OpenAI prompt: {prompt}")
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        
        print(f"OpenAI response received: {response.choices[0].message.content}")
        
        try:
            suggestions = json.loads(response.choices[0].message.content)
            print(f"Parsed suggestions: {suggestions}")
            return {"suggestions": suggestions}
        except json.JSONDecodeError as json_error:
            print(f"JSON decode error: {json_error}")
            print(f"Raw response content: {response.choices[0].message.content}")
            # Fallback if AI doesn't return valid JSON
            return {
                "suggestions": [
                    {
                        "title": "Technical fundamentals for the role",
                        "reason": "Based on your interview description, studying core technical concepts would be beneficial"
                    }
                ]
            }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating suggestions for interview {interview_id}: {e}")
        print(f"Exception type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return {"suggestions": []}