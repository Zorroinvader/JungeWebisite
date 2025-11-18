# Railway WireGuard Limitation - Lösung

## Problem

Railway Container können keine WireGuard-Verbindungen herstellen:

```
RTNETLINK answers: Operation not permitted
Unable to access interface: Operation not permitted
```

**Ursache**: Railway Container haben keine `CAP_NET_ADMIN` Capability, die für WireGuard benötigt wird.

## Lösung: VPS verwenden

Railway unterstützt keine privilegierten Container. Verwende stattdessen einen **VPS (Virtual Private Server)**.

### Option 1: DigitalOcean Droplet (Empfohlen)

**Kosten**: Ab $4/Monat

1. **Erstelle Droplet**:
   - Gehe zu: https://www.digitalocean.com/products/droplets
   - Wähle: Ubuntu 22.04 LTS
   - Plan: Basic ($4/Monat)
   - Region: Frankfurt (näher zu Deutschland)

2. **Setup**:
   ```bash
   # SSH zum Droplet
   ssh root@your-droplet-ip
   
   # Update System
   apt update && apt upgrade -y
   
   # Install WireGuard
   apt install -y wireguard wireguard-tools
   
   # Install Python & Dependencies
   apt install -y python3 python3-pip
   pip3 install fritzconnection fastapi uvicorn
   
   # Clone dein Repo oder kopiere Code
   git clone [dein-repo] /app
   cd /app
   
   # Setze Umgebungsvariablen
   export FRITZ_SERVICE_API_KEY="JC!Pferdestall"
   export WG_CONFIG="[deine-config]"
   
   # Starte Service
   uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port 8000
   ```

3. **Als Service laufen lassen** (systemd):
   ```bash
   # Erstelle Service File
   nano /etc/systemd/system/fritz-service.service
   ```
   
   ```ini
   [Unit]
   Description=FritzBox Worker Service
   After=network.target
   
   [Service]
   Type=simple
   User=root
   WorkingDirectory=/app
   Environment="FRITZ_SERVICE_API_KEY=JC!Pferdestall"
   Environment="WG_CONFIG=[deine-config]"
   ExecStart=/usr/bin/python3 -m uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port 8000
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```
   
   ```bash
   # Aktiviere und starte Service
   systemctl enable fritz-service
   systemctl start fritz-service
   ```

### Option 2: Hetzner Cloud (Günstiger)

**Kosten**: Ab €4/Monat

1. **Erstelle Server**: https://www.hetzner.com/cloud
2. **Gleicher Setup** wie DigitalOcean

### Option 3: AWS EC2 (Free Tier verfügbar)

**Kosten**: Free Tier (12 Monate), dann ab $3.50/Monat

1. **Erstelle EC2 Instance**: https://aws.amazon.com/ec2/
2. **Gleicher Setup** wie DigitalOcean

## Alternative: Railway mit separatem WireGuard Service

Falls du bei Railway bleiben willst:

1. **WireGuard auf einem VPS** laufen lassen
2. **Railway Service** ruft den VPS auf (der WireGuard hat)
3. **VPS** stellt VPN-Verbindung her und prüft FritzBox

**Nachteil**: Zwei Services zu verwalten

## Empfehlung

**Für Produktion**: **DigitalOcean Droplet** ($4/Monat)
- Einfach zu setup
- Volle Kontrolle
- WireGuard funktioniert
- Gute Performance

## Migration von Railway zu VPS

### Schritt 1: VPS Setup (siehe oben)

### Schritt 2: Code deployen

```bash
# Auf VPS
git clone [dein-repo] /app
cd /app
pip3 install -r requirements.txt
```

### Schritt 3: Umgebungsvariablen setzen

```bash
# Auf VPS
export FRITZ_SERVICE_API_KEY="JC!Pferdestall"
export WG_CONFIG="[deine-config]"
```

### Schritt 4: Service starten

```bash
# Als systemd Service (siehe oben)
# Oder mit screen/tmux für Testing
screen -S fritz
uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port 8000
```

### Schritt 5: Supabase URL aktualisieren

In Supabase → Edge Functions → Secrets:
- `FRITZ_SERVICE_URL` = `http://[vps-ip]:8000` oder Domain

### Schritt 6: Firewall öffnen

```bash
# Auf VPS
ufw allow 8000/tcp
```

## Zusammenfassung

- ❌ **Railway**: Keine WireGuard-Unterstützung (keine CAP_NET_ADMIN)
- ✅ **VPS (DigitalOcean/Hetzner/AWS)**: Volle WireGuard-Unterstützung
- 💰 **Kosten**: Ab $4/Monat (günstiger als viele denken)
- ⚡ **Performance**: Besser als Container (dedizierte Ressourcen)

## Nächste Schritte

1. **Wähle VPS Provider** (DigitalOcean empfohlen)
2. **Erstelle Server**
3. **Setup WireGuard & Python**
4. **Deploy Code**
5. **Update Supabase URL**

Soll ich dir beim VPS-Setup helfen?

