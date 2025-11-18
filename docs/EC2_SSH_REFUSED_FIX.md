# EC2 SSH Connection Refused Fix

## Problem: SSH Connection Refused

```
ssh: connect to host ec2-34-204-153-169.compute-1.amazonaws.com port 22: Connection refused
```

**Gute Nachricht:** Das ist ein Fortschritt! 
- ✅ **"Connection timed out"** → Security Group blockiert (behoben!)
- ⚠️ **"Connection refused"** → Security Group lässt durch, aber SSH-Daemon läuft nicht

**Ursache:** Der SSH-Daemon (sshd) auf der EC2-Instance läuft nicht oder ist nicht konfiguriert.

## Lösungen

### 1. Instance Status prüfen (WICHTIG!)

1. **AWS Console** öffnen: https://console.aws.amazon.com/ec2/
2. **EC2** → **Instances** → Deine Instance wählen
3. Prüfe **Instance State:**
   - ✅ **Running** = Instance läuft (gehe zu Schritt 2)
   - ⏳ **Pending** = Instance startet noch (warten 1-2 Minuten)
   - ❌ **Stopped** = Instance ist gestoppt (Start!)
   - ❌ **Stopping/Stopping** = Instance stoppt gerade (warten bis "Stopped", dann starten)

### 2. System Logs prüfen

1. **AWS Console** → **EC2** → **Instances** → Deine Instance
2. **Actions** → **Monitor and troubleshoot** → **Get system log**
3. Prüfe die Logs auf:
   - SSH-Daemon Start-Meldungen
   - Fehler beim System-Start
   - Boot-Probleme

### 3. Instance neu starten

Falls die Instance läuft, aber SSH nicht funktioniert:

1. **AWS Console** → **EC2** → **Instances** → Deine Instance
2. **Instance State** → **Reboot instance** (nicht Stop!)
3. **Warten 2-3 Minuten** (Boot-Zeit)
4. **SSH-Verbindung testen:**
   ```bash
   ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com
   ```

### 4. Instance komplett neu starten (Soft Reboot hilft nicht)

Wenn Reboot nicht hilft:

1. **AWS Console** → **EC2** → **Instances** → Deine Instance
2. **Instance State** → **Stop instance**
3. **Warten** bis State = "Stopped"
4. **Instance State** → **Start instance**
5. **Warten 2-3 Minuten** (Boot-Zeit)
6. **SSH-Verbindung testen**

### 5. Prüfen: Richtiges AMI verwendet?

Wenn du die Instance neu erstellt hast, stelle sicher:

1. **Instance Details** → **AMI ID** prüfen
2. **Richtige AMI verwenden:**
   - Ubuntu 22.04 LTS oder neuer
   - Amazon Linux 2
   - Debian 11+
3. **NICHT verwenden:** Custom Images ohne SSH-Konfiguration

### 6. Prüfen: Richtiger User?

Je nach AMI variiert der Standard-User:

- **Ubuntu AMI:** `ubuntu`
- **Amazon Linux 2:** `ec2-user`
- **Debian:** `admin` oder `debian`
- **CentOS:** `centos`

**Test mit verschiedenen Usern:**
```bash
# Ubuntu
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com

# Amazon Linux 2
ssh -i "X:\Keys\JC_Devices.pem" ec2-user@ec2-34-204-153-169.compute-1.amazonaws.com

# Admin
ssh -i "X:\Keys\JC_Devices.pem" admin@ec2-34-204-153-169.compute-1.amazonaws.com
```

### 7. Prüfen: SSH-Key korrekt zugewiesen?

1. **AWS Console** → **EC2** → **Instances** → Deine Instance
2. **Connect** klicken
3. Prüfe **Key pair name:**
   - Sollte `JC_Devices` sein (oder der Name deines Key Pairs)
4. Falls falsch, Instance neu erstellen mit richtigem Key Pair

### 8. EC2 Instance Connect testen (AWS Browser SSH)

Falls normale SSH-Verbindung nicht funktioniert:

1. **AWS Console** → **EC2** → **Instances** → Deine Instance
2. **Connect** → **EC2 Instance Connect** Tab
3. **Connect** klicken
4. Falls das funktioniert, ist SSH installiert, aber möglicherweise User/Key-Problem

### 9. Network ACLs prüfen (Wenn Security Group OK ist)

Falls Security Group korrekt ist, aber es immer noch nicht funktioniert:

1. **AWS Console** → **VPC** → **Network ACLs**
2. Prüfe die Network ACLs für das Subnet deiner Instance
3. Stelle sicher, dass **Inbound Rules** SSH (Port 22) erlauben

## Schritt-für-Schritt Diagnose

### Schritt 1: Instance Status

```bash
# Prüfe in AWS Console
Instance State: [Running/Stopped/Pending]
```

**Wenn "Stopped":**
- → Instance starten
- → Warten 2-3 Minuten
- → SSH testen

**Wenn "Pending":**
- → Warten bis "Running"
- → SSH testen

**Wenn "Running":**
- → Gehe zu Schritt 2

### Schritt 2: System Logs

```bash
# In AWS Console
Actions → Monitor and troubleshoot → Get system log
```

**Prüfe auf:**
- `sshd: Started OpenSSH`
- `cloud-init` Meldungen
- Boot-Fehler

**Wenn Fehler:**
- → Instance neu starten
- → SSH testen

### Schritt 3: Instance Reboot

```bash
# In AWS Console
Instance State → Reboot instance
```

**Nach Reboot:**
- Warten 2-3 Minuten
- SSH testen

### Schritt 4: Stop/Start

```bash
# In AWS Console
Instance State → Stop instance
# Warten bis "Stopped"
Instance State → Start instance
# Warten 2-3 Minuten
```

**Nach Start:**
- SSH testen

## Häufige Ursachen

### 1. Instance startet noch

**Symptom:** "Pending" oder gerade erst gestartet  
**Lösung:** Warten 2-3 Minuten nach Start

### 2. SSH-Daemon läuft nicht

**Symptom:** Instance läuft, aber SSH antwortet nicht  
**Lösung:** Instance neu starten

### 3. Falsches AMI

**Symptom:** Custom Image ohne SSH-Konfiguration  
**Lösung:** Standard Ubuntu/Amazon Linux AMI verwenden

### 4. Falscher User

**Symptom:** Connection refused mit einem User, aber nicht mit anderem  
**Lösung:** Richtigen User verwenden (ubuntu/ec2-user/admin)

### 5. Key Pair nicht zugewiesen

**Symptom:** Instance wurde ohne Key Pair erstellt  
**Lösung:** Instance neu erstellen mit Key Pair

## Nach erfolgreicher Verbindung

Sobald SSH funktioniert, führe aus:

```bash
# 1. Service aktivieren (Auto-Start)
sudo systemctl enable fritz-service
sudo systemctl daemon-reload
sudo systemctl start fritz-service

# 2. Status prüfen
sudo systemctl status fritz-service

# 3. Service verifizieren
# (Lade scripts/ec2-verify-service.sh hoch)
chmod +x /tmp/ec2-verify-service.sh
/tmp/ec2-verify-service.sh
```

## Zusammenfassung

1. ✅ **Prüfe Instance Status** (AWS Console)
2. ✅ **Wenn "Stopped":** Instance starten
3. ✅ **Wenn "Pending":** Warten bis "Running"
4. ✅ **Wenn "Running":** Instance neu starten (Reboot)
5. ✅ **System Logs prüfen** (falls Reboot nicht hilft)
6. ✅ **Stop/Start** (falls Reboot nicht hilft)
7. ✅ **User testen** (ubuntu/ec2-user/admin)
8. ✅ **EC2 Instance Connect** testen (Browser SSH)

**Meistens hilft:** Instance neu starten (Reboot) oder Stop/Start! 🔄

