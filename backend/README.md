# Backend Setup

## Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your OpenAI API key:
   ```bash
   OPENAI_API_KEY=your-actual-openai-api-key-here
   ```

3. Get your API key from: https://platform.openai.com/api-keys

## Installation & Running

1. Install dependencies:
   ```bash
   pip install -r ../requirements.txt
   ```

2. Start the development server:
   ```bash
   uvicorn app:app --reload --port 8000
   ```

The backend will be available at http://localhost:8000

## API Endpoints

- `POST /transcribe` - Upload audio file for transcription via OpenAI Whisper
- `POST /query` - Send text query for RAG-powered responses 