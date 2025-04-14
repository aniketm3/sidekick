Sidekick

Sidekick is a RAG query engine that transcribes what you may hear in conversation or interviews and proides either a simple explanation or a follow-up question, with sources, and a historical context of your prior queries. This is designed to be as lightweight and subtle as possible, providing you exactly what you need on the fly.

<img width="841" alt="Screenshot 2025-04-13 at 7 01 36 PM" src="https://github.com/user-attachments/assets/8dc54372-05b2-4386-a4d9-e428bcea1fa1" />

Features:
- voice transcription via OpenAI's Whisper
- manual text input
- two modes: (1) 'explain' for a quick summary to understand what is being said and (2) 'follow-up' to quicklyget a smart question to continue the conversation
- contextual memory: storing the past query-response pairs which are injected into prompt history for better responses
- automatic timer expiration of 8 seconds to reduce user's work

Tech Stack:
- frontend: Reach.js and deployed to Vercel
- backend: FastAPI and Render
- audio transcription: OpenAI Whisper API
- embedding model: SentenceTransformers
- RAG search algorithm: FAISS
- LLM: OpenAI GPT-3.5

Quick links:
- 
