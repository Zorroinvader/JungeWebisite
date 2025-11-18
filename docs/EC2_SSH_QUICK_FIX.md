# EC2 SSH Connection Quick Fix

## Problem: Connection Timed Out

```
ssh: connect to host ec2-34-204-153-169.compute-1.amazonaws.com port 22: Connection timed out
```

**Ursache:** Security Group blockiert SSH-Verbindungen oder Instance ist nicht erreichbar.

## Quick Fix Checklist

### 1. Instance Status prüfen (WICHTIG!)

**AWS Console:**
1. Gehe zu: https://console.aws.amazon.com/ec2/
2. **EC2** → **Instances**
3. Finde deine Instance: `ec2-34-204-153-169` oder ähnlich
4. Prüfe **Instance State:**
   - ✅ **Running** = OK, gehe zu Schritt 2
   - ❌ **Stopped** = Instance starten (siehe unten)
   - ❌ **Pending** = Warten bis "Running"
   - ❌ **Terminated** = Instance wurde gelöscht (neu erstellen)

### 2. Security Group prüfen und anpassen

**AWS Console:**
1. **EC2** → **Instances** → Deine Instance wählen
2. **Security** Tab (unten)
3. Klicke auf **Security Group Name** (z.B. `sg-xxxxx`)

**Inbound Rules:**
1. Tab **"Inbound rules"**
2. Klicke **"Edit inbound rules"**
3. Prüfe ob SSH (Port 22) Regel existiert:
   - ✅ **Existiert:** Prüfe **Source** (siehe unten)
   - ❌ **Existiert nicht:** Regel hinzufügen (siehe unten)

**SSH Rule hinzufügen/anpassen:**
1. **"Add rule"** klicken (oder bestehende bearbeiten)
2. **Type:** `SSH`
3. **Protocol:** `TCP`
4. **Port range:** `22`
5. **Source:** 
   - **Option A (Empfohlen):** `My IP` (AWS erkennt deine IP automatisch)
   - **Option B (Für Tests):** `0.0.0.0/0` (Anywhere-IPv4) - Weniger sicher!
   - **Option C (Manuell):** Deine aktuelle IP-Adresse (z.B. `1.2.3.4/32`)
6. **Description:** `SSH access from my IP`
7. **"Save rules"** klicken

### 3. Deine aktuelle IP-Adresse ermitteln

Falls deine IP sich geändert hat:

```powershell
# PowerShell
(Invoke-WebRequest -Uri "https://api.ipify.org").Content

# Oder im Browser
# Gehe zu: https://whatismyipaddress.com/
```

Dann in Security Group:
- **Source:** `DEINE_IP/32` (z.B. `1.2.3.4/32`)

### 4. Instance starten (falls gestoppt)

**AWS Console:**
1. **EC2** → **Instances** → Deine Instance wählen
2. **Instance State** → **Start instance**
3. **Warten 2-3 Minuten** (Boot-Zeit)
4. **SSH-Verbindung testen**

### 5. SSH-Verbindung testen

```powershell
# Von X:\keys Verzeichnis
ssh -i "JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com

# Oder mit vollem Pfad
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com
```

## Häufige Fehler und Lösungen

### Fehler 1: "Connection timed out"

**Ursachen:**
- Security Group blockiert SSH
- Instance ist gestoppt
- Falsche IP-Adresse in Security Group

**Lösung:**
1. Prüfe Instance Status (muss "Running" sein)
2. Prüfe Security Group Inbound Rules (SSH Port 22)
3. Füge deine aktuelle IP hinzu (oder verwende "My IP")

### Fehler 2: "Connection refused"

**Ursache:** Security Group funktioniert, aber SSH-Daemon läuft nicht

**Lösung:**
```bash
# AWS Console: Instance neu starten
Instance State -> Reboot instance
```

### Fehler 3: "Permission denied (publickey)"

**Ursache:** SSH-Key Permissions oder falscher Key

**Lösung (Windows PowerShell als Administrator):**
```powershell
# Permissions korrigieren
icacls "X:\Keys\JC_Devices.pem" /inheritance:r
icacls "X:\Keys\JC_Devices.pem" /grant:r "%USERNAME%:R"
```

### Fehler 4: "Bad permissions" auf Windows

**Lösung:**
```powershell
# PowerShell (als Administrator)
icacls "X:\Keys\JC_Devices.pem" /inheritance:r
icacls "X:\Keys\JC_Devices.pem" /grant:r "%USERNAME%:R"
```

## Security Group: Port 8000 auch öffnen

Für den FritzBox Service auch Port 8000 öffnen:

1. **Security Group** → **Inbound rules** → **Edit inbound rules**
2. **Add rule:**
   - **Type:** `Custom TCP`
   - **Port range:** `8000`
   - **Source:** 
     - `0.0.0.0/0` (wenn Supabase darauf zugreifen soll)
     - Oder spezifische IP
   - **Description:** `FritzBox Service API`
3. **Save rules**

## Schnelltest: Ping (Optional)

```powershell
# Test ob Instance erreichbar ist
ping ec2-34-204-153-169.compute-1.amazonaws.com

# Hinweis: Ping erfordert ICMP in Security Group
# Wenn Ping nicht geht, bedeutet das nicht, dass SSH auch blockiert ist
```

## Automatische IP-Erkennung (Empfohlen)

Verwende **"My IP"** in Security Group:
- AWS erkennt automatisch deine IP-Adresse
- Funktioniert wenn du von der gleichen IP verbindest
- Falls IP sich ändert, muss Security Group angepasst werden

**Alternative:** Verwende `0.0.0.0/0` (nur für Tests/Entwicklung, weniger sicher!)

## Nach erfolgreicher Verbindung

```bash
# Service Status prüfen
sudo systemctl status fritz-service

# Live Logs ansehen
sudo journalctl -u fritz-service -f

# Service aktivieren (falls noch nicht)
sudo systemctl enable fritz-service
sudo systemctl daemon-reload
sudo systemctl start fritz-service
```

## Zusammenfassung

**Connection Timed Out Fix:**

1. ✅ **AWS Console öffnen:** https://console.aws.amazon.com/ec2/
2. ✅ **Instance Status prüfen:** Muss "Running" sein
3. ✅ **Security Group öffnen:** Instances → Security Tab → Security Group Name
4. ✅ **Inbound Rules editieren:** SSH (Port 22) hinzufügen/anpassen
5. ✅ **Source setzen:** "My IP" oder `0.0.0.0/0` (für Tests)
6. ✅ **Save rules**
7. ✅ **SSH erneut testen**

**Meistens hilft:** Security Group anpassen oder Instance starten! 🔐

