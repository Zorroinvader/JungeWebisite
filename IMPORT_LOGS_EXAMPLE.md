# Import Console Logs Example

## How to View Logs

1. **Open Browser Console:**
   - Press `F12` in your browser
   - Or Right-click → "Inspect" → "Console" tab

2. **Start Import:**
   - Go to Admin Panel → Settings Tab
   - Click "Aus altem Kalender importieren"

3. **Watch Live Logs:**
   - All import progress will be shown in real-time

## Expected Console Output

```
═══════════════════════════════════════════════════════════
🚀 CALENDAR IMPORT STARTED
═══════════════════════════════════════════════════════════
⏰ Start Time: 10/12/2025, 10:30:45 AM
🔗 ICS Feed URL: https://export.kalender.digital/ics/0/a6949578f7eb05dc5b2d/gesamterkalender.ics?past_months=3&future_months=36

───────────────────────────────────────────────────────────
📡 PHASE 1: FETCHING ICS FEED
───────────────────────────────────────────────────────────
📥 Fetching ICS feed...
🌐 Fetching from URL: https://export.kalender.digital/...
📡 Response status: 200 OK
📋 Content-Type: text/calendar
📄 ICS content length: 125430 characters
🔍 Content preview: BEGIN:VCALENDAR
VERSION:2.0
PRODID:kalender.digital
METHOD:PUBLISH
BEGIN:VEVENT
UID:KDIG1168049387
DTSTART;VALUE=DATE:20250712
SEQUENCE:0
TRANSP:OPAQUE
DTEND;VALUE=DATE:20250713
LOCATION:Club...
⚙️  Parsing ICS content...
✅ Parsed 150 events
📊 Events by category:
   - Vermietet - Privatveranstaltung: 45
   - Vermietet - Öffentliche Veranstaltung: 12
   - Geblockt - Regelveranstaltung: 78
   - Geblockt - Veranstaltung Junge Gesellschaft: 8
   - Geblockt - Öffentliche Veranstaltung: 7
✅ Fetch completed in 1250ms
📊 Total events parsed: 150

───────────────────────────────────────────────────────────
📋 SAMPLE OF PARSED EVENTS (First 3):
───────────────────────────────────────────────────────────
1. Feier
   📅 Date: 7/12/2025
   🏷️ Category: Vermietet - Privatveranstaltung
   🔒 Private: true
   📍 Location: Club der Jungen Gesellschaft Pferdestall Wedes-Wedel e.V.

2. Regeltermin - Skat Abend
   📅 Date: 7/23/2025
   🏷️ Category: Geblockt - Regelveranstaltung
   🔒 Private: false
   📍 Location: Jugendclub Pferdestall der Jungen Gesellschaft

3. Privatveranstaltung
   📅 Date: 7/26/2025
   🏷️ Category: Vermietet - Privatveranstaltung
   🔒 Private: true
   📍 Location: Club der Jungen Gesellschaft Pferdestall Wedes-Wedel e.V.

───────────────────────────────────────────────────────────
📡 PHASE 2: CHECKING FOR DUPLICATES
───────────────────────────────────────────────────────────
🔍 Fetching existing events from database...
📊 Found 0 existing events in database

───────────────────────────────────────────────────────────
📡 PHASE 3: IMPORTING EVENTS
───────────────────────────────────────────────────────────
[1/150] 📝 Creating: "Feier"
         📅 7/12/2025 - 7/13/2025
         🎨 Type: private, Private: true
[1/150] ✅ SUCCESS: "Feier"

[2/150] 📝 Creating: "Regeltermin - Skat Abend"
         📅 7/23/2025 - 7/23/2025
         🎨 Type: blocked, Private: false
[2/150] ✅ SUCCESS: "Regeltermin - Skat Abend"

[3/150] 📝 Creating: "Privatveranstaltung"
         📅 7/26/2025 - 7/27/2025
         🎨 Type: private, Private: true
[3/150] ✅ SUCCESS: "Privatveranstaltung"

[4/150] 📝 Creating: "Privatparty"
         📅 8/2/2025 - 8/3/2025
         🎨 Type: private, Private: true
[4/150] ✅ SUCCESS: "Privatparty"

... (continues for all 150 events)

[150/150] 📝 Creating: "Regeltermin - Skat Abend"
         📅 10/11/2028 - 10/11/2028
         🎨 Type: blocked, Private: false
[150/150] ✅ SUCCESS: "Regeltermin - Skat Abend"


═══════════════════════════════════════════════════════════
🎉 IMPORT COMPLETED
═══════════════════════════════════════════════════════════
📊 STATISTICS:
   ✅ Successfully imported: 150
   ❌ Errors: 0
   ⏭️  Skipped (duplicates): 0
   📊 Total processed: 150

⏱️  TIMING:
   📥 Fetch time: 1250ms
   💾 Import time: 45780ms
   🕐 Total time: 47030ms

⏰ End Time: 10/12/2025, 10:31:32 AM
═══════════════════════════════════════════════════════════
🔄 Reloading page...
```

## If Running Again (Duplicates)

```
───────────────────────────────────────────────────────────
📡 PHASE 3: IMPORTING EVENTS
───────────────────────────────────────────────────────────
[1/150] ⏭️  SKIP (duplicate): "Feier"
[2/150] ⏭️  SKIP (duplicate): "Regeltermin - Skat Abend"
[3/150] ⏭️  SKIP (duplicate): "Privatveranstaltung"
... (all skipped)

═══════════════════════════════════════════════════════════
🎉 IMPORT COMPLETED
═══════════════════════════════════════════════════════════
📊 STATISTICS:
   ✅ Successfully imported: 0
   ❌ Errors: 0
   ⏭️  Skipped (duplicates): 150
   📊 Total processed: 150
```

## If Errors Occur

```
[45/150] 📝 Creating: "Problem Event"
         📅 8/15/2025 - 8/16/2025
         🎨 Type: public, Private: false
[45/150] ❌ ERROR: "Problem Event"
         ⚠️  duplicate key value violates unique constraint
Error: duplicate key value violates unique constraint "events_pkey"
    at ...stack trace...

... (continues)

═══════════════════════════════════════════════════════════
🎉 IMPORT COMPLETED
═══════════════════════════════════════════════════════════
📊 STATISTICS:
   ✅ Successfully imported: 145
   ❌ Errors: 5
   ⏭️  Skipped (duplicates): 0
   📊 Total processed: 150

───────────────────────────────────────────────────────────
⚠️  ERRORS DETAILS:
───────────────────────────────────────────────────────────
1. Event: "Problem Event"
   Error: duplicate key value violates unique constraint

2. Event: "Another Problem"
   Error: null value in column "start_date" violates not-null constraint
```

## What to Look For

### ✅ Success Indicators:
- `✅ Fetch completed` - ICS feed loaded
- `✅ Parsed X events` - Events were parsed
- `✅ SUCCESS: "Event Name"` - Event created
- `🎉 IMPORT COMPLETED` - All done

### ⚠️ Warning Indicators:
- `⏭️ SKIP (duplicate)` - Normal, prevents duplicates
- More skips than expected → Already imported

### ❌ Error Indicators:
- `❌ ERROR:` - Individual event failed
- `💥 IMPORT FAILED` - Entire import crashed
- Check error details for specific issues

## Timing Expectations

- **Small Import (< 50 events):** 10-20 seconds
- **Medium Import (50-200 events):** 30-60 seconds
- **Large Import (200+ events):** 1-3 minutes

Each event takes approximately 200-300ms to create in the database.

## Troubleshooting

### Long Fetch Time (> 5 seconds)
- Slow internet connection
- ICS feed server is slow
- Check network tab in DevTools

### Many Errors
- Database schema issue
- RLS policies blocking inserts
- Check error messages for clues

### All Events Skipped
- Already imported before
- This is normal on second run
- No action needed

## Tips

1. **First Run:** Expect all events to be imported (0 skipped)
2. **Second Run:** Expect all events to be skipped (duplicates)
3. **Save Logs:** Right-click in console → "Save as..." to keep logs
4. **Filter Logs:** Use console filter box to search for specific terms
5. **Clear Console:** Click 🚫 icon before import for clean logs

---

**Ready to Import?**
1. Open Browser Console (F12)
2. Click "Aus altem Kalender importieren"
3. Watch the logs in real-time!

