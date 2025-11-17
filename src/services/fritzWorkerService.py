#!/usr/bin/env python3
"""
HTTP Service for FritzBox device checking with WireGuard VPN support.
This service can be deployed to Railway, Render, Heroku, or any VPS.

Usage:
    # Local development
    python src/services/fritzWorkerService.py

    # Or with uvicorn (recommended for production)
    uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.fritzWorker import check_for_new_devices

app = FastAPI(title="FritzBox Device Checker Service with VPN")

# Check if running on Railway and adjust config path if needed
if os.environ.get('RAILWAY_ENVIRONMENT'):
    # On Railway, we might need to adjust paths
    # Ensure the services directory is in path
    service_dir = Path(__file__).parent
    if str(service_dir) not in sys.path:
        sys.path.insert(0, str(service_dir))

# Get API key from environment (for security)
API_KEY = os.environ.get('FRITZ_SERVICE_API_KEY', '')

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_api_key(authorization: str = Header(None)):
    """Verify API key from Authorization header"""
    if not API_KEY:
        return True  # No API key set, allow all (for development)
    
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    if authorization.startswith("Bearer "):
        token = authorization[7:]
        if token != API_KEY:
            raise HTTPException(status_code=401, detail="Invalid API key")
    else:
        raise HTTPException(status_code=401, detail="Invalid Authorization format")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "fritz-worker-service", "vpn_support": True}

@app.get("/health")
async def health():
    """Health check with more details"""
    return {
        "status": "healthy",
        "service": "fritz-worker-service",
        "vpn_support": True,
        "wireguard_available": True
    }

@app.post("/check-devices")
async def check_devices(authorization: str = Header(None)):
    """
    Check for new devices on FritzBox network via WireGuard VPN.
    This endpoint automatically establishes VPN connection, checks devices, and disconnects.
    
    Headers:
        Authorization: Bearer YOUR_API_KEY (optional if FRITZ_SERVICE_API_KEY not set)
    
    Returns:
        {
            "has_new": bool,
            "new_devices": list,
            "message": str,
            "device_count": int
        }
    """
    # Verify API key
    verify_api_key(authorization)
    
    try:
        # Check devices using WireGuard VPN (automatically connects/disconnects)
        has_new, new_devices = check_for_new_devices(vpn_method='wireguard', use_vpn=True)
        
        # Determine message based on result
        if has_new:
            message = "Neue Geräte die nicht zum Baseline gehören"
        else:
            message = "Außer den Baseline Geräten ist niemand im Club"
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "has_new": has_new,
                "new_devices": new_devices,
                "message": message,
                "device_count": len(new_devices),
                "is_occupied": has_new  # New devices = club is occupied
            }
        )
        
    except Exception as e:
        print(f"Error checking devices: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error checking devices: {str(e)}"
        )

@app.get("/check-devices")
async def check_devices_get(authorization: str = Header(None)):
    """GET endpoint for convenience (same as POST)"""
    return await check_devices(authorization)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get('PORT', 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

