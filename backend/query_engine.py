from sentence_transformers import SentenceTransformer
import faiss
import pickle
import numpy as np
import os
from openai import OpenAI
from dotenv import load_dotenv
from config import get_index_paths

load_dotenv()

# Load model + index + metadata
print("Loading model and index...")

# Get paths using persistent disk configuration
paths = get_index_paths()
index_path = paths["vector_index"]
meta_path = paths["metadata"]

model = SentenceTransformer("all-MiniLM-L6-v2")
index = faiss.read_index(index_path)
with open(meta_path, "rb") as f:
    metadata = pickle.load(f)

texts = metadata.get("texts", [])
ids = metadata.get("ids", [])  
sources = metadata.get("sources", [])

print(f"Loaded {len(texts)} documents from unified index")
if "last_rebuilt" in metadata:
    print(f"Index last rebuilt: {metadata['last_rebuilt']}")

def get_rag_context(query, k=3):
    """Embed query and get top-k matching text chunks"""
    query_vec = model.encode([query])
    D, I = index.search(np.array(query_vec), k)
    return [{"text": texts[i], "source": sources[i]} for i in I[0]]


def make_prompt(user_input, context_chunks, mode="explain", history=[]):
    context = "\n".join([chunk["text"] for chunk in context_chunks])

    #accounting for the historical q/a's and injects into the prompt
    history_str = ""
    for prev in history[-3:]:
        history_str += f"\nQ: {prev['q']}\nA: {prev['a']}\n"

    if mode == "explain":
        return f"""
You are a helpful AI assistant.
The user just heard someone say: "{user_input}"

Here is some background info:
{context}

Here is the previous discussion:
{history_str}

Explain what the user just heard in simple, clear language.
"""
    elif mode == "followup":
        return f"""
You are helping a student prepare for a conversation.
They just heard: "{user_input}"

Here is some background info:
{context}

Here is the previous discussion:
{history_str}

Suggest one insightful follow-up question they could ask.
"""

def answer(user_input, mode="explain", history=None):
    if history is None:
        history = []

    chunks = get_rag_context(user_input)
    prompt = make_prompt(user_input, chunks, mode=mode)

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )

    return {
        "answer": response.choices[0].message.content,
        "sources": [chunk["source"] for chunk in chunks]
    }




# === CLI usage ===
if __name__ == "__main__":
    print("Ask me something you just heard in a meeting:")
    q = input("> ")
    mode = input("Mode? (explain/followup): ").strip().lower()
    out = answer(q, mode=mode)
    print("\n Response:")
    print(out)
