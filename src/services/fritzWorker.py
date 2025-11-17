#!/usr/bin/env python3
from fritzconnection import FritzConnection
from datetime import datetime, timedelta
import subprocess
import os
import tempfile
import time
import platform

# Baseline devices - always connected devices that should be filtered out
BASELINE_MAC_ADDRESSES = {
    'AC:41:6A:7B:3F:21',  # Blink-Mini
    '68:13:F3:B7:CE:4C',  # PC-68-13-F3-B7-CE-4C
    'E0:28:6D:C8:98:23',  # fritz-box2
    'E0:28:6D:FE:92:A7',  # fritz.box
    'AE:50:96:03:2E:97',  # iPhone
    'C6:A7:E3:E8:B7:B1',  # iPhone
}

# Baseline IP addresses - always connected IPs that should be filtered out
BASELINE_IP_ADDRESSES = {
    '192.168.178.202',  # WireGuard VPN interface
}

# VPN Configuration
VPN_CONFIG = {
    'ipsec': {
        'server': 'llezz3op4nv9opzb.myfritz.net',
        'ipsec_id': 'Juan',
        'ipsec_key': '1GXSKVN0LuD2dgFG',
        'username': 'Juan',
        'password': 'JC!Pferdestall',
        'vpn_type': 'IPSec Xauth PSK'
    },
    'wireguard': {
        'server': 'llezz3op4nv9opzb.myfritz.net',
        'port': 58294,
        'private_key': 'gMZanpT8ocSoMdEdjmu8BV63ZdfwKEhAuLWf4IOF9VA=',
        'public_key': 'ZPNPsuxAXAWDNZyOqZhXrRmFgU7d6vxRSyFuPPAt8As=',
        'preshared_key': 'V8Wu2/mtcAODOjU3MGYBLO3ajB7n/0S2/xUJosRkMLU=',
        'address': '192.168.178.202/24',
        'dns': ['192.168.178.1', 'fritz.box'],
        'allowed_ips': ['192.168.178.0/24', '0.0.0.0/0'],
        'persistent_keepalive': 25
    }
}


def connect_fritzbox_vpn(vpn_method='wireguard'):
    """
    Connects to FritzBox network using VPN services.
    
    Args:
        vpn_method (str): VPN method to use ('ipsec' or 'wireguard'). Default: 'wireguard'
    
    Returns:
        tuple: (bool, subprocess.Popen or None, str) - (True if connection initiated, process object, connection_name)
    
    Note:
        For IPSec: Uses strongSwan (Linux) or Windows built-in VPN
        For WireGuard: Requires WireGuard client installed on system
    """
    if vpn_method.lower() == 'ipsec':
        return _connect_ipsec()
    elif vpn_method.lower() == 'wireguard':
        return _connect_wireguard()
    else:
        print(f"Unsupported VPN method: {vpn_method}")
        return False, None, None


def _connect_ipsec():
    """
    Connects via IPSec VPN protocol.
    Supports both Linux (strongSwan) and Windows (built-in VPN).
    """
    config = VPN_CONFIG['ipsec']
    server = config['server']
    ipsec_id = config['ipsec_id']
    ipsec_key = config['ipsec_key']
    username = config['username']
    password = config['password']
    
    system = platform.system().lower()
    connection_name = f"FritzBox_IPSec_{int(time.time())}"
    
    try:
        if system == 'windows':
            # Windows IPSec VPN using PowerShell/Rasdial
            # Note: Windows requires VPN to be pre-configured or use rasdial
            # For automated setup, we'll use PowerShell to create and connect
            
            ps_script = f'''
$vpnName = "{connection_name}"
$serverAddress = "{server}"
$tunnelType = "IKEv2"
$authenticationMethod = "MachineCertificate"

# Try to connect if VPN already exists
$existing = Get-VpnConnection -Name $vpnName -ErrorAction SilentlyContinue
if ($existing) {{
    rasdial $vpnName {username} {password}
}} else {{
    Write-Host "VPN connection not found. Please configure IPSec VPN manually:"
    Write-Host "Server: {server}"
    Write-Host "Type: {config['vpn_type']}"
    Write-Host "IPSec ID: {ipsec_id}"
    Write-Host "IPSec Key: {ipsec_key}"
    Write-Host "Username: {username}"
    Write-Host "Password: {password}"
    exit 1
}}
'''
            process = subprocess.Popen(
                ['powershell', '-ExecutionPolicy', 'Bypass', '-Command', ps_script],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            time.sleep(3)
            stdout, stderr = process.communicate()
            
            if process.returncode == 0:
                print(f"IPSec VPN connection initiated to {server}")
                return True, process, connection_name
            else:
                print(f"IPSec VPN connection failed. Please configure manually.")
                print(f"Error: {stderr.decode()}")
                return False, None, None
                
        else:
            # Linux IPSec VPN using strongSwan
            try:
                # Check if strongSwan is installed
                subprocess.run(['which', 'ipsec'], check=True, capture_output=True)
            except (subprocess.CalledProcessError, FileNotFoundError):
                print("Error: strongSwan (ipsec) not found. Please install strongSwan.")
                return False, None, None
            
            # Create strongSwan configuration
            config_dir = tempfile.mkdtemp()
            ipsec_conf = os.path.join(config_dir, 'ipsec.conf')
            ipsec_secrets = os.path.join(config_dir, 'ipsec.secrets')
            
            # Write ipsec.conf
            with open(ipsec_conf, 'w') as f:
                f.write(f'''config setup
    charondebug="ike 2, knl 2, cfg 2"

conn {connection_name}
    type=tunnel
    keyexchange=ikev1
    leftauth=psk
    leftid={ipsec_id}
    right={server}
    rightauth=psk
    rightid={ipsec_id}
    ike=aes256-sha256-modp2048!
    esp=aes256-sha256!
    aggressive=no
    keyexchange=ikev1
    xauth_identity={username}
    auto=start
''')
            
            # Write ipsec.secrets
            with open(ipsec_secrets, 'w') as f:
                f.write(f'''{ipsec_id} {server} : PSK "{ipsec_key}"
{username} : XAUTH "{password}"
''')
            
            # Start the connection
            env = os.environ.copy()
            env['IPSEC_CONFS'] = config_dir
            
            process = subprocess.Popen(
                ['sudo', 'ipsec', 'up', connection_name],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=env
            )
            
            time.sleep(3)
            
            if process.poll() is None or process.returncode == 0:
                print(f"IPSec VPN connection initiated to {server}")
                return True, process, connection_name
            else:
                stdout, stderr = process.communicate()
                print(f"IPSec VPN connection failed: {stderr.decode()}")
                return False, None, None
                
    except Exception as e:
        print(f"Error connecting via IPSec: {e}")
        return False, None, None


def _connect_wireguard():
    """
    Connects via WireGuard VPN protocol.
    Uses existing config file (wg_config.conf) if available, otherwise creates one from VPN_CONFIG.
    Automatically activates the tunnel via CLI on Windows.
    """
    config = VPN_CONFIG['wireguard']
    server = config['server']
    port = config['port']
    
    system = platform.system().lower()
    tunnel_name = "FritzBox_WireGuard"
    
    # Check for existing config file in the services directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    existing_config = os.path.join(script_dir, 'wg_config.conf')
    
    try:
        # Use existing config file if it exists, otherwise create one
        if os.path.exists(existing_config):
            print(f"Using existing WireGuard config file: {existing_config}")
            wg_config_path = existing_config
        else:
            # Create WireGuard configuration file from VPN_CONFIG
            print("Creating WireGuard config file from VPN_CONFIG...")
            wg_config = tempfile.NamedTemporaryFile(mode='w', suffix='.conf', delete=False)
            wg_config.write(f"""[Interface]
PrivateKey = {config['private_key']}
Address = {config['address']}
DNS = {', '.join(config['dns'])}

[Peer]
PublicKey = {config['public_key']}
PresharedKey = {config['preshared_key']}
AllowedIPs = {', '.join(config['allowed_ips'])}
Endpoint = {server}:{port}
PersistentKeepalive = {config['persistent_keepalive']}
""")
            wg_config.close()
            wg_config_path = wg_config.name
        
        if system == 'windows':
            # Windows WireGuard - use WireGuard CLI for automatic activation
            import shutil
            
            # Check if WireGuard is installed - try multiple locations
            wg_exe = None
            possible_paths = [
                r'C:\Program Files\WireGuard\wireguard.exe',
                r'C:\Program Files (x86)\WireGuard\wireguard.exe',
                os.path.expanduser(r'~\AppData\Local\Programs\WireGuard\wireguard.exe')
            ]
            
            for path in possible_paths:
                if os.path.exists(path):
                    wg_exe = path
                    break
            
            # If not found in standard locations, try PATH
            if not wg_exe:
                try:
                    result = subprocess.run(['where', 'wireguard'], 
                                           capture_output=True, text=True, timeout=5)
                    if result.returncode == 0 and result.stdout.strip():
                        wg_exe = result.stdout.strip().split('\n')[0]
                except (FileNotFoundError, subprocess.TimeoutExpired):
                    pass
            
            if not wg_exe:
                print("Error: WireGuard client not found.")
                print("Please install WireGuard from https://www.wireguard.com/install/")
                print(f"Config file available at: {wg_config_path}")
                return False, None, None
            
            print(f"Found WireGuard at: {wg_exe}")
            
            # On Windows, WireGuard configs need to be in the Configurations directory
            # or we can use the config file directly with full path
            wg_config_dir = os.path.expanduser(r'~\AppData\Roaming\WireGuard\Configurations')
            os.makedirs(wg_config_dir, exist_ok=True)
            
            wg_config_dest = os.path.join(wg_config_dir, f'{tunnel_name}.conf')
            
            # Copy config file to WireGuard's config directory
            shutil.copy(wg_config_path, wg_config_dest)
            print(f"Config file copied to: {wg_config_dest}")
            
            try:
                # First, check if tunnel service is already installed
                # Try to uninstall existing service if it exists (to ensure clean state)
                check_result = subprocess.run(
                    [wg_exe, '/uninstalltunnelservice', tunnel_name],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=5
                )
                # Ignore errors - tunnel might not exist yet
                time.sleep(1)
                
                # Install and activate the tunnel service using CLI
                # This requires admin privileges but works automatically
                print(f"Installing and activating WireGuard tunnel '{tunnel_name}'...")
                process = subprocess.Popen(
                    [wg_exe, '/installtunnelservice', wg_config_dest],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    shell=False
                )
                
                # Wait for installation to complete
                stdout, stderr = process.communicate(timeout=10)
                
                if process.returncode == 0:
                    print(f"WireGuard VPN connection activated successfully to {server}:{port}")
                    print(f"Tunnel name: {tunnel_name}")
                    # Give it a moment to establish connection
                    time.sleep(2)
                    return True, process, tunnel_name
                else:
                    error_msg = stderr.decode() if stderr else stdout.decode()
                    # Check if it's a permission error
                    if 'access' in error_msg.lower() or 'privilege' in error_msg.lower() or 'administrator' in error_msg.lower():
                        print(f"Error: Administrator privileges required to activate WireGuard.")
                        print(f"Please run this script as Administrator, or manually activate the tunnel:")
                        print(f'  "{wg_exe}" /installtunnelservice "{wg_config_dest}"')
                        print(f"Config file saved at: {wg_config_dest}")
                        return False, None, None
                    else:
                        print(f"WireGuard installation failed: {error_msg}")
                        print(f"Config file saved at: {wg_config_dest}")
                        return False, None, None
                    
            except subprocess.TimeoutExpired:
                print("Error: WireGuard installation timed out.")
                print(f"Config file saved at: {wg_config_dest}")
                return False, None, None
            except Exception as e:
                print(f"Error setting up WireGuard: {e}")
                print(f"Config file saved at: {wg_config_dest}")
                print(f"Try running manually as Administrator:")
                print(f'  "{wg_exe}" /installtunnelservice "{wg_config_dest}"')
                return False, None, None
                
        else:
            # Linux/Unix WireGuard - use wg-quick
            try:
                subprocess.run(['which', 'wg-quick'], check=True, capture_output=True)
            except (subprocess.CalledProcessError, FileNotFoundError):
                print("Error: WireGuard (wg-quick) not found. Please install WireGuard.")
                print(f"Config file available at: {wg_config_path}")
                return False, None, None
            
            # Connect using wg-quick with the config file
            process = subprocess.Popen(
                ['sudo', 'wg-quick', 'up', wg_config_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            time.sleep(3)
            
            if process.poll() is None or process.returncode == 0:
                print(f"WireGuard VPN connection initiated to {server}:{port}")
                return True, process, tunnel_name
            else:
                stdout, stderr = process.communicate()
                print(f"WireGuard VPN connection failed: {stderr.decode()}")
                print(f"Config file location: {wg_config_path}")
                return False, None, None
                
    except Exception as e:
        print(f"Error connecting via WireGuard: {e}")
        return False, None, None


def disconnect_vpn(vpn_method='wireguard', connection_name=None):
    """
    Disconnects from VPN connection.
    
    Args:
        vpn_method (str): VPN method used ('ipsec' or 'wireguard')
        connection_name (str): Name of the connection to disconnect
    """
    system = platform.system().lower()
    
    try:
        if vpn_method.lower() == 'wireguard':
            if system == 'windows':
                # Use consistent tunnel name or provided connection_name
                tunnel_name = connection_name if connection_name else "FritzBox_WireGuard"
                
                wg_exe = r'C:\Program Files\WireGuard\wireguard.exe'
                if not os.path.exists(wg_exe):
                    # Try to find in PATH
                    try:
                        result = subprocess.run(['where', 'wireguard'], 
                                               capture_output=True, text=True)
                        if result.returncode == 0:
                            wg_exe = result.stdout.strip().split('\n')[0]
                    except FileNotFoundError:
                        pass
                
                if os.path.exists(wg_exe):
                    # Disconnect by uninstalling the tunnel service
                    try:
                        result = subprocess.run(
                            [wg_exe, '/uninstalltunnelservice', tunnel_name],
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE,
                            timeout=10
                        )
                        if result.returncode == 0:
                            print(f"WireGuard tunnel '{tunnel_name}' disconnected successfully.")
                        else:
                            # Tunnel might not be active, which is fine
                            error_msg = result.stderr.decode() if result.stderr else ""
                            if 'not found' not in error_msg.lower() and error_msg:
                                print(f"Note: {error_msg}")
                    except subprocess.TimeoutExpired:
                        print(f"Warning: WireGuard disconnect timed out.")
                    except Exception as e:
                        print(f"Note: Could not disconnect WireGuard automatically: {e}")
                        print(f"Run manually: \"{wg_exe}\" /uninstalltunnelservice \"{tunnel_name}\"")
                else:
                    print(f"WireGuard not found. Tunnel '{tunnel_name}' may still be active.")
            else:
                # Find active WireGuard interface
                result = subprocess.run(['sudo', 'wg', 'show'], 
                                      capture_output=True, text=True)
                if result.returncode == 0 and result.stdout:
                    # Extract interface name and disconnect
                    for line in result.stdout.split('\n'):
                        if line.startswith('interface:'):
                            interface = line.split(':')[1].strip()
                            subprocess.run(['sudo', 'wg-quick', 'down', interface],
                                         capture_output=True)
        elif vpn_method.lower() == 'ipsec':
            if system == 'windows':
                if connection_name:
                    subprocess.run(['rasdial', connection_name, '/disconnect'],
                                 capture_output=True)
            else:
                if connection_name:
                    subprocess.run(['sudo', 'ipsec', 'down', connection_name],
                                 capture_output=True)
    except Exception as e:
        print(f"Error disconnecting VPN: {e}")


def check_for_new_devices(vpn_method='wireguard', use_vpn=True):
    """
    Checks if there are any new devices (not in baseline) connected to the WLAN in the last 10 minutes.
    Connects via VPN if use_vpn is True.
    
    Args:
        vpn_method (str): VPN method to use ('ipsec' or 'wireguard'). Default: 'wireguard'
        use_vpn (bool): Whether to connect via VPN first. Default: True
    
    Returns:
        tuple: (bool, list) - (True if new devices found, list of new devices with details)
    """
    vpn_connected = False
    connection_name = None
    vpn_process = None
    
    # Connect via VPN if needed
    if use_vpn:
        print(f"Connecting to FritzBox VPN via {vpn_method}...")
        vpn_connected, vpn_process, connection_name = connect_fritzbox_vpn(vpn_method)
        
        if not vpn_connected:
            print("Warning: VPN connection failed. Attempting direct connection...")
        else:
            # Wait a bit for VPN to establish
            print("Waiting for VPN connection to establish...")
            time.sleep(5)
    
    try:
        # Connect to FritzBox (should work via VPN if connected, or directly if on same network)
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
        
        # Filter out baseline devices (by MAC address or IP address)
        new_devices = [
            device for device in all_active_devices
            if device['mac'] != 'N/A' 
            and device['mac'] not in BASELINE_MAC_ADDRESSES
            and device['ip'] not in BASELINE_IP_ADDRESSES
        ]
        
        # Return boolean and list of new devices
        has_new = len(new_devices) > 0
        return has_new, new_devices
        
    finally:
        # Disconnect VPN if we connected
        if use_vpn and vpn_connected and connection_name:
            print(f"Disconnecting from VPN ({vpn_method})...")
            disconnect_vpn(vpn_method, connection_name)


if __name__ == '__main__':
    import sys
    
    # Parse command line arguments
    vpn_method = 'wireguard'  # Default to WireGuard
    use_vpn = True  # Default to using VPN
    
    if len(sys.argv) > 1:
        if sys.argv[1] in ['ipsec', 'wireguard']:
            vpn_method = sys.argv[1]
        elif sys.argv[1] == '--no-vpn':
            use_vpn = False
        elif sys.argv[1] == '--direct':
            use_vpn = False
    
    if len(sys.argv) > 2:
        if sys.argv[2] in ['ipsec', 'wireguard']:
            vpn_method = sys.argv[2]
        elif sys.argv[2] == '--no-vpn':
            use_vpn = False
    
    print(f"Using VPN method: {vpn_method if use_vpn else 'None (direct connection)'}")
    
    try:
        has_new, new_devices = check_for_new_devices(vpn_method=vpn_method, use_vpn=use_vpn)
        
        # Print new devices for research purposes if found
        if has_new:
            print("New devices found:")
            for device in new_devices:
                print(f"  Device: {device['name']}")
                print(f"    IP: {device['ip']}")
                print(f"    MAC: {device['mac']}")
                print()
        
        print("New Devices: " + str(has_new))  # Debug output
        exit_code = 0 if not has_new else 1
        
    except Exception as e:
        print(f"\n{'='*50}")
        print(f"ERROR: {type(e).__name__}: {e}")
        print(f"{'='*50}")
        import traceback
        traceback.print_exc()
        exit_code = 1
    
    # Keep window open to see output
    print("\n" + "="*50)
    print("Press Enter to exit...")
    try:
        input()
    except (EOFError, KeyboardInterrupt):
        pass
    
    exit(exit_code)


