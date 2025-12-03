# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables Setup

#### Vercel Environment Variables
Setze folgende Variablen in Vercel Dashboard > Project Settings > Environment Variables:

```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

#### Supabase Edge Functions Environment Variables
Setze in Supabase Dashboard > Project Settings > Edge Functions:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRITZ_SERVICE_URL=https://your-ec2-instance:8000
FRITZ_SERVICE_API_KEY=your-api-key
RESEND_API_KEY=re_your-resend-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Jungengesellschaft
```

### 2. Database Migrations

Führe alle Migrations in Supabase aus:
```bash
# Via Supabase CLI
supabase db push

# Oder manuell im Supabase SQL Editor
# Führe alle Dateien aus supabase/migrations/ in Reihenfolge aus
```

### 3. Edge Functions Deployment

```bash
# Deploy alle Edge Functions
supabase functions deploy check-devices
supabase functions deploy send-admin-notification
supabase functions deploy fetch-ics
supabase functions deploy check-club-status
```

### 4. Security Configuration

- [ ] CORS Origins in Edge Functions auf Production-Domain eingeschränkt
- [ ] Security Headers in vercel.json aktiviert
- [ ] Rate Limiting konfiguriert
- [ ] API Keys rotiert und sicher gespeichert

### 5. Monitoring Setup

- [ ] Error Tracking (Sentry) konfiguriert
- [ ] Vercel Analytics aktiviert
- [ ] Health Check Endpoints getestet
- [ ] Alerting für kritische Fehler eingerichtet

## Deployment Process

### Automated Deployment (Recommended)

1. Push zu `main` Branch triggert automatisch CI/CD Pipeline
2. Pipeline führt Tests aus
3. Bei Erfolg: Automatisches Deployment zu Vercel Production

### Manual Deployment

```bash
# 1. Build lokal testen
npm run build

# 2. Deploy zu Vercel
vercel --prod

# 3. Edge Functions deployen
supabase functions deploy --no-verify-jwt
```

## Post-Deployment Verification

### 1. Smoke Tests

```bash
# Teste Haupt-Endpunkte
curl https://your-domain.com
curl https://your-project.supabase.co/functions/v1/check-devices
curl https://your-project.supabase.co/functions/v1/fetch-ics
```

### 2. Health Checks

- [ ] Frontend lädt korrekt
- [ ] Login funktioniert
- [ ] Calendar lädt Events
- [ ] Edge Functions antworten
- [ ] EC2 Service erreichbar

### 3. Monitoring Verification

- [ ] Error Tracking empfängt Events
- [ ] Analytics trackt Traffic
- [ ] Logs erscheinen in Supabase Dashboard
- [ ] Alerts funktionieren

## Rollback Procedure

Bei kritischen Problemen:

```bash
# 1. Vercel Rollback
vercel rollback

# 2. Edge Functions Rollback
supabase functions deploy check-devices --version <previous-version>

# 3. Database Rollback (falls Migration fehlgeschlagen)
# Führe Rollback-Migration im Supabase SQL Editor aus
```

## Incident Response

Bei Production-Ausfällen:

1. **Identifiziere das Problem**
   - Check Vercel Status
   - Check Supabase Status
   - Check Error Tracking (Sentry)
   - Check Application Logs

2. **Kommuniziere**
   - Informiere Team
   - Update Status Page (falls vorhanden)

3. **Behebe das Problem**
   - Hotfix oder Rollback
   - Teste lokal vor Deployment

4. **Dokumentiere**
   - Post-Mortem schreiben
   - Root Cause Analysis
   - Präventive Maßnahmen definieren


