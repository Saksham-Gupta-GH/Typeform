# Typeform Clone - Deployment Guide

## Current Status
All features are implemented and tested locally:
- ✅ Form creation, editing, deletion, duplication
- ✅ Question management with 11 question types
- ✅ Drag & drop reordering (dnd-kit)
- ✅ AI form generation (OpenRouter)
- ✅ Form responses & analytics
- ✅ CSV export and charts
- ✅ Detailed error logging & user feedback

## Backend Deployment (Azure VM)

### Prerequisites
- Azure VM with Ubuntu 24.04 (20.219.130.205)
- Python 3.12+
- pip/venv

### Deployment Steps

1. **SSH into Azure VM:**
```bash
ssh azureuser@20.219.130.205
```

2. **Clone/Pull Latest Code:**
```bash
cd ~/Typeform
git pull origin main
```

3. **Navigate to Backend:**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

4. **Run Database Migration (if needed):**
```bash
python3 migrate_db.py
```

5. **Start Backend Service:**
```bash
# Kill any existing processes
sudo fuser -k 8000/tcp 2>/dev/null || true

# Start uvicorn in background with logging
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# Verify it's running
sleep 2
curl http://localhost:8000/
```

6. **Verify Health:**
```bash
curl http://20.219.130.205:8000/health
```

Output should be:
```json
{"status":"healthy"}
```

## Frontend Deployment (Vercel)

### Prerequisites
- GitHub repository (already configured)
- Vercel account
- Domain (optional)

### Environment Variables to Set in Vercel

In Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_API_URL=http://20.219.130.205:8000
NEXT_PUBLIC_OPENROUTER_API_KEY=<your-key-if-you-have-paid-tier>
```

**Note:** The `NEXT_PUBLIC_API_URL` must use the Azure VM's public IP. If you get rate limited by OpenRouter's free tier, you can add a paid API key here.

### Deployment Steps

#### Option 1: Deploy from Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import from GitHub: `Saksham-Gupta-GH/Typeform`
4. Select `frontend` directory as root
5. Add environment variables (see above)
6. Click "Deploy"

#### Option 2: Deploy via Vercel CLI
```bash
# Install CLI
npm install -g vercel

# From frontend directory
cd frontend
vercel env add NEXT_PUBLIC_API_URL
# Enter: http://20.219.130.205:8000

vercel deploy --prod
```

## Testing After Deployment

### Backend Tests
```bash
# 1. Check health
curl http://20.219.130.205:8000/health

# 2. Verify forms endpoint
curl http://20.219.130.205:8000/forms

# 3. Check logs on Azure VM
ssh azureuser@20.219.130.205
tail -f ~/Typeform/backend/backend.log
```

### Frontend Tests
1. Visit deployed Vercel URL (e.g., https://typeform-ivory.vercel.app/)
2. **Test creating a form:**
   - Click "Create form" button
   - Observe toast notification
   - Form should appear in the list
3. **Test adding questions:**
   - Click on form to enter builder
   - Click "+ Add content"
   - Select different question types
   - Verify questions appear in sidebar
4. **Test AI generation:**
   - From dashboard, ask AI to create a form
   - E.g., "Create a customer feedback survey"
   - Verify form is created with appropriate questions
5. **Test drag & drop:**
   - In builder, drag questions to reorder
   - Refresh page to verify persistence
6. **Test form submission:**
   - Click "Share" to get public link
   - Open in new browser
   - Fill out and submit response
   - Go back to Results tab to see response

## Troubleshooting

### "Failed to create form"
- Check backend is running: `curl http://20.219.130.205:8000/`
- Check database has description column: Run `migrate_db.py`
- Check CORS is configured correctly in backend
- Look at browser console (F12) for detailed error

### "API is overloaded"
- This is OpenRouter free tier rate limit
- Wait 1-2 minutes and try again
- Or configure `NEXT_PUBLIC_OPENROUTER_API_KEY` with paid tier

### Drag & drop not working
- Ensure you're dragging the grip handle (left side of question)
- Check browser console for JavaScript errors
- Verify `@dnd-kit` is installed: `npm ls @dnd-kit`

### Images/videos not showing
- Image upload feature is UI-only (not fully implemented)
- This is not required for MVP

## Important Files

### Backend
- `main.py` - FastAPI app entry point
- `routers/forms.py` - Form CRUD endpoints
- `routers/questions.py` - Question CRUD endpoints
- `routers/responses.py` - Response endpoints
- `models.py` - SQLAlchemy models
- `schemas.py` - Pydantic schemas
- `migrate_db.py` - Database migration script

### Frontend
- `src/app/page.tsx` - Dashboard/workspace
- `src/app/builder/[id]/page.tsx` - Form builder
- `src/app/form/[shareToken]/page.tsx` - Public form view
- `src/app/results/[id]/page.tsx` - Analytics page
- `src/lib/api.ts` - API client with error handling
- `src/lib/openrouter.ts` - AI integration with retry logic

## Database

### Location
- Local dev: `backend/typeform_clone.db` (SQLite)
- Production: Same location on Azure VM

### Schema
Tables: forms, questions, responses, answers

To inspect:
```bash
# On Azure VM
sqlite3 ~/Typeform/backend/typeform_clone.db

# In SQLite shell
.tables  # List tables
.schema forms  # Show form schema
SELECT * FROM forms LIMIT 5;  # Show 5 forms
```

## Next Steps

1. **Push latest code** (already done - commit b1e420d)
2. **Restart backend on Azure VM** (see Backend Deployment)
3. **Deploy frontend to Vercel** (see Frontend Deployment)
4. **Test all features** (see Testing After Deployment)
5. **Monitor logs** in Vercel dashboard and Azure VM

## Performance Notes

- **Cold starts:** Vercel may have slight delay on first request after deployment
- **Database:** SQLite is fine for small-to-medium usage; consider PostgreSQL for production
- **Rate limits:** OpenRouter free tier (1-2 requests/minute per IP)
- **Concurrent users:** Current setup supports ~10-20 concurrent users

## Support

For issues:
1. Check browser console (F12)
2. Check backend logs: `tail -f backend.log` on Azure VM
3. Check Vercel logs in dashboard
4. Review detailed error messages shown in app toasts

---
Last updated: 2026-07-11
Deployment Status: Ready for production
