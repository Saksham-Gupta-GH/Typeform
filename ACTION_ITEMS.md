# Immediate Action Items - Get Everything Working

## 🚨 Critical (Do These First)

### Step 1: Pull Latest Code
```bash
cd ~/Typeform
git pull origin main
```

### Step 2: Run Database Migration
**On Your Local Mac**:
```bash
cd backend
python3 migrate_db.py
# Output should be: ✓ Migration complete!
```

**On Azure VM** (Already done, but verify):
```bash
ssh azureuser@20.219.130.205
cd Typeform/backend
sqlite3 typeform_clone.db ".schema forms" | grep description
# Should show: description VARCHAR
```

### Step 3: Restart Backend

**Local Mac**:
```bash
cd backend

# Kill old process
lsof -ti:8000 | xargs kill -9

# Start fresh
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Azure VM**:
```bash
ssh azureuser@20.219.130.205
cd Typeform/backend
source venv/bin/activate
sudo fuser -k 8000/tcp
git pull origin main
python3 migrate_db.py
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```

### Step 4: Verify Backend Works
```bash
curl http://localhost:8000
# Should return: {"message": "Typeform Clone API is running"}
```

### Step 5: Start Frontend
```bash
cd frontend
export NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
# Should be running on http://localhost:3000
```

---

## ✅ Verification Checklist

After completing the above steps, test each feature:

- [ ] **Create Form**: Click "Create form" → New form appears
- [ ] **Add Elements**: Click "Add content" → Modal opens with question types
- [ ] **Add Short Text**: Select "Short Text" from modal → Question appears in builder
- [ ] **Drag-Drop**: Add 2+ questions → Hover over question to see grip `⋮⋮` → Drag works
- [ ] **Edit Question**: Click question → Edit title in right sidebar → Changes save
- [ ] **Delete Question**: Right-click or hover → Click trash icon → Question deleted
- [ ] **Share Form**: Click "Share" button → Link copied to clipboard
- [ ] **Fill Form**: Go to share link → Fill out form → Submit button works
- [ ] **View Results**: Back to builder → See results in dashboard
- [ ] **Drag-Drop Works**: Questions in left sidebar are draggable and reorder

---

## 📊 Expected Test Results

### Test: Create Form
```
1. Go to http://localhost:3000
2. Click "Create form"
3. ✓ New form appears in list
4. ✓ Redirected to builder
```

### Test: Add Question
```
1. Click "Add content"
2. Click "Add form elements"
3. Select "Short Text"
4. ✓ Question appears in left sidebar
```

### Test: Drag-Drop
```
1. Add 3 questions
2. Hover over middle question
3. ✓ Grip icon `⋮⋮` appears
4. Drag up → Question moves
5. ✓ Order persists after refresh
```

### Test: Fill Form
```
1. Click "Share" → Copy link
2. Open link in new tab
3. See welcome screen
4. Click "start"
5. Answer questions (1 at a time)
6. Click "Submit"
7. ✓ See thank you message
8. Back in builder → See response in Results tab
```

---

## 🔍 If Something's Still Not Working

### Check 1: Database Column
```bash
cd backend
sqlite3 typeform_clone.db ".schema forms"
# Must contain: description VARCHAR
```

If not:
```bash
python3 migrate_db.py
```

### Check 2: Backend Logs
```bash
# Local
tail -f ~/.bash_sessions  # or check terminal output

# Azure
ssh azureuser@20.219.130.205
tail -f ~/Typeform/backend/backend.log
```

### Check 3: Browser Console
```
Open browser → F12 → Console tab → Look for red errors
```

### Check 4: API Test
```bash
# Test create form endpoint
curl -X POST http://localhost:8000/forms \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Form"}'

# Should return form object with id
```

### Check 5: Frontend Environment
```bash
# Make sure API URL is set
echo $NEXT_PUBLIC_API_URL
# Should output: http://localhost:8000

# If not set:
export NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📝 Summary of Changes Since Last Work

**Latest commits pushed**:
- `13a296d` - Added FIX_NOT_WORKING.md guide + verify_setup.sh
- `a9fcbc9` - Added migrate_db.py for schema migrations
- `2122e26` - Added QUICK_START.md guide
- `489c606` - Added FREE_TIER_LIMITATION.md
- `20a9218` - Fixed OpenRouter retry logic

**What works now**:
✅ Create forms  
✅ All 11 question types  
✅ Drag-drop reordering  
✅ Form sharing  
✅ Respondent experience  
✅ Results analytics  
✅ CSV export  
✅ Automatic API retries  

**What needs setup**:
⚠️ AI generation (requires free OpenRouter API key)  
⚠️ Backend database schema (run migration script)  

---

## 🎯 After Everything Works

1. **Share Form**: Create a test form → Share link with someone
2. **Collect Responses**: They fill it out → You see responses in dashboard
3. **AI Generation** (optional): Get free API key from openrouter.ai → Set in Vercel env vars
4. **Deploy**: All code is production-ready → Push to GitHub → Auto-deploys to Vercel

---

## 📞 Quick Help Reference

| Problem | Solution |
|---------|----------|
| "Failed to create form" | Restart backend + run migration |
| "table forms has no column named description" | Run `python3 migrate_db.py` |
| "Cannot POST /questions" | Backend API endpoint broken - restart |
| Drag-drop not working | Hard refresh browser, check questions loaded |
| "API rate limit exceeded" | Get OpenRouter API key or use manual form creation |
| Form not saving | Check backend logs: `tail backend.log` |
| Can't see questions | Refresh page, check browser console |

---

**Start Time**: Now  
**Expected Time to Fix**: 10-15 minutes  
**Success Criteria**: All 10 verification checks pass ✓

Good luck! 🚀
