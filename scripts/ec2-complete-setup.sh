#!/bin/bash
# Complete EC2 Setup Script for FritzBox Device Checker Service
# This script installs all dependencies and sets up the service on a fresh Ubuntu EC2 instance
# Run this script as the ubuntu user (not root)

set -e  # Exit on error

echo "=========================================="
echo "FritzBox Device Checker - EC2 Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please run this script as the ubuntu user, not as root!"
    print_warning "Use: bash ec2-complete-setup.sh (not sudo)"
    exit 1
fi

# Step 1: Update system
print_step "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Step 2: Detect Python version
print_step "Detecting Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
PYTHON_MAJOR=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1)
PYTHON_MINOR=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f2)
echo "Detected Python version: $PYTHON_VERSION ($PYTHON_MAJOR.$PYTHON_MINOR)"

# Step 3: Install dependencies
print_step "Installing system dependencies..."
# Install Python and related packages (use detected version)
sudo apt-get install -y \
    python3 \
    python3-venv \
    python3-pip \
    git \
    wireguard \
    wireguard-tools \
    curl \
    build-essential \
    software-properties-common

# Step 4: Verify WireGuard installation
print_step "Verifying WireGuard installation..."
if command -v wg &> /dev/null; then
    echo "✅ WireGuard installed: $(wg --version 2>&1 | head -n 1)"
else
    print_error "WireGuard installation failed!"
    exit 1
fi

# Step 5: Create service directory
print_step "Creating service directory..."
sudo mkdir -p /fritz-service
sudo chown ubuntu:ubuntu /fritz-service
cd /fritz-service

# Step 6: Clone repository (dev branch)
print_step "Cloning repository from GitHub..."
if [ -d "/fritz-service/.git" ]; then
    print_warning "Repository already exists, pulling latest changes..."
    git pull origin dev
else
    git clone -b dev https://github.com/Zorroinvader/JungeWebisite.git /fritz-service
    cd /fritz-service
    git checkout dev
fi

# Step 7: Create Python virtual environment
print_step "Setting up Python virtual environment..."
if [ -d "/fritz-service/venv" ]; then
    print_warning "Virtual environment already exists, removing old one..."
    rm -rf /fritz-service/venv
fi

# Use detected Python version
python3 -m venv /fritz-service/venv
source /fritz-service/venv/bin/activate

# Verify Python version in venv
VENV_PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
echo "✅ Virtual environment created with Python $VENV_PYTHON_VERSION"

# Step 8: Upgrade pip
print_step "Upgrading pip..."
pip install --upgrade pip

# Step 9: Install Python dependencies
print_step "Installing Python dependencies..."
pip install -r requirements.txt

# Step 10: Create .env file
print_step "Setting up environment variables..."
echo ""
echo "Please provide the following configuration:"
echo ""

# API Key
read -p "Enter FRITZ_SERVICE_API_KEY (or press Enter for default 'JC!Pferdestall'): " API_KEY
API_KEY=${API_KEY:-JC!Pferdestall}

# Port
read -p "Enter PORT (or press Enter for default '8000'): " PORT
PORT=${PORT:-8000}

# WireGuard Configuration
echo ""
echo "Please provide WireGuard configuration:"
read -p "Enter WireGuard Private Key: " WG_PRIVATE_KEY
read -p "Enter WireGuard Public Key: " WG_PUBLIC_KEY
read -p "Enter WireGuard Preshared Key: " WG_PRESHARED_KEY
read -p "Enter WireGuard Endpoint (e.g., llezz3op4nv9opzb.myfritz.net:58294): " WG_ENDPOINT
read -p "Enter WireGuard Address (e.g., 192.168.178.202/24): " WG_ADDRESS

# Create .env file
cat > /fritz-service/.env << EOF
FRITZ_SERVICE_API_KEY=${API_KEY}
PORT=${PORT}
WG_CONFIG="[Interface]
PrivateKey = ${WG_PRIVATE_KEY}
Address = ${WG_ADDRESS}
DNS = 192.168.178.1
DNS = fritz.box

[Peer]
PublicKey = ${WG_PUBLIC_KEY}
PresharedKey = ${WG_PRESHARED_KEY}
AllowedIPs = 192.168.178.0/24,0.0.0.0/0
Endpoint = ${WG_ENDPOINT}
PersistentKeepalive = 25"
EOF

# Set permissions on .env
chmod 600 /fritz-service/.env
echo "✅ Environment file created at /fritz-service/.env"

# Step 11: Make start.sh executable
print_step "Making start.sh executable..."
chmod +x /fritz-service/start.sh

# Step 12: Update start.sh to ensure PYTHONPATH is set
print_step "Updating start.sh script..."
cat > /fritz-service/start.sh << 'EOF'
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
EOF

chmod +x /fritz-service/start.sh

# Step 13: Create systemd service file
print_step "Creating systemd service..."
sudo tee /etc/systemd/system/fritz-service.service > /dev/null << EOF
[Unit]
Description=FritzBox Device Checker Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/fritz-service
Environment="PATH=/fritz-service/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="PYTHONPATH=/fritz-service"
EnvironmentFile=/fritz-service/.env
ExecStart=/fritz-service/start.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 14: Reload systemd and enable service
print_step "Configuring systemd service..."
sudo systemctl daemon-reload
sudo systemctl enable fritz-service

# Step 15: Start the service
print_step "Starting fritz-service..."
sudo systemctl start fritz-service

# Step 16: Wait a moment and check status
sleep 3
print_step "Checking service status..."
if sudo systemctl is-active --quiet fritz-service; then
    echo "✅ Service is running!"
else
    print_error "Service failed to start. Checking logs..."
    sudo journalctl -u fritz-service -n 50 --no-pager
    exit 1
fi

# Step 17: Display service information
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Service Status:"
sudo systemctl status fritz-service --no-pager -l | head -n 15
echo ""
echo "Service Logs:"
echo "  sudo journalctl -u fritz-service -f"
echo ""
echo "Service Management:"
echo "  sudo systemctl start fritz-service    # Start service"
echo "  sudo systemctl stop fritz-service     # Stop service"
echo "  sudo systemctl restart fritz-service  # Restart service"
echo "  sudo systemctl status fritz-service   # Check status"
echo ""
echo "Test Service:"
echo "  curl http://localhost:8000/health"
echo "  curl http://localhost:8000/"
echo ""
echo "The service is now running and will start automatically on boot!"
echo ""

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "Unknown")
echo "Your EC2 Public IP: ${PUBLIC_IP}"
echo ""
echo "⚠️  IMPORTANT: Make sure to:"
echo "  1. Open port 8000 in EC2 Security Group"
echo "  2. Enable Termination Protection in AWS Console"
echo "  3. Update FRITZ_SERVICE_URL in Supabase to: http://${PUBLIC_IP}:8000"
echo ""

