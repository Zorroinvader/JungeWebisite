FROM python:3.11-slim

# Install WireGuard and required tools
RUN apt-get update && apt-get install -y \
    wireguard \
    wireguard-tools \
    iptables \
    iproute2 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Note: WireGuard needs CAP_NET_ADMIN capability
# VPS systems have this by default when running as root

# Set working directory
WORKDIR /app

# Copy requirements first (for better caching)
COPY requirements.txt ./requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for WireGuard configs if needed
RUN mkdir -p /app/src/services

# Make start script executable
RUN chmod +x start.sh

# Expose port (PORT env var can be set, defaults to 8000)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start command - use start.sh script which handles PORT env var
CMD ["./start.sh"]

