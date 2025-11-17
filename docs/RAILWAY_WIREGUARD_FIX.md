# Railway WireGuard Fix - sudo Problem

## Problem

Railway Container haben kein `sudo` installiert, aber der Code versucht `sudo wg-quick up` zu verwenden.

**Fehler**:
```
Error connecting via WireGuard: [Errno 2] No such file or directory: 'sudo'
```

## Lösung

Der Code wurde angepasst, um:
1. **Zuerst ohne sudo** zu versuchen (Container laufen normalerweise als root)
2. **Falls das fehlschlägt**, automatisch mit sudo zu versuchen
3. **Fallback-Mechanismus** für verschiedene Umgebungen

## Was wurde geändert

### 1. `_connect_wireguard()` Funktion
- Prüft ob wir als root laufen
- Versucht zuerst ohne sudo
- Fallback zu sudo nur wenn nötig

### 2. `disconnect_vpn()` Funktion
- Versucht ohne sudo zuerst
- Fallback zu sudo wenn nötig

## Railway Container Capabilities

WireGuard braucht `CAP_NET_ADMIN` Capability. Railway Container sollten das standardmäßig haben.

Falls WireGuard immer noch nicht funktioniert:

### Option 1: Prüfe Railway Settings

1. Railway Dashboard → Service → Settings
2. Prüfe ob **"Privileged Mode"** oder **"Network Capabilities"** aktiviert sind
3. Falls nicht verfügbar: Railway unterstützt WireGuard möglicherweise nicht direkt

### Option 2: Alternative Deployment

Falls Railway WireGuard nicht unterstützt, verwende einen VPS:
- **DigitalOcean Droplet** (ab $4/Monat)
- **Hetzner Cloud** (ab €4/Monat)
- **AWS EC2** (Free Tier verfügbar)

## Testen

Nach dem Deploy:

1. **Prüfe Logs**:
   ```
   Connecting to FritzBox VPN via wireguard...
   Using WireGuard config from WG_CONFIG environment variable
   WireGuard VPN connection established to [server]:[port]
   ```

2. **Teste Endpoint**:
   ```bash
   curl -X POST https://adequate-bravery-production-3a76.up.railway.app/check-devices \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

## Nächste Schritte

1. ✅ Code wurde angepasst (ohne sudo)
2. ⚠️ **Commit und Push**:
   ```bash
   git add src/services/fritzWorker.py Dockerfile
   git commit -m "Fix WireGuard to work without sudo in Railway containers"
   git push
   ```
3. ⚠️ **Railway deployt automatisch**
4. ⚠️ **Prüfe Logs** ob WireGuard jetzt funktioniert

## Falls es immer noch nicht funktioniert

Railway Container haben möglicherweise eingeschränkte Netzwerk-Capabilities. In diesem Fall:

1. **Prüfe Railway Logs** für genaue Fehlermeldung
2. **Alternative**: Verwende einen VPS statt Railway
3. **Oder**: Verwende einen Service der WireGuard nativ unterstützt

## Wichtige Hinweise

- ✅ Code versucht jetzt automatisch ohne sudo
- ✅ Fallback zu sudo wenn nötig
- ⚠️ Railway Container brauchen `CAP_NET_ADMIN` für WireGuard
- ⚠️ Falls nicht verfügbar: VPS verwenden

