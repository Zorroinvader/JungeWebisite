#!/bin/bash
# Start script for VPS - properly handles PORT environment variable

# Get PORT from environment or use default 8000
PORT=${PORT:-8000}

# Start uvicorn with the port
exec uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port "$PORT"

