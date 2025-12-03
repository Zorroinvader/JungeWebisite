#!/bin/bash
# Start script for VPS - properly handles PORT and PYTHONPATH

cd /fritz-service
source venv/bin/activate

# Set PYTHONPATH so Python can find the src module
export PYTHONPATH=/fritz-service

# Get PORT from environment or use default 8000
PORT=${PORT:-8000}

# Start uvicorn with the port
exec uvicorn backend.services.fritzWorkerService:app --host 0.0.0.0 --port "$PORT" --log-level info --access-log

