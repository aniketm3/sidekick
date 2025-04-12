from sentence_transformers import SentenceTransformer
import faiss
import pickle
import numpy as np
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Load model + index + metadata
print("Loading model and index...")
model = SentenceTransformer("all-MiniLM-L6-v2")
index = faiss.read_index("backend/index/vector.index")
with open("backend/index/metadata.pkl", "rb") as f:
    metadata = pickle.load(f)

texts = metadata["texts"]
ids = metadata["ids"]

def get_rag_context(query, k=3):
    """Embed query and get top-k matching text chunks"""
    query_vec = model.encode([query])
    D, I = index.search(np.array(query_vec), k)
    return [texts[i] for i in I[0]]

def make_prompt(user_input, context_chunks, mode="explain"):
    context = "\n".join(context_chunks)

    if mode == "explain":
        return f"""
You are a helpful AI assistant.
The user just heard someone say: "{user_input}"

Here is some background info:
{context}

Explain what the user just heard in simple, clear language.
"""
    elif mode == "followup":
        return f"""
You are helping a student prepare for a conversation.
They just heard: "{user_input}"

Here is some background info:
{context}

Suggest one insightful follow-up question they could ask.
"""

def answer(user_input, mode="explain"):
    chunks = get_rag_context(user_input)
    prompt = make_prompt(user_input, chunks, mode=mode)

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content



# === CLI usage ===
if __name__ == "__main__":
    print("Ask me something you just heard in a meeting:")
    q = input("> ")
    mode = input("Mode? (explain/followup): ").strip().lower()
    out = answer(q, mode=mode)
    print("\n🧠 Response:")
    print(out)
