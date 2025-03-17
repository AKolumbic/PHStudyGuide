# Vector Databases for AI Applications

Vector databases have become a fundamental component of modern AI systems, enabling efficient storage, retrieval, and similarity search of high-dimensional vectors that represent text, images, audio, and other data types.

## 1. Embedding Generation and Storage

### Understanding Embeddings

Embeddings are dense numerical representations of data in a high-dimensional space where semantic relationships are preserved through vector proximity. Similar items are positioned closer to each other in this vector space.

**Key Properties of Embeddings:**

- Fixed dimensionality (typically 384-1536 dimensions for language models)
- Dense representation (most values are non-zero)
- Capture semantic meaning rather than just lexical similarity
- Enable similarity comparison using distance metrics

### Embedding Generation Techniques

#### Text Embeddings

```python
# Using OpenAI Embeddings
import openai

def generate_openai_embedding(text):
    response = openai.Embedding.create(
        model="text-embedding-ada-002",
        input=text
    )
    return response['data'][0]['embedding']

# Using Sentence Transformers (open source)
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')
text = "Observability in distributed systems is essential"
embedding = model.encode(text)  # Returns a vector with 384 dimensions
```

#### Image Embeddings

```python
# Using CLIP for image embeddings
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

image = Image.open("server_dashboard.jpg")
inputs = processor(images=image, return_tensors="pt")
image_features = model.get_image_features(**inputs)
image_embedding = image_features.detach().numpy()[0]
```

### Storage Considerations

#### Data Types and Space Efficiency

- **Precision Options:**
  - 32-bit float (4 bytes per dimension): Full precision but larger storage
  - 16-bit float (2 bytes per dimension): Good balance of precision and size
  - 8-bit quantization (1 byte per dimension): Space-efficient with minimal loss

```python
# Example of quantization (float32 -> int8)
import numpy as np

def quantize_vector(vector, min_val=None, max_val=None):
    min_val = min_val if min_val is not None else vector.min()
    max_val = max_val if max_val is not None else vector.max()

    # Scale to 0-255
    quantized = ((vector - min_val) / (max_val - min_val) * 255).astype(np.uint8)

    # Store metadata for dequantization
    metadata = {
        'min_val': min_val,
        'max_val': max_val
    }

    return quantized, metadata

def dequantize_vector(quantized, metadata):
    # Convert back to original scale
    return (quantized.astype(float) / 255) * (metadata['max_val'] - metadata['min_val']) + metadata['min_val']
```

#### Storage Requirements

For a vector database with 1 million embeddings at different dimensions:

| Dimensions | Float32 Size | Float16 Size | Int8 Size |
| ---------- | ------------ | ------------ | --------- |
| 384        | 1.44 GB      | 720 MB       | 360 MB    |
| 768        | 2.87 GB      | 1.44 GB      | 720 MB    |
| 1536       | 5.74 GB      | 2.87 GB      | 1.44 GB   |

## 2. Similarity Search Algorithms

### Distance Metrics

The choice of distance metric significantly impacts search results:

#### Cosine Similarity

```python
import numpy as np
from scipy.spatial.distance import cosine

def cosine_similarity(v1, v2):
    return 1 - cosine(v1, v2)  # Convert distance to similarity

# Example
query_vector = np.array([0.1, 0.2, 0.3])
document_vector = np.array([0.2, 0.3, 0.5])
similarity = cosine_similarity(query_vector, document_vector)
print(f"Cosine similarity: {similarity}")
```

Best for: Text embeddings where direction matters more than magnitude.

#### Euclidean Distance

```python
from scipy.spatial.distance import euclidean

def euclidean_similarity(v1, v2, normalize=True):
    if normalize:
        v1 = v1 / np.linalg.norm(v1)
        v2 = v2 / np.linalg.norm(v2)

    distance = euclidean(v1, v2)
    # Convert distance to similarity (closer to 1 is more similar)
    similarity = 1 / (1 + distance)
    return similarity
```

Best for: Image embeddings and when absolute distances are meaningful.

#### Dot Product

```python
def dot_product_similarity(v1, v2, normalize=True):
    if normalize:
        v1 = v1 / np.linalg.norm(v1)
        v2 = v2 / np.linalg.norm(v2)

    return np.dot(v1, v2)
```

Best for: Unit-normalized vectors (equivalent to cosine similarity but faster).

### Approximate Nearest Neighbor (ANN) Algorithms

Exact similarity search becomes impractical as dataset size grows. ANN algorithms trade perfect accuracy for dramatically improved performance.

#### Hierarchical Navigable Small World (HNSW)

HNSW builds a multi-layered graph structure where nodes are connected to other similar nodes, enabling efficient navigation.

**Key characteristics:**

- Creates a navigable graph with different layers of connections
- Search begins at the top layer and descends to more detailed layers
- Parameters control index quality vs. build time tradeoffs

```python
# Using hnswlib
import hnswlib
import numpy as np

# Sample data
dim = 128
num_elements = 10000
data = np.random.random((num_elements, dim)).astype('float32')

# Create index
index = hnswlib.Index(space='cosine', dim=dim)
index.init_index(max_elements=num_elements, ef_construction=200, M=16)
index.add_items(data)

# Set query parameters
index.set_ef(50)  # Higher values = more accurate but slower

# Query
query_vector = np.random.random(dim).astype('float32')
labels, distances = index.knn_query(query_vector, k=10)
```

#### Inverted File Index (IVF)

IVF divides the vector space into clusters and only searches within the most relevant clusters.

**Key characteristics:**

- Vector space is divided into clusters (using k-means or similar)
- Query vectors are first matched to closest clusters
- Only vectors in selected clusters are compared, improving performance

```python
# Using Faiss
import faiss
import numpy as np

# Sample data
dim = 128
num_elements = 10000
data = np.random.random((num_elements, dim)).astype('float32')

# Create index
nlist = 100  # Number of clusters
quantizer = faiss.IndexFlatL2(dim)
index = faiss.IndexIVFFlat(quantizer, dim, nlist, faiss.METRIC_L2)

# Train the index
index.train(data)
index.add(data)

# Set number of clusters to search
index.nprobe = 10  # More clusters = higher accuracy but slower

# Query
query_vector = np.random.random((1, dim)).astype('float32')
distances, labels = index.search(query_vector, k=10)
```

#### Product Quantization (PQ)

PQ compresses vectors by dividing them into subvectors and quantizing each subvector separately.

**Key characteristics:**

- Divides high-dimensional vectors into smaller segments
- Each segment is quantized using a smaller codebook
- Dramatically reduces memory usage at some cost to accuracy

```python
# Using Faiss with PQ
import faiss
import numpy as np

# Sample data
dim = 128
num_elements = 10000
data = np.random.random((num_elements, dim)).astype('float32')

# Create index with Product Quantization
nlist = 100  # Number of clusters
m = 8  # Number of subquantizers
bits = 8  # Bits per subquantizer
index = faiss.IndexIVFPQ(faiss.IndexFlatL2(dim), dim, nlist, m, bits)

# Train and add data
index.train(data)
index.add(data)

# Set number of clusters to search
index.nprobe = 10

# Query
query_vector = np.random.random((1, dim)).astype('float32')
distances, labels = index.search(query_vector, k=10)
```

### Performance Benchmarks

Performance comparison based on 1M vectors with 768 dimensions:

| Algorithm    | Index Build Time | Query Time (ms) | Recall@10 | Memory Usage |
| ------------ | ---------------- | --------------- | --------- | ------------ |
| Exact Search | N/A              | 500-1000        | 100%      | High         |
| HNSW         | 5-10 min         | 1-5             | 95-99%    | Medium-High  |
| IVF          | 1-2 min          | 5-20            | 90-95%    | Low-Medium   |
| IVF + PQ     | 2-3 min          | 5-10            | 80-90%    | Low          |

## 3. Vector Database Options

### Key Vector Database Platforms

#### Pinecone

**Strengths:**

- Fully managed, serverless vector database
- Automatic scaling and high availability
- Support for metadata filtering
- Real-time vector updates

**Sample Integration:**

```python
import pinecone
import openai

# Initialize Pinecone
pinecone.init(api_key="your-api-key", environment="your-environment")

# Create or connect to an index
index_name = "observability-data"
if index_name not in pinecone.list_indexes():
    pinecone.create_index(
        name=index_name,
        dimension=1536,  # For OpenAI ada-002 embeddings
        metric="cosine"
    )

index = pinecone.Index(index_name)

# Create embedding
text = "High CPU utilization detected in production cluster"
embedding = openai.Embedding.create(
    model="text-embedding-ada-002",
    input=text
)["data"][0]["embedding"]

# Upsert vector with metadata
index.upsert(
    vectors=[
        {
            "id": "alert-1",
            "values": embedding,
            "metadata": {
                "type": "alert",
                "severity": "high",
                "service": "payment-api",
                "timestamp": "2023-05-01T12:34:56Z"
            }
        }
    ]
)

# Query with metadata filtering
query_embedding = openai.Embedding.create(
    model="text-embedding-ada-002",
    input="CPU issues in payment system"
)["data"][0]["embedding"]

results = index.query(
    vector=query_embedding,
    top_k=5,
    include_metadata=True,
    filter={
        "type": "alert",
        "severity": {"$in": ["high", "critical"]}
    }
)
```

#### Weaviate

**Strengths:**

- Open-source vector search engine
- GraphQL API for complex queries
- Multi-modal support (text, images)
- Strong schema and data modeling capabilities

**Sample Integration:**

```python
import weaviate
import openai

# Connect to Weaviate
client = weaviate.Client(
    url="http://localhost:8080"
)

# Define schema
class_obj = {
    "class": "LogEvent",
    "vectorizer": "none",  # We'll provide our own vectors
    "properties": [
        {
            "name": "message",
            "dataType": ["text"]
        },
        {
            "name": "service",
            "dataType": ["string"]
        },
        {
            "name": "severity",
            "dataType": ["string"]
        },
        {
            "name": "timestamp",
            "dataType": ["date"]
        }
    ]
}

# Create schema if it doesn't exist
if not client.schema.contains(class_obj):
    client.schema.create_class(class_obj)

# Create embedding
text = "Database connection timeout after 30 seconds"
embedding = openai.Embedding.create(
    model="text-embedding-ada-002",
    input=text
)["data"][0]["embedding"]

# Add data with vector
client.data_object.create(
    class_name="LogEvent",
    data_object={
        "message": text,
        "service": "database",
        "severity": "error",
        "timestamp": "2023-06-15T08:42:15Z"
    },
    vector=embedding
)

# Query
query_text = "database connection issues"
query_embedding = openai.Embedding.create(
    model="text-embedding-ada-002",
    input=query_text
)["data"][0]["embedding"]

result = (
    client.query
    .get("LogEvent", ["message", "service", "severity", "timestamp"])
    .with_near_vector({"vector": query_embedding})
    .with_where({
        "path": ["severity"],
        "operator": "Equal",
        "valueString": "error"
    })
    .with_limit(5)
    .do()
)
```

#### Milvus

**Strengths:**

- High-performance open-source vector database
- Highly scalable distributed architecture
- Dynamic schema support
- Multiple index types and distance metrics

**Sample Integration:**

```python
from pymilvus import (
    connections,
    utility,
    FieldSchema, CollectionSchema, DataType,
    Collection,
)
import numpy as np

# Connect to Milvus
connections.connect("default", host="localhost", port="19530")

# Create collection
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536),
    FieldSchema(name="message", dtype=DataType.VARCHAR, max_length=1000),
    FieldSchema(name="service", dtype=DataType.VARCHAR, max_length=100),
    FieldSchema(name="severity", dtype=DataType.VARCHAR, max_length=20),
]
schema = CollectionSchema(fields, "A collection for log messages")
collection = Collection("log_events", schema)

# Create index
index_params = {
    "metric_type": "COSINE",
    "index_type": "HNSW",
    "params": {"M": 8, "efConstruction": 200}
}
collection.create_index("embedding", index_params)
collection.load()

# Insert data
entities = [
    [np.random.random(1536).tolist()],  # embedding
    ["Connection timeout to database"],  # message
    ["database-service"],               # service
    ["critical"]                        # severity
]
collection.insert(entities)

# Search
search_params = {"metric_type": "COSINE", "params": {"ef": 10}}
results = collection.search(
    data=[np.random.random(1536).tolist()],
    anns_field="embedding",
    param=search_params,
    limit=3,
    expr="severity == 'critical'"
)
```

#### PostgreSQL with pgvector

**Strengths:**

- Integration with existing PostgreSQL databases
- Familiar SQL interface
- Transactional guarantees
- Combined structured and vector queries

**Sample Integration:**

```python
import psycopg2
import openai
import numpy as np

# Connect to PostgreSQL
conn = psycopg2.connect("dbname=mydatabase user=postgres")
cur = conn.cursor()

# Create table and extension (if not exists)
cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
cur.execute("""
CREATE TABLE IF NOT EXISTS log_events (
    id SERIAL PRIMARY KEY,
    message TEXT,
    service TEXT,
    severity TEXT,
    timestamp TIMESTAMP,
    embedding vector(1536)
)
""")
conn.commit()

# Create index
cur.execute("""
CREATE INDEX IF NOT EXISTS log_events_embedding_idx
ON log_events
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100)
""")
conn.commit()

# Insert data
text = "Memory usage exceeded 95% threshold"
embedding = openai.Embedding.create(
    model="text-embedding-ada-002",
    input=text
)["data"][0]["embedding"]

cur.execute("""
INSERT INTO log_events (message, service, severity, timestamp, embedding)
VALUES (%s, %s, %s, %s, %s)
""", (
    text,
    "web-server",
    "warning",
    "2023-07-20 15:30:00",
    embedding
))
conn.commit()

# Query
query_text = "high memory usage"
query_embedding = openai.Embedding.create(
    model="text-embedding-ada-002",
    input=query_text
)["data"][0]["embedding"]

cur.execute("""
SELECT message, service, severity, timestamp
FROM log_events
WHERE severity IN ('warning', 'critical')
ORDER BY embedding <=> %s
LIMIT 5
""", (query_embedding,))

results = cur.fetchall()
```

### Benchmark Comparison

| Database | Ingestion (vectors/s) | Query Latency (p95) | Scalability | Managed Option | Metadata Filtering |
| -------- | --------------------- | ------------------- | ----------- | -------------- | ------------------ |
| Pinecone | 500-2000              | 20-50ms             | Excellent   | Yes            | Strong             |
| Weaviate | 1000-3000             | 30-80ms             | Good        | Yes            | Strong             |
| Milvus   | 5000-10000            | 10-40ms             | Excellent   | Yes            | Good               |
| pgvector | 200-1000              | 50-200ms            | Limited     | No             | Excellent          |
| Qdrant   | 2000-5000             | 15-60ms             | Good        | Yes            | Strong             |

## 4. Integrating Vector Search with Traditional Databases

### Architecture Patterns

#### Dual Database Approach

Store structured data in traditional databases and embeddings in vector databases, maintaining references between them.

```
┌─────────────────┐                 ┌─────────────────┐
│  PostgreSQL     │                 │  Vector DB      │
│  ───────────    │    Reference    │  ───────────    │
│  - ID           │◄──────────────►│  - Vector ID    │
│  - Metadata     │                 │  - Embedding    │
│  - Full Content │                 │                 │
└─────────────────┘                 └─────────────────┘
```

**Implementation Example:**

```python
# Store document in PostgreSQL
cur.execute("""
INSERT INTO documents (id, title, content, author, created_at)
VALUES (%s, %s, %s, %s, %s) RETURNING id
""", (
    doc_uuid,
    title,
    content,
    author,
    created_at
))
doc_id = cur.fetchone()[0]
conn.commit()

# Store embedding in vector database
embedding = generate_embedding(content)
vector_db.upsert_vectors(
    vectors=[(doc_uuid, embedding)],
    namespace="documents"
)

# Search across both systems
query_embedding = generate_embedding(query_text)
vector_results = vector_db.query(
    vector=query_embedding,
    top_k=100,
    namespace="documents"
)

# Get full document details
doc_ids = [result["id"] for result in vector_results]
cur.execute("""
SELECT id, title, content, author, created_at
FROM documents
WHERE id IN %s
""", (tuple(doc_ids),))
documents = cur.fetchall()

# Rerank by relevance
documents_by_id = {doc[0]: doc for doc in documents}
ranked_results = [
    {
        "id": result["id"],
        "score": result["score"],
        "document": documents_by_id[result["id"]]
    }
    for result in vector_results if result["id"] in documents_by_id
]
```

#### Integrated Solution using Vector Extensions

Use database extensions like pgvector or DuckDB's vector extensions to store both structured data and embeddings in the same system.

**Advantages:**

- ACID transactions across vector and non-vector data
- Simplified architecture
- Combined filtering and vector search in a single query

**Limitations:**

- Less specialized for vector search
- Performance may not match dedicated vector databases
- Scaling limitations for large vector collections

```sql
-- Complex query combining vector search and structured data conditions
SELECT
    title,
    author,
    created_at,
    1 - (embedding <=> query_embedding) AS similarity
FROM
    documents
WHERE
    created_at > '2023-01-01' AND
    category = 'observability' AND
    ARRAY_LENGTH(tags, 1) > 0 AND
    'kubernetes' = ANY(tags)
ORDER BY
    embedding <=> query_embedding
LIMIT 10;
```

### Synchronization Strategies

For dual database approaches, keeping data in sync is essential:

#### Event-Driven Synchronization

```
┌────────────┐    ┌────────────┐    ┌────────────┐
│ Application│    │   Event    │    │  Vector    │
│   with DB  │───►│   Stream   │───►│ Embeddings │
└────────────┘    └────────────┘    └────────────┘
      │                 ▲                 │
      │                 │                 │
      └─────────────────┴─────────────────┘
               Sync/Feedback Loop
```

**Implementation with Apache Kafka:**

```python
from kafka import KafkaProducer, KafkaConsumer
import json

# Producer (when document changes)
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

def publish_document_change(doc_id, operation, content=None):
    producer.send('document-changes', {
        'doc_id': doc_id,
        'operation': operation,  # 'create', 'update', 'delete'
        'content': content
    })

# Consumer (vector database updater)
consumer = KafkaConsumer(
    'document-changes',
    bootstrap_servers=['localhost:9092'],
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

for message in consumer:
    change = message.value

    # Handle based on operation type
    if change['operation'] in ('create', 'update'):
        embedding = generate_embedding(change['content'])
        vector_db.upsert([{
            'id': change['doc_id'],
            'values': embedding
        }])
    elif change['operation'] == 'delete':
        vector_db.delete(ids=[change['doc_id']])
```

#### Batch Synchronization

For systems where real-time synchronization isn't critical:

```python
def sync_databases(last_sync_time):
    # Get changed documents since last sync
    cur.execute("""
    SELECT id, content FROM documents
    WHERE updated_at > %s
    """, (last_sync_time,))

    changed_docs = cur.fetchall()

    # Get deleted documents since last sync
    cur.execute("""
    SELECT id FROM document_deletion_log
    WHERE deleted_at > %s
    """, (last_sync_time,))

    deleted_ids = [row[0] for row in cur.fetchall()]

    # Update vector database
    for doc_id, content in changed_docs:
        embedding = generate_embedding(content)
        vector_db.upsert([{
            'id': doc_id,
            'values': embedding
        }])

    # Delete removed documents
    if deleted_ids:
        vector_db.delete(ids=deleted_ids)

    return datetime.now()
```

## 5. Scaling Vector Search for Large Datasets

### Horizontal Scaling Techniques

As data grows, single-server solutions become inadequate. Horizontal scaling distributes data across multiple nodes.

#### Sharding Strategies

**Hash-Based Sharding:**

- Distribute vectors across nodes based on a hash function applied to vector IDs
- Ensures even distribution but requires querying all shards

**Cluster-Based Sharding:**

- Group similar vectors on the same shard using clustering algorithms
- Query only relevant shards based on the query vector
- More efficient searches but potentially uneven distribution

```python
# Simplified cluster-based sharding example
import numpy as np
from sklearn.cluster import KMeans

def create_shards(vectors, num_shards=10):
    # Create clusters for sharding
    kmeans = KMeans(n_clusters=num_shards, random_state=0)
    cluster_ids = kmeans.fit_predict(vectors)

    # Create shards
    shards = [[] for _ in range(num_shards)]
    for i, cluster_id in enumerate(cluster_ids):
        shards[cluster_id].append(i)

    return shards, kmeans.cluster_centers_

def query_relevant_shards(query_vector, centroids, threshold=3):
    # Calculate distances to all centroids
    distances = [np.linalg.norm(query_vector - centroid) for centroid in centroids]

    # Get indices of closest centroids
    shard_indices = np.argsort(distances)[:threshold]

    return shard_indices
```

### Caching Strategies

Vector search can be computationally expensive. Caching improves performance for common queries.

#### Result Caching

```python
import redis
import hashlib
import json

class VectorSearchCache:
    def __init__(self, redis_client, ttl=3600):
        self.redis = redis_client
        self.ttl = ttl

    def get_cache_key(self, query_vector, filters=None, top_k=10):
        # Create deterministic key from query parameters
        key_parts = [
            hashlib.md5(str(query_vector).encode()).hexdigest(),
            hashlib.md5(str(filters).encode()).hexdigest() if filters else "nofilters",
            str(top_k)
        ]
        return f"vector_search:{':'.join(key_parts)}"

    def get_cached_results(self, query_vector, filters=None, top_k=10):
        key = self.get_cache_key(query_vector, filters, top_k)
        cached = self.redis.get(key)

        if cached:
            return json.loads(cached)
        return None

    def cache_results(self, query_vector, results, filters=None, top_k=10):
        key = self.get_cache_key(query_vector, filters, top_k)
        self.redis.setex(key, self.ttl, json.dumps(results))

# Usage
cache = VectorSearchCache(redis.Redis())
cached_results = cache.get_cached_results(query_vector, filters)

if cached_results:
    return cached_results
else:
    results = vector_db.query(query_vector, filters=filters)
    cache.cache_results(query_vector, results, filters)
    return results
```

#### Vector Quantization for Memory Efficiency

```python
import numpy as np
from sklearn.cluster import KMeans

class VectorQuantizer:
    def __init__(self, n_centroids=256):
        self.n_centroids = n_centroids
        self.kmeans = None

    def fit(self, vectors):
        self.kmeans = KMeans(n_clusters=self.n_centroids)
        self.kmeans.fit(vectors)
        return self

    def encode(self, vectors):
        # Return centroid indices for each vector
        return self.kmeans.predict(vectors)

    def decode(self, indices):
        # Return centroids for given indices
        return self.kmeans.cluster_centers_[indices]

# Usage
quantizer = VectorQuantizer(n_centroids=1024)
quantizer.fit(training_vectors)

# Store compact representation
encoded_vectors = quantizer.encode(vectors)  # Store these integers instead of full vectors

# Reconstruct approximate vectors for search
approximate_vectors = quantizer.decode(encoded_vectors)
```

### Monitoring and Performance Optimization

#### Key Metrics to Monitor

- **Query Latency**: P50, P95, P99 percentiles
- **Throughput**: Queries and updates per second
- **Recall**: Percentage of true nearest neighbors found
- **Index Build Time**: Time to create/update indexes
- **Memory Usage**: Both RAM and disk usage

#### Performance Optimization Techniques

**1. Dimension Reduction:**

```python
from sklearn.decomposition import PCA

# Reduce dimensions while preserving most of the information
pca = PCA(n_components=64)  # From 1536 to 64 dimensions
reduced_vectors = pca.fit_transform(original_vectors)

# When searching
reduced_query = pca.transform([query_vector])[0]
```

**2. Progressive Filtering:**

```python
def search_with_progressive_filtering(query_vector, metadata_filters):
    # Stage 1: Broad semantic search with minimal filters
    initial_results = vector_db.query(
        vector=query_vector,
        top_k=1000,  # Get more results initially
        filter={"severity": {"$in": ["high", "critical"]}}  # Basic filtering
    )

    # Stage 2: Apply more complex filters in memory
    filtered_results = []
    for result in initial_results:
        if (
            result["metadata"]["service"] in ["payment", "auth"] and
            "database" in result["metadata"]["tags"] and
            parse_date(result["metadata"]["timestamp"]) > datetime(2023, 1, 1)
        ):
            filtered_results.append(result)

    # Stage 3: Re-rank results using additional criteria
    scored_results = [(
        result,
        # Combine vector similarity with other factors
        result["score"] * 0.8 + recency_score(result["metadata"]["timestamp"]) * 0.2
    ) for result in filtered_results]

    # Return top K after all filtering and reranking
    return sorted(scored_results, key=lambda x: x[1], reverse=True)[:10]
```

## 6. Vector Databases in Observability Context

### Use Cases for Vector Search in Observability

#### Log Analysis and Clustering

```python
# Process incoming logs
def process_log_entry(log_text, metadata):
    # Generate embedding
    embedding = generate_embedding(log_text)

    # Store in vector database
    vector_db.upsert([{
        "id": str(uuid.uuid4()),
        "values": embedding,
        "metadata": {
            "text": log_text,
            "service": metadata["service"],
            "level": metadata["level"],
            "timestamp": metadata["timestamp"]
        }
    }])

    # Find similar logs for automatic clustering
    similar_logs = vector_db.query(
        vector=embedding,
        top_k=5,
        include_metadata=True
    )

    # If very similar logs exist, update cluster information
    if similar_logs and similar_logs[0]["score"] > 0.95:
        cluster_id = similar_logs[0]["metadata"].get("cluster_id")
        if cluster_id:
            # Add to existing cluster
            update_cluster(cluster_id, log_text, metadata)
            return cluster_id

    # Create new cluster if no match
    return create_new_cluster(log_text, metadata, embedding)
```

#### Anomaly Detection

```python
# Create baseline behavior embeddings
def establish_baseline(service_name, time_window):
    # Get logs from normal operation period
    logs = fetch_logs_for_service(service_name, time_window)

    # Generate embeddings
    embeddings = [generate_embedding(log["message"]) for log in logs]

    # Calculate centroid (average embedding)
    centroid = np.mean(embeddings, axis=0)

    # Calculate average distance and standard deviation from centroid
    distances = [cosine_similarity(centroid, emb) for emb in embeddings]
    avg_distance = np.mean(distances)
    std_distance = np.std(distances)

    return {
        "centroid": centroid,
        "avg_distance": avg_distance,
        "std_distance": std_distance,
        "threshold": avg_distance - (3 * std_distance)  # 3-sigma rule
    }

# Detect anomalies in new logs
def detect_anomalies(new_logs, baseline):
    anomalies = []

    for log in new_logs:
        embedding = generate_embedding(log["message"])
        similarity = cosine_similarity(baseline["centroid"], embedding)

        # If significantly different from baseline, mark as anomaly
        if similarity < baseline["threshold"]:
            anomalies.append({
                "log": log,
                "similarity": similarity,
                "z_score": (similarity - baseline["avg_distance"]) / baseline["std_distance"]
            })

    return anomalies
```

#### Semantic Trace Analysis

```python
# Convert trace spans to embeddings for analysis
def embed_trace(trace):
    # Extract span data
    spans = []
    for span in trace["spans"]:
        # Create textual representation of span
        span_text = f"Service: {span['service']} Operation: {span['name']} " \
                    f"Duration: {span['duration_ms']}ms Status: {span['status']} " \
                    f"Attributes: {json.dumps(span['attributes'])}"
        spans.append(span_text)

    # Create overall trace description
    trace_desc = " ".join(spans)

    # Generate embedding
    embedding = generate_embedding(trace_desc)

    # Store in vector database
    vector_db.upsert([{
        "id": trace["trace_id"],
        "values": embedding,
        "metadata": {
            "trace_id": trace["trace_id"],
            "root_service": trace["spans"][0]["service"],
            "duration_ms": trace["duration_ms"],
            "status": trace["status"],
            "timestamp": trace["timestamp"]
        }
    }])

    return embedding

# Find similar traces for analysis
def find_similar_traces(trace_id, limit=10):
    # Get trace embedding
    trace_data = vector_db.fetch([trace_id])[0]

    # Find similar traces
    similar = vector_db.query(
        vector=trace_data["values"],
        top_k=limit,
        include_metadata=True,
        filter={"trace_id": {"$ne": trace_id}}  # Exclude self
    )

    return similar
```

## Conclusion

Vector databases are revolutionizing how we store, search, and analyze unstructured data in AI applications. They bridge the gap between raw data and machine learning models by providing efficient ways to find semantically similar items.

For observability systems, vector databases offer powerful capabilities for log analysis, anomaly detection, and understanding complex system behaviors. Their ability to capture semantic meaning makes them particularly valuable for finding patterns and insights that traditional databases would miss.

When implementing vector databases, consider:

1. **Choose the right embedding model** for your data type and domain
2. **Select appropriate distance metrics** based on your use case
3. **Balance accuracy and performance** with the right indexing strategy
4. **Consider scaling requirements** early in your architecture
5. **Integrate with existing systems** using appropriate synchronization patterns

As vector search technology continues to mature, we can expect even more efficient algorithms, better integration with traditional databases, and specialized solutions for domain-specific applications like observability.
