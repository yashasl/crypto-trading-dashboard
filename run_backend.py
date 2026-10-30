#!/usr/bin/env python3
"""
Run the Trading Dashboard Backend server.
Usage:
    pip install -r requirements.txt
    python run.py
"""

import os
import sys
from pathlib import Path

# Add parent directory to path so binancedata.py can be imported if needed
sys.path.insert(0, str(Path(__file__).parent.parent))

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
