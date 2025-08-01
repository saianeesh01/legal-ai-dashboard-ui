#!/usr/bin/env python3
"""
AI Model Warmup Daemon
Runs as a separate process to warm up the AI model when the container starts
"""

import os
import time
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def wait_for_flask():
    """Wait for Flask application to be ready"""
    max_attempts = 30
    for attempt in range(max_attempts):
        try:
            response = requests.get('http://localhost:5001/health', timeout=5)
            if response.status_code == 200:
                logger.info("Flask application is ready")
                return True
        except Exception as e:
            logger.debug(f"Flask not ready yet (attempt {attempt + 1}/{max_attempts}): {e}")
            time.sleep(2)
    
    logger.warning("Flask application did not become ready in time")
    return False

def perform_warmup():
    """Perform AI model warmup"""
    if not os.getenv('WARMUP_ON_START', '').lower() == 'true':
        logger.info("Warmup disabled (WARMUP_ON_START != 'true')")
        return
    
    logger.info("Starting AI model warmup process...")
    
    # Import and use our warmup utility
    from warmup_util import warm_up_model
    
    ollama_host = os.getenv('OLLAMA_HOST', 'localhost:11434')
    success = warm_up_model(ollama_host, retries=3)
    
    if success:
        logger.info("AI model warmup completed successfully")
    else:
        logger.warning("All warmup attempts failed, but service will continue running")

def main():
    logger.info("Warmup daemon starting...")
    
    # Wait for Flask to be ready
    if not wait_for_flask():
        logger.error("Flask application not ready, skipping warmup")
        return
    
    # Perform warmup
    perform_warmup()
    
    logger.info("Warmup daemon completed")

if __name__ == "__main__":
    main()