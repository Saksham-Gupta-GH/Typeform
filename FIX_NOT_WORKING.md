# Fix Guide: "Create Form", "Add Elements", "AI", and "Drag-Drop" Not Working

## Problem Summary
After pulling latest code, the following features are broken:
- ❌ "Create form" button not working
- ❌ "Add elements" / "Add content" modal not responding
- ❌ AI chat not working
- ❌ Drag-and-drop reordering broken

**Root Cause**: Database schema mismatch. The `forms` table is missing the `description` column.

---

## Step 1: Run Database Migration

### On Your Local Machine
```bash
cd backend
python3 migrate_db.py
# Should output: ✓ Migration complete!
```

### On Azure VM (Already Done ✓)
The migration has already been applied:
```bash
# Already ran:
sqlite3 typeform_clone.db "ALTER TABLE forms ADD COLUMN description VARCHAR;"
```

---

## Step 2: Restart Backend

### Option A: Local Development
```bash
cd backend
# Kill any existing process
lsof -ti:8000 | xargs kill -9

# Start fresh backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Option B: Azure VM
```bash
ssh azureuser@20.219.130.205
cd Typeform/backend
source venv/bin/activate

# Kill existing process
sudo fuser -k 8000/tcp

# Run migration
python3 migrate_db.py

# Start backend
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```

---

## Step 3: Verify Backend is Running

```bash
# Check if backend is responding
curl http://localhost:8000
# Should return: {"message": "Typeform Clone API is running"}

# Check API docs
curl http://localhost:8000/docs
# Should return Swagger UI HTML
```

---

## Step 4: Frontend Configuration

### For Local Development
```bash
cd frontend
export NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

### For Vercel/Deployed
- Go to Vercel Dashboard → Project Settings → Environment Variables
- Add: `NEXT_PUBLIC_API_URL=http://20.219.130.205:8000`
- Redeploy

---

## Testing After Fix

### Test 1: Create Form
1. Go to dashboard
2. Click "Create form"
3. **Expected**: New form appears in list, you're redirected to builder

### Test 2: Add Elements
1. In builder, click "Add content"
2. Click "Add form elements"
3. Select a question type (e.g., "Short Text")
4. **Expected**: Modal closes, question appears in left sidebar

### Test 3: Drag-and-Drop
1. Add 3 questions
2. Hover over question in left sidebar
3. Look for grip icon `⋮⋮`
4. Click and drag up/down
5. **Expected**: Question reorders smoothly

### Test 4: AI Generation (If you have API key)
1. Click "Add content" → "Create with AI"
2. Type: "Customer feedback survey"
3. Click Send
4. **Expected**: Questions generated in <10 seconds

---

## Common Errors & Solutions

### Error: "Failed to create form"
**Cause**: Backend not running or API URL wrong  
**Fix**:
```bash
# Check backend is running
curl http://localhost:8000/docs

# If not running, start it:
cd backend && uvicorn main:app --reload
```

### Error: "table forms has no column named description"
**Cause**: Database not migrated  
**Fix**:
```bash
cd backend
python3 migrate_db.py
```

### Error: "CORS error" in browser console
**Cause**: Backend CORS not configured for your frontend URL  
**Fix**: Update `backend/main.py`:
```python
origins = [
    "http://localhost:3000",
    "http://20.219.130.205:3000",
    "http://20.219.130.205",
    "https://your-vercel-domain.vercel.app",  # Add your Vercel URL
]
```

### Error: "Cannot POST /questions"
**Cause**: API endpoint path wrong or backend out of sync  
**Fix**:
```bash
cd backend && git pull origin main
python3 migrate_db.py
uvicorn main:app --reload
```

### Error: Drag-and-drop not working
**Cause**: Usually UI state issue or questions not loaded  
**Fix**:
1. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Reload page if questions don't show
3. Hover over question to see grip icon

---

## Database Checklist

- [ ] Local: Ran `python3 migrate_db.py`
- [ ] Azure: Ran `sqlite3 typeform_clone.db "ALTER TABLE forms ADD COLUMN description VARCHAR;"`
- [ ] Verified database file exists: `backend/typeform_clone.db`
- [ ] Verified `description` column exists: `sqlite3 typeform_clone.db ".schema forms"`

Expected output:
```
CREATE TABLE forms (
        id INTEGER NOT NULL, 
        title VARCHAR NOT NULL, 
        description VARCHAR, 
        status VARCHAR NOT NULL, 
        share_token VARCHAR NOT NULL UNIQUE, 
        created_at DATETIME NOT NULL, 
        updated_at DATETIME NOT NULL,
```

---

## Quick Reference: What Should Work Now

✅ Create form  
✅ Add questions (all 11 types)  
✅ Edit question title/description  
✅ Drag-drop reorder questions  
✅ Add choices for multiple choice/dropdown  
✅ Delete questions  
✅ Publish/Share form  
✅ Fill out form as respondent  
✅ View results & analytics  
✅ Download CSV  
✅ AI generation (with API key)  

---

## Need More Help?

1. Check `backend.log` on Azure VM:
   ```bash
   tail -f ~/Typeform/backend/backend.log
   ```

2. Check browser console:
   - Press `F12`
   - Click "Console" tab
   - Look for red error messages

3. Test API directly:
   ```bash
   # Create form
   curl -X POST http://localhost:8000/forms \
     -H "Content-Type: application/json" \
     -d '{"title":"Test"}'
   
   # Get forms
   curl http://localhost:8000/forms
   ```

4. Check Vercel logs if using deployed frontend:
   - Go to https://vercel.com/dashboard
   - Click on project → Deployments
   - Click on latest deployment
   - Scroll to "Logs" section

---

**Last Updated**: July 11, 2026  
**Status**: All features should now work after running migration and restarting backend
