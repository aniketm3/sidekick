from sentence_transformers import SentenceTransformer
import faiss
import json
import numpy as np
import pickle
import os
from datetime import datetime
import uuid

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
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    meta_path = os.path.join(BASE_DIR, "index/metadata.pkl")
    
    if os.path.exists(meta_path):
        print("Loading existing original corpus documents...")
        try:
            with open(meta_path, "rb") as f:
                metadata = pickle.load(f)
            
            original_texts = metadata.get("texts", [])
            original_sources = metadata.get("sources", [])  
            original_ids = metadata.get("ids", [])
            
            texts.extend(original_texts)
            sources.extend(original_sources)
            ids.extend(original_ids)
            
            print(f"Loaded {len(original_texts)} original corpus documents")
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
            progress_callback(20, "Loading embedding model...")
            
        # Load embedding model
        print("Loading SentenceTransformer model...")
        model = SentenceTransformer("all-MiniLM-L6-v2")
        
        if progress_callback:
            progress_callback(30, "Generating embeddings...")
        
        # Generate embeddings
        print("Generating embeddings for all documents...")
        embeddings = model.encode(texts, show_progress_bar=True)
        
        if progress_callback:
            progress_callback(70, "Building FAISS index...")
        
        # Build FAISS index
        print("Building FAISS index...")
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(np.array(embeddings))
        
        if progress_callback:
            progress_callback(85, "Saving index and metadata...")
        
        # Create output directory
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        index_dir = os.path.join(BASE_DIR, "index")
        os.makedirs(index_dir, exist_ok=True)
        
        # Create backup of existing index
        index_path = os.path.join(index_dir, "vector.index")
        metadata_path = os.path.join(index_dir, "metadata.pkl")
        
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
            "embedding_model": "all-MiniLM-L6-v2"
        }
        
        with open(metadata_path, "wb") as f:
            pickle.dump(metadata, f)
        
        # Save rebuild status
        status_path = os.path.join(index_dir, "rebuild_status.json")
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
            BASE_DIR = os.path.dirname(os.path.abspath(__file__))
            status_path = os.path.join(BASE_DIR, "index/rebuild_status.json")
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