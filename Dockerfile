FROM python:3.11-slim

# Install WireGuard and required tools
RUN apt-get update && apt-get install -y \
    wireguard \
    wireguard-tools \
    iptables \
    iproute2 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first (for better caching)
# Try src/services/requirements.txt first, fallback to root requirements.txt
COPY requirements.txt* ./requirements.txt
COPY src/services/requirements.txt* ./services-requirements.txt

# Install Python dependencies (use whichever exists)
RUN if [ -f ./requirements.txt ]; then \
      pip install --no-cache-dir -r requirements.txt; \
    elif [ -f ./services-requirements.txt ]; then \
      pip install --no-cache-dir -r services-requirements.txt; \
    else \
      pip install --no-cache-dir fritzconnection>=1.12.0 fastapi>=0.104.0 uvicorn>=0.24.0; \
    fi

# Copy application code
COPY . .

# Create directory for WireGuard configs if needed
RUN mkdir -p /app/src/services

# Expose port (Railway will set PORT env var)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start command
CMD ["uvicorn", "src.services.fritzWorkerService:app", "--host", "0.0.0.0", "--port", "8000"]

