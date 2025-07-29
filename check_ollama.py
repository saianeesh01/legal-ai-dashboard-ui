import requests
import time
import sys

OLLAMA_URL = "http://host.docker.internal:11434/api/tags"

def check_ollama(timeout=60):
    start = time.time()
    while time.time() - start < timeout:
        try:
            resp = requests.get(OLLAMA_URL, timeout=5)
            if resp.status_code == 200:
                print("✅ Ollama is running and reachable")
                sys.exit(0)
        except Exception:
            pass
        print("⏳ Waiting for Ollama to start...")
        time.sleep(5)

    print("❌ Ollama is not responding within timeout")
    sys.exit(1)

if __name__ == "__main__":
    check_ollama()
