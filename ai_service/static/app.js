/**
 * Legal AI Batch Document Processing Frontend
 * Handles file selection, batch upload, and real-time status polling
 */

class BatchProcessor {
    constructor() {
        this.selectedFiles = [];
        this.currentBatchId = null;
        this.pollingInterval = null;
        this.apiBaseUrl = 'http://localhost:5001'; // AI service URL

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // Upload button click
        document.getElementById('uploadBtn').addEventListener('click', () => {
            this.startBatchProcessing();
        });
    }

    handleFileSelection(files) {
        // Clear previous selection
        this.selectedFiles = [];

        // Limit to 5 files
        const maxFiles = 5;
        const selectedFiles = Array.from(files).slice(0, maxFiles);

        if (files.length > maxFiles) {
            this.showMessage(`Only the first ${maxFiles} files will be processed.`, 'info');
        }

        // Process selected files
        selectedFiles.forEach(file => {
            if (this.isValidFile(file)) {
                this.selectedFiles.push({
                    file: file,
                    name: file.name,
                    size: this.formatFileSize(file.size),
                    type: file.type
                });
            }
        });

        this.updateFileDisplay();
        this.updateUploadButton();
    }

    isValidFile(file) {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        const maxSize = 50 * 1024 * 1024; // 50MB

        if (file.size > maxSize) {
            this.showMessage(`File ${file.name} is too large. Maximum size is 50MB.`, 'error');
            return false;
        }

        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
            this.showMessage(`File ${file.name} is not a supported format.`, 'error');
            return false;
        }

        return true;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateFileDisplay() {
        const container = document.getElementById('selectedFiles');

        if (this.selectedFiles.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        container.innerHTML = '';

        this.selectedFiles.forEach((fileInfo, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-name">${fileInfo.name}</div>
                <div class="file-size">${fileInfo.size}</div>
                <button class="remove-file" onclick="batchProcessor.removeFile(${index})">×</button>
            `;
            container.appendChild(fileItem);
        });
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateFileDisplay();
        this.updateUploadButton();
    }

    updateUploadButton() {
        const uploadBtn = document.getElementById('uploadBtn');
        uploadBtn.disabled = this.selectedFiles.length === 0;
    }

    async startBatchProcessing() {
        if (this.selectedFiles.length === 0) {
            this.showMessage('Please select at least one file to process.', 'error');
            return;
        }

        try {
            // Disable upload button
            const uploadBtn = document.getElementById('uploadBtn');
            uploadBtn.disabled = true;
            uploadBtn.textContent = '🔄 Processing...';

            // Create FormData
            const formData = new FormData();
            this.selectedFiles.forEach(fileInfo => {
                formData.append('files', fileInfo.file);
            });

            // Upload files
            const response = await fetch(`${this.apiBaseUrl}/api/upload_batch`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                this.currentBatchId = result.batch_id;
                this.showMessage(`Batch created successfully! Processing ${result.jobs.length} files.`, 'success');
                this.startStatusPolling();
                this.showStatusSection();
            } else {
                throw new Error(result.error || 'Unknown error occurred');
            }

        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage(`Upload failed: ${error.message}`, 'error');

            // Re-enable upload button
            const uploadBtn = document.getElementById('uploadBtn');
            uploadBtn.disabled = false;
            uploadBtn.textContent = '🚀 Start Batch Processing';
        }
    }

    async startStatusPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        // Poll every 1.5 seconds
        this.pollingInterval = setInterval(async () => {
            await this.updateBatchStatus();
        }, 1500);

        // Initial status update
        await this.updateBatchStatus();
    }

    async updateBatchStatus() {
        if (!this.currentBatchId) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/batch_status/${this.currentBatchId}`);

            if (!response.ok) {
                throw new Error(`Status check failed: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                this.updateStatusDisplay(result);

                // Check if all jobs are complete
                const allComplete = result.jobs.every(job =>
                    job.status === 'done' || job.status === 'error'
                );

                if (allComplete) {
                    this.stopStatusPolling();
                    this.showMessage('All jobs completed!', 'success');
                }
            }

        } catch (error) {
            console.error('Status update error:', error);
            this.showMessage(`Status update failed: ${error.message}`, 'error');
        }
    }

    updateStatusDisplay(batchStatus) {
        const jobList = document.getElementById('jobList');
        const progressFill = document.getElementById('progressFill');

        // Calculate progress
        const totalJobs = batchStatus.jobs.length;
        const completedJobs = batchStatus.completed_count + batchStatus.error_count;
        const progressPercent = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

        progressFill.style.width = `${progressPercent}%`;

        // Update job list
        jobList.innerHTML = '';

        batchStatus.jobs.forEach(job => {
            const jobItem = document.createElement('li');
            jobItem.className = 'job-item';

            let details = '';
            if (job.status === 'done') {
                details = `Document type: ${job.doc_type || 'Unknown'}`;
                if (job.result_path) {
                    details += ` | Result saved to: ${job.result_path}`;
                }
            } else if (job.status === 'error') {
                details = `Error: ${job.error_message || 'Unknown error'}`;
            } else if (job.status === 'running') {
                details = 'Processing document...';
            } else {
                details = 'Waiting in queue...';
            }

            jobItem.innerHTML = `
                <div class="job-header">
                    <div class="job-filename">${job.filename}</div>
                    <div class="job-status status-${job.status}">${job.status}</div>
                </div>
                <div class="job-details">${details}</div>
                ${job.status === 'error' ? `<div class="error-message">${job.error_message || 'Unknown error'}</div>` : ''}
            `;

            jobList.appendChild(jobItem);
        });
    }

    stopStatusPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    showStatusSection() {
        document.getElementById('statusSection').classList.remove('hidden');
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('messageContainer');

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;

        container.appendChild(messageElement);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 5000);
    }
}

// Initialize the batch processor when the page loads
let batchProcessor;
document.addEventListener('DOMContentLoaded', () => {
    batchProcessor = new BatchProcessor();
});

// Global function for file removal
window.removeFile = function (index) {
    if (batchProcessor) {
        batchProcessor.removeFile(index);
    }
};
