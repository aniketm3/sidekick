import os

def get_index_directory():
    """
    Get the index directory path, using persistent disk if available
    
    For Render deployment:
    - Mount persistent disk to /app/persistent_data
    - Set PERSISTENT_DISK_PATH=/app/persistent_data
    
    For local development:
    - Falls back to ./index directory
    """
    # Check for persistent disk path (Render deployment)
    persistent_disk_path = os.getenv("PERSISTENT_DISK_PATH")
    
    if persistent_disk_path and os.path.exists(persistent_disk_path):
        index_dir = os.path.join(persistent_disk_path, "index")
    else:
        # Fallback to local development path
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        index_dir = os.path.join(BASE_DIR, "index")
    
    # Ensure the directory exists
    os.makedirs(index_dir, exist_ok=True)
    
    return index_dir

def get_index_paths():
    """Get the full paths for index files"""
    index_dir = get_index_directory()
    
    return {
        "index_dir": index_dir,
        "vector_index": os.path.join(index_dir, "vector.index"),
        "metadata": os.path.join(index_dir, "metadata.pkl"),
        "rebuild_status": os.path.join(index_dir, "rebuild_status.json")
    }