⚠️  READ THIS FIRST - GET EVERYTHING WORKING ⚠️

PROBLEM:
--------
Features not working: Create form, Add elements, AI, Drag-drop

ROOT CAUSE:
-----------
Database schema mismatch. The migration wasn't run after pulling latest code.

SOLUTION (10-15 minutes):
-----------

1. PULL LATEST CODE
   cd ~/Typeform
   git pull origin main

2. RUN DATABASE MIGRATION
   cd backend
   python3 migrate_db.py
   # Output: ✓ Migration complete!

3. RESTART BACKEND
   # Kill old process
   lsof -ti:8000 | xargs kill -9
   
   # Start fresh
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload

4. VERIFY BACKEND WORKS
   curl http://localhost:8000
   # Should return: {"message": "Typeform Clone API is running"}

5. START FRONTEND
   cd frontend
   export NEXT_PUBLIC_API_URL=http://localhost:8000
   npm run dev
   # Open: http://localhost:3000

TESTING:
--------

✓ Create Form
  - Click "Create form"
  - New form appears in list

✓ Add Elements
  - Click "Add content"
  - Select "Short Text"
  - Question appears

✓ Drag-Drop
  - Add 2+ questions
  - Hover over question to see grip ⋮⋮
  - Drag to reorder

✓ Fill Form
  - Click "Share" → Copy link
  - Open link → Fill out form
  - Submit → See results

DOCUMENTATION:
-----------

For detailed help, see:
- ACTION_ITEMS.md ← START HERE (step-by-step guide)
- FIX_NOT_WORKING.md (comprehensive troubleshooting)
- FREE_TIER_LIMITATION.md (AI rate limit info)
- QUICK_START.md (feature overview)

AZURE VM:
---------

Already migrated ✓
Backend running ✓
Status: Ready to use

IMPORTANT NOTES:
-----------

✅ Database migration automatically handles schema changes
✅ All 11 question types work
✅ Drag-drop fully functional (after restart)
✅ Form sharing works
✅ Results dashboard works
✅ CSV export works
⚠️  AI needs OpenRouter API key (free tier rate limited)

QUICK VERIFICATION:
-----------

Everything working if:
□ "Create form" button works
□ "Add content" modal opens
□ Question types load in modal
□ Drag-drop reorders questions
□ Share button copies link
□ Form respondent flow works
□ Results dashboard shows data

STUCK? 
------

Check backend logs:
  tail backend.log
  
Check browser console:
  F12 → Console → Look for errors

Verify database:
  sqlite3 typeform_clone.db ".schema forms" | grep description
  # Must show: description VARCHAR

Test API:
  curl http://localhost:8000/forms
  # Must return JSON array

═══════════════════════════════════════════════════════════════════════════════

                    READ ACTION_ITEMS.md FOR FULL GUIDE

═══════════════════════════════════════════════════════════════════════════════
