#!/bin/bash
# Script to check and fix EC2 service status

echo "=== EC2 Service Status Check ==="
echo ""

# Check if service file exists
if [ -f /etc/systemd/system/fritz-service.service ]; then
    echo "✅ Service file exists: /etc/systemd/system/fritz-service.service"
else
    echo "❌ Service file NOT found!"
    echo "   Creating service file..."
    sudo tee /etc/systemd/system/fritz-service.service > /dev/null <<EOF
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
    echo "✅ Service file created"
fi

# Check service status
echo ""
echo "=== Service Status ==="
sudo systemctl status fritz-service --no-pager -l

# Check if enabled
echo ""
echo "=== Service Enabled? ==="
if systemctl is-enabled --quiet fritz-service; then
    echo "✅ Service is enabled (will start on boot)"
else
    echo "❌ Service is NOT enabled"
    echo "   Enabling service..."
    sudo systemctl enable fritz-service
fi

# Check if active
echo ""
echo "=== Service Active? ==="
if systemctl is-active --quiet fritz-service; then
    echo "✅ Service is running"
else
    echo "❌ Service is NOT running"
    echo "   Starting service..."
    sudo systemctl start fritz-service
    sleep 2
    sudo systemctl status fritz-service --no-pager -l
fi

# Check recent logs
echo ""
echo "=== Recent Service Logs (last 20 lines) ==="
sudo journalctl -u fritz-service -n 20 --no-pager

# Check if process is running
echo ""
echo "=== Process Check ==="
if pgrep -f "fritzWorkerService" > /dev/null; then
    echo "✅ Process is running"
    ps aux | grep -E "fritzWorkerService|uvicorn" | grep -v grep
else
    echo "❌ Process is NOT running"
fi

# Check port 8000
echo ""
echo "=== Port 8000 Check ==="
if netstat -tlnp 2>/dev/null | grep -q ":8000"; then
    echo "✅ Port 8000 is listening"
    netstat -tlnp 2>/dev/null | grep ":8000"
else
    echo "❌ Port 8000 is NOT listening"
fi

# Test service
echo ""
echo "=== Service Health Check ==="
if curl -s -f http://localhost:8000/health > /dev/null; then
    echo "✅ Service is reachable on port 8000"
    curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/health
else
    echo "❌ Service is NOT reachable on port 8000"
fi

echo ""
echo "=== Check Complete ==="

