# Legal AI - Batch Document Processing

A CPU-friendly batch document processing system that handles up to 5 files simultaneously with bounded parallelism and LLM concurrency caps.

## Features

- **Batch Upload**: Upload up to 5 documents at once
- **Bounded Parallelism**: Uses half of available CPU cores for processing
- **LLM Concurrency Control**: Limits concurrent LLM calls to 1-2 based on CPU count
- **Real-time Status**: Live polling of job status with progress tracking
- **CPU Monitoring**: Automatic backpressure when CPU usage exceeds 75%
- **File Caching**: Skips re-processing of files with identical content hashes

## Architecture

- **Flask Backend**: RESTful API with background processing
- **Process Pool**: Parallel document processing with worker limits
- **Semaphore Control**: LLM concurrency limiting
- **Status Tracking**: In-memory batch and job status management
- **File Storage**: Organized upload and results directories

## Setup

### 1. Environment Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Ollama Configuration

Set these environment variables for optimal performance:

```bash
# Windows:
set OLLAMA_KEEP_ALIVE=5m
set OLLAMA_NUM_PARALLEL=2

# macOS/Linux:
export OLLAMA_KEEP_ALIVE=5m
export OLLAMA_NUM_PARALLEL=2
```

### 3. Start the Service

```bash
python app.py
```

The service will start on `http://localhost:5001`

### 4. Access the Frontend

Open `http://localhost:5001/static/index.html` in your browser

## API Endpoints

### Batch Upload
```bash
POST /api/upload_batch
Content-Type: multipart/form-data

# Upload up to 5 files
curl -X POST http://localhost:5001/api/upload_batch \
  -F "files=@document1.pdf" \
  -F "files=@document2.pdf" \
  -F "files=@document3.pdf"
```

**Response:**
```json
{
  "success": true,
  "batch_id": "uuid-string",
  "message": "Batch created with 3 files",
  "jobs": [
    {
      "id": "job-uuid-1",
      "filename": "document1.pdf",
      "status": "queued"
    },
    {
      "id": "job-uuid-2", 
      "filename": "document2.pdf",
      "status": "queued"
    },
    {
      "id": "job-uuid-3",
      "filename": "document3.pdf", 
      "status": "queued"
    }
  ]
}
```

### Batch Status
```bash
GET /api/batch_status/{batch_id}

curl http://localhost:5001/api/batch_status/uuid-string
```

**Response:**
```json
{
  "success": true,
  "batch_id": "uuid-string",
  "created_at": "timestamp",
  "completed_count": 2,
  "error_count": 0,
  "jobs": [
    {
      "id": "job-uuid-1",
      "filename": "document1.pdf",
      "status": "done",
      "result_path": "results/document1.json",
      "doc_type": "court_opinion_or_order"
    },
    {
      "id": "job-uuid-2",
      "filename": "document2.pdf", 
      "status": "running",
      "result_path": null,
      "doc_type": null
    },
    {
      "id": "job-uuid-3",
      "filename": "document3.pdf",
      "status": "queued", 
      "result_path": null,
      "doc_type": null
    }
  ]
}
```

### List All Batches
```bash
GET /api/batches

curl http://localhost:5001/api/batches
```

## Processing Pipeline

Each document goes through this pipeline:

1. **File Upload**: Saved with UUID prefix in `uploads/` directory
2. **PDF Parsing**: Text extraction using PyMuPDF
3. **Embedding Generation**: FAISS vector embeddings (cached by content hash)
4. **LLM Extraction**: Legal document analysis with concurrency control
5. **Result Storage**: JSON output saved in `results/` directory

## Concurrency Control

### CPU Workers
- **Formula**: `max(1, CPU_CORES // 2)`
- **Example**: 8-core system → 4 workers
- **Purpose**: Prevents CPU saturation

### LLM Semaphore
- **1-4 cores**: 1 concurrent LLM call
- **5+ cores**: 2 concurrent LLM calls
- **Purpose**: Prevents Ollama overload

### CPU Monitoring
- **Threshold**: 75% CPU usage
- **Action**: Wait 1 second before heavy operations
- **Purpose**: Automatic backpressure

## File Structure

```
ai_service/
├── app.py                 # Main Flask application
├── batch_processor.py     # Batch processing logic
├── requirements.txt       # Python dependencies
├── static/
│   ├── index.html        # Batch upload frontend
│   └── app.js           # Frontend JavaScript
├── uploads/              # Uploaded files (UUID prefixed)
├── results/              # Processing results (JSON)
└── README_BATCH.md       # This file
```

## Frontend Features

- **File Selection**: Drag & drop or click to select up to 5 files
- **File Validation**: Size and format checking
- **Real-time Updates**: 1.5-second polling of job status
- **Progress Tracking**: Visual progress bar and job status
- **Error Handling**: Clear error messages and recovery

## Performance Considerations

### CPU Optimization
- Worker count scales with available cores
- Shortest-job-first scheduling reduces average wait time
- CPU monitoring prevents system overload

### Memory Management
- Files processed in parallel but with limits
- LLM context limited to prevent memory issues
- Automatic cleanup of completed batches

### Network Efficiency
- Status polling every 1.5 seconds
- Batch operations reduce HTTP overhead
- File uploads use multipart form data

## Troubleshooting

### Common Issues

1. **Ollama Connection Failed**
   - Ensure Ollama is running: `ollama serve`
   - Check `OLLAMA_HOST` environment variable

2. **CPU Usage Too High**
   - Reduce `max_workers` in `ConcurrencyManager`
   - Lower `target_util` in `cpu_guard()`

3. **Memory Issues**
   - Reduce `OLLAMA_NUM_PARALLEL`
   - Limit file sizes in frontend validation

4. **File Processing Errors**
   - Check file format support
   - Verify PyMuPDF installation
   - Check file permissions

### Debug Mode

Enable debug logging by modifying `batch_processor.py`:

```python
logging.basicConfig(level=logging.DEBUG)
```

## Future Enhancements

- **Redis Integration**: Replace in-memory storage with Redis
- **Database Storage**: Persistent batch and job tracking
- **WebSocket Updates**: Real-time status updates instead of polling
- **File Type Support**: Additional document formats
- **Cloud Storage**: S3/Google Cloud integration
- **Authentication**: User management and access control

## License

This project is part of the Legal AI Dashboard system.
