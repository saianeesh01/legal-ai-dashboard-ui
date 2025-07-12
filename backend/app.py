from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# In-memory job status store (for demo)
jobs = {}

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'No file part', 400
    file = request.files['file']
    if file.filename == '':
        return 'No selected file', 400
    job_id = str(uuid.uuid4())
    filepath = os.path.join(UPLOAD_FOLDER, f"{job_id}_{file.filename}")
    file.save(filepath)
    jobs[job_id] = {'pct': 0, 'state': 'PROCESSING'}
    # Simulate processing (in real app, use background job)
    jobs[job_id]['pct'] = 100
    jobs[job_id]['state'] = 'DONE'
    return jsonify({'job_id': job_id})

@app.route('/api/status/<job_id>', methods=['GET'])
def job_status(job_id):
    job = jobs.get(job_id)
    if not job:
        return jsonify({'state': 'ERROR', 'pct': 0}), 404
    return jsonify(job)

@app.route('/api/query', methods=['POST'])
def query_document():
    data = request.get_json()
    job_id = data.get('job_id')
    question = data.get('question')
    # Dummy answer for demo
    return jsonify({
        'answer': f"Pretend answer to: {question}",
        'context': [
            {'page': 1, 'text': 'Sample context from page 1.'},
            {'page': 2, 'text': 'Sample context from page 2.'}
        ]
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
