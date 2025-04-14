from sentence_transformers import SentenceTransformer
import faiss
import json
import numpy as np
import pickle
import os

# Load the documents
with open("backend/data/ai_docs.json", "r") as f:
    docs = json.load(f)

texts = [doc["text"] for doc in docs]
sources = [doc["source"] for doc in docs]
ids = [doc["id"] for doc in docs]

# Load embedding model
print("Loading model...")
model = SentenceTransformer("all-MiniLM-L6-v2")

# Embed the texts
print("Embedding texts...")
embeddings = model.encode(texts)

# Build the FAISS index
print("Building index...")
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(np.array(embeddings))

# Create output folder if missing
os.makedirs("backend/index", exist_ok=True)

# Save the index and metadata
faiss.write_index(index, "backend/index/vector.index")
with open("backend/index/metadata.pkl", "wb") as f:
    pickle.dump({"texts": texts, "ids": ids, "sources": sources}, f)

print("Index built and saved.")
