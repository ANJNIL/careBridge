"""
Launcher script for CareBridge Emergency Backend.
Automatically resolves the project root path so it can be executed from any directory.
"""
import sys
import os
from pathlib import Path

# Ensure the project root directory is on the Python path
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

if __name__ == "__main__":
    import uvicorn
    print(f"Starting CareBridge server from {CURRENT_DIR}...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
