# Timeout Fix: WireGuard Verbindung wiederverwenden

## Problem: Immer noch TimeoutError nach 58 Sekunden

**Fehlermeldung:**
```
Error calling Fritz service: TimeoutError: Signal timed out.
```

**Ursache:** EC2 Service baut jedes Mal eine neue WireGuard Verbindung auf, was sehr langsam ist.

## Lösung: WireGuard Verbindung wiederverwenden

### Änderung: Prüfe ob WireGuard bereits verbunden ist

**Vorher:**
- Jedes Mal neue WireGuard Verbindung aufbauen (~10-15 Sekunden)
- Nach Check wieder trennen (~2-3 Sekunden)
- **Gesamt:** ~12-18 Sekunden nur für VPN

**Nachher:**
- Prüfe ob WireGuard bereits verbunden ist
- Wenn ja, wiederverwenden (kein Aufbau nötig)
- Nur trennen wenn wir selbst verbunden haben
- **Gesamt:** ~0.5 Sekunden für Prüfung (wiederverwendet)

**Ersparnis:** ~11-17 Sekunden!

### Code-Änderungen

**Neue Funktion:** `_is_wireguard_connected()`
- Prüft ob WireGuard bereits verbunden ist
- Testet Verbindung (ping zu FritzBox IP)
- Gibt `True` zurück wenn verbunden

**Geänderte Funktion:** `_connect_wireguard()`
- Prüft zuerst ob bereits verbunden
- Wenn ja, wiederverwenden (kein Aufbau)
- Wenn nein, neue Verbindung aufbauen

**Geänderte Funktion:** `check_for_new_devices()`
- Wartet nur wenn neue Verbindung (nicht bei Wiederverwendung)
- Trennt nur wenn wir selbst verbunden haben (nicht bei Wiederverwendung)

## Erwartete Performance-Verbesserung

**Vorher:**
- WireGuard Aufbau: ~10-15 Sekunden
- VPN Wait: 2 Sekunden
- FritzBox Check: ~5-10 Sekunden
- WireGuard Trennen: ~2-3 Sekunden
- **Gesamt:** ~19-30 Sekunden

**Nachher (erster Aufruf):**
- WireGuard Aufbau: ~10-15 Sekunden (nur beim ersten Mal)
- VPN Wait: 2 Sekunden
- FritzBox Check: ~5-10 Sekunden
- WireGuard trennen: ~2-3 Sekunden (optional, kann auch bleiben)
- **Gesamt:** ~19-30 Sekunden (erster Aufruf)

**Nachher (nachfolgende Aufrufe):**
- WireGuard Prüfung: ~0.5 Sekunden (bereits verbunden!)
- VPN Wait: 0.5 Sekunden (minimal)
- FritzBox Check: ~5-10 Sekunden
- **Gesamt:** ~6-11 Sekunden (nachfolgende Aufrufe)

**Ersparnis bei nachfolgenden Aufrufen:** ~13-19 Sekunden!

## Deployment

### 1. Code aktualisieren auf EC2

**SSH zu EC2:**
```bash
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com
```

**Code aktualisieren:**
```bash
cd /fritz-service

# Git pull (falls Code auf GitHub)
git pull origin dev

# Oder manuell: Datei aktualisieren
# Kopiere aktualisierten Code nach src/services/fritzWorker.py
```

**Service neu starten:**
```bash
sudo systemctl restart fritz-service

# Status prüfen
sudo systemctl status fritz-service

# Logs prüfen
sudo journalctl -u fritz-service -f
```

### 2. Testen

**Terminal 1: EC2 Logs**
```bash
sudo journalctl -u fritz-service -f
```

**Terminal 2: Edge Function testen (zweimal nacheinander)**
```powershell
# Erster Test (baut Verbindung auf)
.\scripts\test-edge-function.ps1

# Zweiter Test (sollte schneller sein, wiederverwendet Verbindung)
.\scripts\test-edge-function.ps1
```

**Erwartete Logs beim zweiten Test:**
```
WireGuard VPN already connected, reusing existing connection.
Using existing VPN connection, minimal wait...
Keeping existing VPN connection active (reused connection).
```

### 3. Prüfe: Ist es schneller?

**Edge Function Logs prüfen:**
- Supabase Dashboard → Edge Functions → check-devices → Logs
- Suche nach: `Fritz service response received in Xms`
- Beim zweiten Test sollte deutlich schneller sein (< 20 Sekunden)

## Optionale Optimierung: WireGuard permanent verbunden lassen

Wenn der Service nur für diesen Zweck verwendet wird, kann WireGuard permanent verbunden bleiben:

**Service-Start-Script ändern:**
```bash
# In /fritz-service/start.sh oder systemd service
# WireGuard beim Service-Start verbinden
wg-quick up /path/to/wg_config.conf

# Service starten
uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port 8000
```

**Vorteil:**
- Keine Verbindungszeit mehr nötig (0 Sekunden)
- Jeder Check ist sofort (~5-10 Sekunden)

**Nachteil:**
- WireGuard immer verbunden (mehr Ressourcen, aber minimal)
- Bei Reboot muss Verbindung neu aufgebaut werden

## Falls weiterhin Timeout

**Option 1: Weitere Optimierungen**
- FritzBox API Aufrufe parallelisieren
- Device Check optimieren (nur aktive Devices prüfen)
- Caching von FritzBox Antworten

**Option 2: Supabase Pro Plan**
- Pro Plan erlaubt 300 Sekunden (5 Minuten) Timeout
- Upgrade: https://supabase.com/pricing

**Option 3: Asynchrone Verarbeitung**
- Edge Function startet Request und gibt sofort zurück
- EC2 Service verarbeitet im Hintergrund
- Status wird später aktualisiert

## Zusammenfassung

**Änderung:** WireGuard Verbindung wiederverwenden statt jedes Mal neu aufbauen

**Ersparnis:**
- **Erster Aufruf:** Keine Änderung (~19-30 Sekunden)
- **Nachfolgende Aufrufe:** ~13-19 Sekunden Ersparnis (~6-11 Sekunden)

**Erwartete Dauer nach Optimierung:**
- **Erster Aufruf:** ~19-30 Sekunden
- **Nachfolgende Aufrufe:** ~6-11 Sekunden (deutlich unter 58s Limit!)

**Next Steps:**
1. Code auf EC2 aktualisieren
2. Service neu starten
3. Testen (zwei Aufrufe nacheinander)
4. Prüfe ob zweiter Aufruf schneller ist

**Diese Optimierung sollte das Timeout-Problem lösen!** ✅

