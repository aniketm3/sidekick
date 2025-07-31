# Sidekick

Sidekick is a **RAG query engine** that transcribes what you may hear in conversation or interviews and proides either a simple explanation or a follow-up question, with sources, and a historical context of your prior queries. This is designed to be as lightweight and subtle as possible, providing you exactly what you need on the fly.

<img width="841" alt="Screenshot 2025-04-13 at 7 01 36 PM" src="https://github.com/user-attachments/assets/8dc54372-05b2-4386-a4d9-e428bcea1fa1" />

## Features:
- voice transcription via OpenAI's Whisper
- manual text input
- two modes: (1) `explain` for a quick summary to understand what is being said and (2) `follow-up` to quickly get a smart question to continue the conversation
- contextual memory: storing the past query-response pairs which are injected into prompt history for better responses
- automatic timer expiration of 8 seconds to reduce user's work
- cited sources from the training corpus which were retreived to generate each response

## Tech Stack:
- frontend: Reach.js and deployed to Vercel
- backend: FastAPI and Render
- audio transcription: OpenAI Whisper API
- embedding model: SentenceTransformers
- RAG search algorithm: FAISS
- LLM: OpenAI GPT-3.5

## RAG System:
The app uses RAG pipeline to ensure responses are technically sound. The document corpus is a set of ~10 AI related abstracts and blogs covering arXiv papers (Scaling Laws, VQ-VAEs, etc), OpenAI & Anthropic blog posts, and onboarding docs for multimodal models. Each document is structured into a `.json` format like:
```
{
  "id": "3",
  "source": "OpenAI blog",
  "text": "The attention mechanism allows models to dynamically focus on different parts of the input sequence..."
}
```
These are all indexed using the `all-MiniLM-L6-v2` embedding model from SentenceTransformers to best capture relative positionings. The embeddings are then searched using the FAISS search method, retrieving the top-k (3) similar embeddings.
