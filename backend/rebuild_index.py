import faiss
import json
import numpy as np
import pickle
import os
from datetime import datetime
import uuid
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def load_interviews():
    """Load interviews from JSON file"""
    interviews_file = os.path.join(os.path.dirname(__file__), "backend/interviews.json")
    try:
        if os.path.exists(interviews_file):
            with open(interviews_file, 'r') as f:
                return json.load(f)
        return {}
    except Exception as e:
        print(f"Error loading interviews: {e}")
        return {}

def get_all_documents():
    """Get all documents from both original corpus and interviews"""
    texts = []
    sources = []
    ids = []
    
    # Load existing original corpus if it exists
    from config import get_index_paths
    paths = get_index_paths()
    meta_path = paths["metadata"]
    
    if os.path.exists(meta_path):
        print("Loading existing original corpus documents...")
        try:
            with open(meta_path, "rb") as f:
                metadata = pickle.load(f)
            
            # Only load documents that are NOT from interviews
            all_texts = metadata.get("texts", [])
            all_sources = metadata.get("sources", [])  
            all_ids = metadata.get("ids", [])
            
            for i, doc_id in enumerate(all_ids):
                if not doc_id.startswith("interview_"):
                    texts.append(all_texts[i])
                    sources.append(all_sources[i])
                    ids.append(all_ids[i])
            
            print(f"Loaded {len(texts)} original corpus documents")
        except Exception as e:
            print(f"Error loading original corpus: {e}")
    else:
        print("No existing original corpus found")
    
    # Add interview documents
    interviews_data = load_interviews()
    interview_doc_count = 0
    
    for interview_id, interview in interviews_data.items():
        for doc in interview.get("documents", []):
            texts.append(doc["content"])
            sources.append(f"{doc.get('source', doc['title'])} (Interview: {interview['title']})")
            ids.append(f"interview_{doc['id']}")
            interview_doc_count += 1
    
    print(f"Added {interview_doc_count} interview documents")
    print(f"Total documents for embedding: {len(texts)}")
    
    return texts, sources, ids

def rebuild_index(progress_callback=None):
    """Rebuild the complete FAISS index with all documents"""
    try:
        if progress_callback:
            progress_callback(0, "Starting index rebuild...")
        
        # Get all documents
        texts, sources, ids = get_all_documents()
        
        if not texts:
            raise Exception("No documents found to build index")
        
        if progress_callback:
            progress_callback(20, "Generating embeddings with OpenAI...")
        
        # Generate embeddings using OpenAI
        print("Generating embeddings for all documents using OpenAI...")
        embeddings = []
        
        for i, text in enumerate(texts):
            if progress_callback and i % 10 == 0:
                progress = 20 + int((i / len(texts)) * 50)  # 20-70% range
                progress_callback(progress, f"Embedding document {i+1}/{len(texts)}")
            
            response = client.embeddings.create(
                input=text,
                model="text-embedding-3-small"
            )
            embeddings.append(response.data[0].embedding)
        
        embeddings = np.array(embeddings)
        
        if progress_callback:
            progress_callback(70, "Building FAISS index...")
        
        # Build FAISS index
        print("Building FAISS index...")
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(np.array(embeddings))
        
        if progress_callback:
            progress_callback(85, "Saving index and metadata...")
        
        # Get paths using persistent disk configuration
        from config import get_index_paths
        paths = get_index_paths()
        
        index_dir = paths["index_dir"]
        index_path = paths["vector_index"]
        metadata_path = paths["metadata"]
        
        if os.path.exists(index_path):
            backup_time = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_index_path = os.path.join(index_dir, f"vector.index.backup_{backup_time}")
            backup_metadata_path = os.path.join(index_dir, f"metadata.pkl.backup_{backup_time}")
            
            print(f"Creating backup: {backup_index_path}")
            os.rename(index_path, backup_index_path)
            os.rename(metadata_path, backup_metadata_path)
        
        # Save new index and metadata
        faiss.write_index(index, index_path)
        
        metadata = {
            "texts": texts,
            "sources": sources,
            "ids": ids,
            "last_rebuilt": datetime.now().isoformat(),
            "total_documents": len(texts),
            "embedding_model": "text-embedding-3-small"
        }
        
        with open(metadata_path, "wb") as f:
            pickle.dump(metadata, f)
        
        # Save rebuild status
        status_path = paths["rebuild_status"]
        status = {
            "last_rebuild": datetime.now().isoformat(),
            "status": "completed",
            "total_documents": len(texts),
            "original_docs": len(texts) - sum(1 for id in ids if id.startswith("interview_")),
            "interview_docs": sum(1 for id in ids if id.startswith("interview_")),
            "rebuild_id": str(uuid.uuid4())
        }
        
        with open(status_path, "w") as f:
            json.dump(status, f, indent=2)
        
        if progress_callback:
            progress_callback(100, "Index rebuild completed successfully!")
        
        print(f"Index rebuild completed successfully!")
        print(f"Total documents: {len(texts)}")
        print(f"Index saved to: {index_path}")
        print(f"Metadata saved to: {metadata_path}")
        
        return {
            "status": "success",
            "total_documents": len(texts),
            "index_path": index_path,
            "metadata_path": metadata_path,
            "rebuild_time": datetime.now().isoformat()
        }
        
    except Exception as e:
        error_msg = f"Index rebuild failed: {str(e)}"
        print(error_msg)
        
        # Save error status
        try:
            from config import get_index_paths
            paths = get_index_paths()
            status_path = paths["rebuild_status"]
            status = {
                "last_rebuild": datetime.now().isoformat(),
                "status": "failed",
                "error": str(e),
                "rebuild_id": str(uuid.uuid4())
            }
            with open(status_path, "w") as f:
                json.dump(status, f, indent=2)
        except:
            pass
            
        if progress_callback:
            progress_callback(100, f"Rebuild failed: {str(e)}")
            
        return {
            "status": "error",
            "error": str(e),
            "rebuild_time": datetime.now().isoformat()
        }

if __name__ == "__main__":
    print("Starting index rebuild...")
    result = rebuild_index()
    
    if result["status"] == "success":
        print("Rebuild completed successfully!")
    else:
        print(f"Rebuild failed: {result.get('error', 'Unknown error')}")