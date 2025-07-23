import faiss
import numpy as np
import time
import json
import pickle
import os
import psutil
from datetime import datetime
from typing import List, Dict, Any, Tuple
from openai import OpenAI
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Prevent tokenizer multiprocessing issues
os.environ['TOKENIZERS_PARALLELISM'] = 'false'
os.environ['OMP_NUM_THREADS'] = '1'

load_dotenv()

class EmbeddingsBenchmark:
    def __init__(self):
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.sentence_model = None
        self.test_queries = []
        self.documents = []
        self.document_sources = []
        self.results = {}
        
    def load_current_data(self):
        """Load current documents and metadata"""
        from config import get_index_paths
        paths = get_index_paths()
        
        try:
            with open(paths["metadata"], "rb") as f:
                metadata = pickle.load(f)
            self.documents = metadata.get("texts", [])
            self.document_sources = metadata.get("sources", [])
            print(f"Loaded {len(self.documents)} documents")
        except Exception as e:
            print(f"Error loading documents: {e}")
            return False
        return True
    
    def generate_test_queries(self) -> List[str]:
        """Generate test queries based on document content"""
        queries = [
            # Generic AI/ML questions
            "What is machine learning?",
            "How do neural networks work?",
            "What are the types of machine learning?",
            "Explain deep learning",
            "What is artificial intelligence?",
            
            # Technical questions
            "How to train a model?",
            "What is overfitting?",
            "Explain gradient descent",
            "What are transformers in AI?",
            "How does backpropagation work?",
            
            # Application questions
            "What are AI applications?",
            "How is AI used in business?",
            "What are the challenges in AI?",
            "Future of artificial intelligence",
            "AI ethics and considerations",
            
            # Interview-specific questions
            "Common AI interview questions",
            "Technical skills for AI jobs",
            "How to prepare for ML interviews",
            "AI project examples",
            "Best practices in machine learning"
        ]
        self.test_queries = queries
        return queries
    
    def get_openai_embedding(self, text: str, model: str = "text-embedding-3-small") -> List[float]:
        """Get OpenAI embedding for text"""
        try:
            response = self.openai_client.embeddings.create(
                input=text,
                model=model
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"OpenAI embedding error: {e}")
            return None
    
    def get_sentence_transformer_embedding(self, text: str, model_name: str = "all-MiniLM-L6-v2") -> List[float]:
        """Get Sentence Transformer embedding for text"""
        try:
            if self.sentence_model is None or getattr(self.sentence_model, '_model_name', None) != model_name:
                # Clear previous model
                if self.sentence_model is not None:
                    del self.sentence_model
                    import gc
                    gc.collect()
                
                print(f"Loading Sentence Transformer model: {model_name}")
                # Set environment variable to prevent multiprocessing issues
                import os
                os.environ['TOKENIZERS_PARALLELISM'] = 'false'
                
                self.sentence_model = SentenceTransformer(model_name)
                self.sentence_model._model_name = model_name  # Store model name for comparison
            return self.sentence_model.encode(text).tolist()
        except Exception as e:
            print(f"Sentence Transformer embedding error: {e}")
            return None
    
    def measure_memory_usage(self) -> float:
        """Get current memory usage in MB"""
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / 1024 / 1024
    
    def build_faiss_index(self, embeddings: np.ndarray, index_type: str = "IndexFlatL2") -> Tuple[Any, float, float]:
        """Build FAISS index and measure performance"""
        start_time = time.time()
        start_memory = self.measure_memory_usage()
        
        dimension = embeddings.shape[1]
        num_vectors = len(embeddings)
        
        if index_type == "IndexFlatL2":
            # Exact L2 distance search (brute force)
            index = faiss.IndexFlatL2(dimension)
        elif index_type == "IndexFlatIP":
            # Exact inner product search (cosine similarity when normalized)
            index = faiss.IndexFlatIP(dimension)
        elif index_type == "IndexHNSW":
            # Hierarchical Navigable Small World - fast approximate search
            index = faiss.IndexHNSWFlat(dimension, 32)
            index.hnsw.efConstruction = 200
            index.hnsw.efSearch = 128  # Search-time parameter
        elif index_type == "IndexIVFFlat":
            # Inverted file with flat quantizer - good for large datasets
            nlist = max(16, min(4096, num_vectors // 39))  # Rule of thumb: sqrt(N)
            quantizer = faiss.IndexFlatL2(dimension)
            index = faiss.IndexIVFFlat(quantizer, dimension, nlist)
            index.train(embeddings.astype('float32'))
        elif index_type == "IndexLSH":
            # Locality Sensitive Hashing - very fast approximate search
            index = faiss.IndexLSH(dimension, min(256, dimension * 4))
        elif index_type == "IndexPQ":
            # Product Quantization - memory efficient
            m = min(8, dimension // 4)  # Number of subquantizers
            if m > 0 and dimension % m == 0:
                index = faiss.IndexPQ(dimension, m, 8)
                index.train(embeddings.astype('float32'))
            else:
                # Fallback to flat index if PQ parameters don't work
                index = faiss.IndexFlatL2(dimension)
        else:
            raise ValueError(f"Unknown index type: {index_type}")
        
        index.add(embeddings.astype('float32'))
        
        build_time = time.time() - start_time
        memory_usage = self.measure_memory_usage() - start_memory
        
        return index, build_time, memory_usage
    
    def search_index(self, index: Any, query_embedding: np.ndarray, k: int = 3) -> Tuple[List[int], List[float], float]:
        """Search index and measure query time"""
        start_time = time.time()
        
        query_embedding = query_embedding.reshape(1, -1).astype('float32')
        distances, indices = index.search(query_embedding, k)
        
        query_time = time.time() - start_time
        
        return indices[0].tolist(), distances[0].tolist(), query_time
    
    def benchmark_embedding_model(self, model_config: Dict[str, str]) -> Dict[str, Any]:
        """Benchmark a specific embedding model"""
        model_name = model_config["name"]
        model_type = model_config["type"]
        
        print(f"\nBenchmarking {model_name}...")
        
        # Generate embeddings for documents
        print("Generating document embeddings...")
        start_time = time.time()
        embeddings = []
        
        for i, doc in enumerate(self.documents):
            if model_type == "openai":
                emb = self.get_openai_embedding(doc, model_config.get("model", "text-embedding-3-small"))
            else:  # sentence-transformers
                emb = self.get_sentence_transformer_embedding(doc, model_config.get("model", "all-MiniLM-L6-v2"))
            
            if emb is None:
                return {"error": f"Failed to generate embedding for document {i}"}
            
            embeddings.append(emb)
        
        embeddings = np.array(embeddings)
        embedding_time = time.time() - start_time
        
        # Test different FAISS index types
        index_results = {}
        
        for index_type in ["IndexFlatL2", "IndexFlatIP", "IndexHNSW", "IndexIVFFlat", "IndexLSH", "IndexPQ"]:
            try:
                print(f"  Testing {index_type}...")
                
                # Build index
                index, build_time, build_memory = self.build_faiss_index(embeddings, index_type)
                
                # Test queries
                query_times = []
                relevance_scores = []
                
                for query in self.test_queries[:10]:  # Test subset for speed
                    if model_type == "openai":
                        query_emb = self.get_openai_embedding(query, model_config.get("model", "text-embedding-3-small"))
                    else:
                        query_emb = self.get_sentence_transformer_embedding(query, model_config.get("model", "all-MiniLM-L6-v2"))
                    
                    if query_emb is None:
                        continue
                    
                    query_emb = np.array(query_emb)
                    _, distances, query_time = self.search_index(index, query_emb, k=3)
                    
                    query_times.append(query_time)
                    # Simple relevance score (inverse of average distance)
                    relevance_scores.append(1.0 / (np.mean(distances) + 1e-6))
                
                index_results[index_type] = {
                    "build_time": build_time,
                    "build_memory_mb": build_memory,
                    "avg_query_time_ms": np.mean(query_times) * 1000,
                    "avg_relevance_score": np.mean(relevance_scores),
                    "total_queries": len(query_times)
                }
                
            except Exception as e:
                index_results[index_type] = {"error": str(e)}
        
        return {
            "model_name": model_name,
            "embedding_time": embedding_time,
            "embedding_dimension": embeddings.shape[1],
            "document_count": len(embeddings),
            "index_results": index_results
        }
    
    def run_benchmark(self) -> Dict[str, Any]:
        """Run complete benchmark suite"""
        print("Starting Embeddings Benchmark")
        print("=" * 50)
        
        if not self.load_current_data():
            return {"error": "Failed to load document data"}
        
        self.generate_test_queries()
        print(f"Generated {len(self.test_queries)} test queries")
        
        # Define models to test
        models_to_test = [
            {
                "name": "OpenAI text-embedding-3-small (current)",
                "type": "openai",
                "model": "text-embedding-3-small"
            },
            {
                "name": "OpenAI text-embedding-3-large",
                "type": "openai", 
                "model": "text-embedding-3-large"
            },
            {
                "name": "Sentence Transformers all-MiniLM-L6-v2",
                "type": "sentence-transformers",
                "model": "all-MiniLM-L6-v2"
            },
            {
                "name": "Sentence Transformers all-mpnet-base-v2",
                "type": "sentence-transformers", 
                "model": "all-mpnet-base-v2"
            }
        ]
        
        benchmark_results = {
            "timestamp": datetime.now().isoformat(),
            "document_count": len(self.documents),
            "test_query_count": len(self.test_queries),
            "models": {}
        }
        
        for model_config in models_to_test:
            try:
                result = self.benchmark_embedding_model(model_config)
                benchmark_results["models"][model_config["name"]] = result
                
                # Clear sentence transformer model to free memory
                if model_config["type"] == "sentence-transformers":
                    self.sentence_model = None
                    import gc
                    gc.collect()
                    
            except Exception as e:
                print(f"Error benchmarking {model_config['name']}: {e}")
                benchmark_results["models"][model_config["name"]] = {"error": str(e)}
        
        return benchmark_results
    
    def print_results(self, results: Dict[str, Any]):
        """Print formatted benchmark results"""
        print("\n" + "=" * 80)
        print("EMBEDDINGS BENCHMARK RESULTS")
        print("=" * 80)
        
        print(f"Timestamp: {results['timestamp']}")
        print(f"Documents tested: {results['document_count']}")
        print(f"Test queries: {results['test_query_count']}")
        
        for model_name, model_results in results["models"].items():
            print(f"\n{'-' * 60}")
            print(f"MODEL: {model_name}")
            print(f"{'-' * 60}")
            
            if "error" in model_results:
                print(f"❌ ERROR: {model_results['error']}")
                continue
            
            print(f"Embedding dimension: {model_results['embedding_dimension']}")
            print(f"Total embedding time: {model_results['embedding_time']:.2f}s")
            
            print("\nFAISS Index Comparison:")
            print(f"{'Index Type':<15} {'Build Time':<12} {'Memory (MB)':<12} {'Query Time (ms)':<15} {'Relevance':<10}")
            print("-" * 70)
            
            for index_type, index_results in model_results["index_results"].items():
                if "error" in index_results:
                    print(f"{index_type:<15} ERROR: {index_results['error']}")
                else:
                    print(f"{index_type:<15} {index_results['build_time']:.3f}s{'':<6} "
                          f"{index_results['build_memory_mb']:.1f}{'':<7} "
                          f"{index_results['avg_query_time_ms']:.2f}{'':<10} "
                          f"{index_results['avg_relevance_score']:.3f}")
    
    def save_results(self, results: Dict[str, Any], filename: str = "benchmark_results.json"):
        """Save results to JSON file"""
        filepath = os.path.join(os.path.dirname(__file__), filename)
        with open(filepath, "w") as f:
            json.dump(results, f, indent=2)
        print(f"\nResults saved to: {filepath}")

def main():
    benchmark = EmbeddingsBenchmark()
    results = benchmark.run_benchmark()
    benchmark.print_results(results)
    benchmark.save_results(results)

if __name__ == "__main__":
    main()