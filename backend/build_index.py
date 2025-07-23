import faiss
import json
import numpy as np
import pickle
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Load the documents
with open("backend/data/ai_docs.json", "r") as f:
    docs = json.load(f)

texts = [doc["text"] for doc in docs]
sources = [doc["source"] for doc in docs]
ids = [doc["id"] for doc in docs]

# Generate embeddings using OpenAI
print("Generating embeddings with OpenAI...")
embeddings = []

for i, text in enumerate(texts):
    print(f"Embedding document {i+1}/{len(texts)}")
    response = client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    embeddings.append(response.data[0].embedding)

embeddings = np.array(embeddings)

# Build the FAISS index
print("Building index...")
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(np.array(embeddings))

# Get paths using persistent disk configuration
from config import get_index_paths
paths = get_index_paths()

# Save the index and metadata
faiss.write_index(index, paths["vector_index"])
with open(paths["metadata"], "wb") as f:
    pickle.dump({"texts": texts, "ids": ids, "sources": sources}, f)

print("Index built and saved.")
