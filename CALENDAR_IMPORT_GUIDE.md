# Calendar Import Guide

## Overview
This guide explains how to import events from your old calendar system (kalender.digital) into your new event management system.

## Features

### ✅ What Gets Imported
- **Event titles** (SUMMARY)
- **Dates and times** (DTSTART, DTEND)
- **All-day events** and timed events
- **Location information**
- **Event descriptions**
- **Event categories** (mapped to your new system)
- **Attendee information**
- **Privacy settings** (Public/Private)

### 🎨 Category Mapping

The import automatically maps old categories to your new color scheme:

| Old Category | New Type | Color | Privacy |
|-------------|----------|-------|---------|
| Vermietet - Privatveranstaltung | `private` | Green | Private |
| Vermietet - Öffentliche Veranstaltung | `public` | Dark Blue | Public |
| Geblockt - Regelveranstaltung | `blocked` | Grey | Public |
| Geblockt - Veranstaltung Junge Gesellschaft | `blocked` | Grey | Public |
| Geblockt - Öffentliche Veranstaltung | `blocked` | Grey | Public |

## Setup Instructions

### Step 1: Run Database Migration

First, add the necessary database fields to support imported events:

```bash
# In your Supabase SQL Editor, run:
database/add-import-fields.sql
```

This adds the following fields to your `events` table:
- `imported_from` - Source identifier (e.g., "old_calendar")
- `imported_at` - Timestamp of import
- `imported_uid` - Original event UID (prevents duplicates)
- `category` - Original category from old system
- `attendee_info` - Attendee information

### Step 2: Use the Import Function

1. **Navigate to Admin Panel**
   - Go to `/admin` in your application
   - Click on the "Einstellungen" (Settings) tab

2. **Find the Import Section**
   - Scroll to "Daten Import"
   - Click "Aus altem Kalender importieren"

3. **Confirm Import**
   - A confirmation dialog will appear
   - Click "OK" to start the import process

4. **Wait for Completion**
   - The import may take 1-3 minutes depending on the number of events
   - Do not close the browser or navigate away

5. **Review Results**
   - A summary will show:
     - ✅ Successfully imported events
     - ❌ Errors (if any)
     - ⏭️ Skipped duplicates

6. **Page Refresh**
   - The page will automatically reload
   - Your imported events will now be visible in the calendar

## How It Works

### ICS Feed URL
```
https://export.kalender.digital/ics/0/a6949578f7eb05dc5b2d/gesamterkalender.ics?past_months=3&future_months=36
```

This feed includes:
- Past 3 months of events
- Future 36 months of events

### Import Process

1. **Fetch ICS Feed**
   - Downloads the ICS file from kalender.digital
   - Parses the iCalendar format

2. **Parse Events**
   - Extracts all event fields
   - Converts ICS date formats to JavaScript dates
   - Maps categories to your new system

3. **Check for Duplicates**
   - Uses `imported_uid` to prevent duplicate imports
   - Skips events that have already been imported

4. **Create Events**
   - Inserts new events into your database
   - Sets status to "approved" (all imported events are pre-approved)
   - Preserves original metadata

5. **Display Results**
   - Shows import statistics
   - Logs details to browser console

## Duplicate Prevention

The system automatically prevents duplicate imports:
- Each event has a unique `imported_uid` from the original calendar
- On subsequent imports, events with matching UIDs are skipped
- You can safely run the import multiple times

## Event Display

After import, events will display in your calendar with the correct colors:

### For All Users:
- **Dark Blue** - Public events
- **Grey** - Blocked events

### For Admins:
- **Green** - Private events
- **Orange** - Temporarily blocked/pending requests

### For Logged-in Users:
- **Green** - Their own private events

## Troubleshooting

### Import Failed Error
**Problem:** "Import fehlgeschlagen" message appears

**Solutions:**
1. Check your internet connection
2. Verify the ICS feed URL is accessible
3. Check browser console for detailed error messages
4. Ensure database migration was run successfully

### No Events Imported
**Problem:** Import completes but shows 0 events

**Possible Causes:**
1. All events were already imported (duplicates)
2. ICS feed is empty or invalid
3. Date range outside of past 3 months / future 36 months

### Some Events Skipped
**Problem:** Some events show as "Übersprungen"

**Reason:** These events were already imported in a previous import. This is normal and prevents duplicates.

## Console Logging

During import, detailed logs are written to the browser console:

```
📥 Fetching ICS feed from: [URL]
✅ Parsed 150 events from ICS feed
✅ Imported: Event Name 1
✅ Imported: Event Name 2
⏭️ Skipping duplicate event: Event Name 3
❌ Error importing event: Event Name 4
```

To view console logs:
1. Press F12 in your browser
2. Click "Console" tab
3. Look for import-related messages

## Best Practices

### 1. Initial Import
- Run once to import all historical and future events
- Review imported events in the admin panel
- Check that categories and colors are correct

### 2. Regular Updates
- Run monthly or quarterly to sync new events
- Duplicates will be automatically skipped
- Only new events will be imported

### 3. Data Verification
After import:
- Check a few sample events
- Verify dates and times are correct
- Confirm privacy settings are as expected
- Test event visibility for different user roles

## Technical Details

### ICS Parser (`src/utils/icsParser.js`)

Key functions:
- `fetchAndParseICS(url)` - Fetches and parses ICS feed
- `parseICSContent(icsContent)` - Parses raw ICS data
- `parseICSDate(icsDate)` - Converts ICS dates to JS dates
- `convertToDBEvent(icsEvent)` - Converts to database format

### Database Schema

New fields added to `events` table:
```sql
imported_from TEXT          -- Source: "old_calendar"
imported_at TIMESTAMPTZ     -- Import timestamp
imported_uid TEXT           -- Original UID (unique)
category TEXT               -- Original category
attendee_info TEXT          -- Attendee details
```

### API Integration

Uses existing `eventsAPI`:
- `eventsAPI.getAll()` - Fetch existing events
- `eventsAPI.create(event)` - Create new event

## Future Enhancements

Planned features:
- ✅ Automatic scheduled imports
- ✅ Selective import (date range, category filters)
- ✅ Import preview before committing
- ✅ Conflict resolution options
- ✅ Import history tracking
- ✅ Rollback capability

## Support

If you encounter issues:
1. Check this guide first
2. Review browser console logs
3. Verify database migration was successful
4. Check Supabase RLS policies allow event creation

---

**Last Updated:** October 2025
**Version:** 1.0.0

