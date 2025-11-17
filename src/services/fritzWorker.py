#!/usr/bin/env python3
from fritzconnection import FritzConnection
from datetime import datetime, timedelta
import subprocess
import os
import tempfile
import time

# Baseline devices - always connected devices that should be filtered out
BASELINE_MAC_ADDRESSES = {
    'AC:41:6A:7B:3F:21',  # Blink-Mini
    '68:13:F3:B7:CE:4C',  # PC-68-13-F3-B7-CE-4C
    'E0:28:6D:C8:98:23',  # fritz-box2
    'E0:28:6D:FE:92:A7',  # fritz.box
    'AE:50:96:03:2E:97',  # iPhone
    'C6:A7:E3:E8:B7:B1',  # iPhone
}


def connect_fritzbox_vpn(vpn_server, username, password, vpn_type='openvpn', 
                         ovpn_config_path=None, ca_cert_path=None):
    """
    Connects to FritzBox network using VPN services.
    
    Args:
        vpn_server (str): VPN server address (IP or hostname)
        username (str): VPN username
        password (str): VPN password
        vpn_type (str): Type of VPN connection ('openvpn', 'l2tp', 'pptp'). Default: 'openvpn'
        ovpn_config_path (str, optional): Path to OpenVPN config file (.ovpn)
        ca_cert_path (str, optional): Path to CA certificate file
    
    Returns:
        tuple: (bool, subprocess.Popen or None) - (True if connection initiated, process object)
    
    Note:
        For OpenVPN: Requires OpenVPN client installed on system
        For L2TP/IPSec: Requires system VPN tools or network-manager
    """
    if vpn_type.lower() == 'openvpn':
        return _connect_openvpn(vpn_server, username, password, ovpn_config_path, ca_cert_path)
    elif vpn_type.lower() == 'l2tp':
        return _connect_l2tp(vpn_server, username, password)
    elif vpn_type.lower() == 'pptp':
        return _connect_pptp(vpn_server, username, password)
    else:
        print(f"Unsupported VPN type: {vpn_type}")
        return False, None


def _connect_openvpn(vpn_server, username, password, ovpn_config_path=None, ca_cert_path=None):
    """
    Connects via OpenVPN protocol.
    """
    try:
        # Check if OpenVPN is installed
        subprocess.run(['which', 'openvpn'], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: OpenVPN client not found. Please install OpenVPN.")
        return False, None
    
    # Create temporary auth file
    auth_file = tempfile.NamedTemporaryFile(mode='w', delete=False)
    auth_file.write(f"{username}\n{password}\n")
    auth_file.close()
    
    try:
        # If config file provided, use it
        if ovpn_config_path and os.path.exists(ovpn_config_path):
            cmd = [
                'sudo', 'openvpn',
                '--config', ovpn_config_path,
                '--auth-user-pass', auth_file.name,
                '--daemon'
            ]
        else:
            # Basic OpenVPN connection (requires more configuration)
            cmd = [
                'sudo', 'openvpn',
                '--remote', vpn_server,
                '--auth-user-pass', auth_file.name,
                '--daemon'
            ]
            if ca_cert_path:
                cmd.extend(['--ca', ca_cert_path])
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a moment to check if connection started
        time.sleep(2)
        
        if process.poll() is None:
            print(f"OpenVPN connection initiated to {vpn_server}")
            return True, process
        else:
            stdout, stderr = process.communicate()
            print(f"OpenVPN connection failed: {stderr.decode()}")
            return False, None
            
    except Exception as e:
        print(f"Error connecting via OpenVPN: {e}")
        return False, None
    finally:
        # Clean up auth file (but keep it for the connection)
        # Note: In production, use more secure methods
        pass


def _connect_l2tp(vpn_server, username, password):
    """
    Connects via L2TP/IPSec protocol.
    Note: This is a placeholder - implementation depends on system tools available.
    """
    print("L2TP/IPSec connection not yet implemented.")
    print("This typically requires network-manager or strongswan tools.")
    return False, None


def _connect_pptp(vpn_server, username, password):
    """
    Connects via PPTP protocol.
    Note: PPTP is deprecated and not recommended for security reasons.
    """
    print("PPTP connection not yet implemented.")
    print("Note: PPTP is deprecated and insecure.")
    return False, None


def check_for_new_devices():
    """
    Checks if there are any new devices (not in baseline) connected to the WLAN in the last 10 minutes.
    
    Returns:
        tuple: (bool, list) - (True if new devices found, list of new devices with details)
    """
    fc = FritzConnection(address='192.168.178.1', user='admin', password='JC!Pferdestall')
    
    # Get number of hosts
    num_hosts = fc.call_action('Hosts', 'GetHostNumberOfEntries')
    total_hosts = num_hosts['NewHostNumberOfEntries']
    
    # Calculate time threshold (10 minutes ago)
    time_threshold = datetime.now() - timedelta(minutes=10)
    
    # Collect all currently active devices
    all_active_devices = []
    for i in range(total_hosts):
        host_info = fc.call_action('Hosts', 'GetGenericHostEntry', NewIndex=i)
        
        # Check if device is currently active
        is_active = host_info.get('NewActive', False)
        
        # Get last activity time (usually in seconds since epoch or as timestamp)
        last_activity = host_info.get('NewLastActivity', 0)
        
        # Check if device was active in last 10 minutes
        should_include = False
        
        if is_active:
            should_include = True
        elif last_activity:
            # Convert last activity to datetime if it's a timestamp
            try:
                if isinstance(last_activity, (int, float)) and last_activity > 0:
                    # Assume it's seconds since epoch
                    last_activity_dt = datetime.fromtimestamp(last_activity)
                    if last_activity_dt >= time_threshold:
                        should_include = True
            except (ValueError, OSError):
                pass
        
        if should_include:
            host_name = host_info.get('NewHostName', 'Unknown')
            ip_address = host_info.get('NewIPAddress', 'N/A')
            mac_address = host_info.get('NewMACAddress', 'N/A')
            all_active_devices.append({
                'name': host_name,
                'ip': ip_address,
                'mac': mac_address
            })
    
    # Filter out baseline devices
    new_devices = [
        device for device in all_active_devices
        if device['mac'] != 'N/A' and device['mac'] not in BASELINE_MAC_ADDRESSES
    ]
    
    # Return boolean and list of new devices
    has_new = len(new_devices) > 0
    return has_new, new_devices


if __name__ == '__main__':
    has_new, new_devices = check_for_new_devices()
    
    # Print new devices for research purposes if found
    if has_new:
        print("New devices found:")
        for device in new_devices:
            print(f"  Device: {device['name']}")
            print(f"    IP: {device['ip']}")
            print(f"    MAC: {device['mac']}")
            print()
    
    print("New Devices: " + str(has_new))  # Debug output
    exit(0 if not has_new else 1)


