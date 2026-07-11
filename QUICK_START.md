# Quick Start Guide - Typeform Clone

## Get Started in 30 Seconds

### 1. Access the App
- **Live**: https://typeform-clone.vercel.app
- **Local**: `npm run dev` in `frontend/` folder (port 3000)

### 2. Create Your First Form

#### Option A: AI Generation (Recommended)
```
1. Get free OpenRouter key: https://openrouter.ai (2 minutes)
2. Add to Vercel environment variables:
   NEXT_PUBLIC_OPENROUTER_API_KEY=your-key-here
3. Go to app → Click "Ask Typeform AI to create a form"
4. Type: "Customer feedback survey"
5. Done! Form generated with 3-8 questions
```

#### Option B: Manual Creation (Works Now)
```
1. Click "Create form"
2. Click "Add content"
3. Select question types (Short Text, Multiple Choice, etc.)
4. Edit questions and click "Add question"
5. Click "Share" to publish
6. Share link with respondents
```

---

## All Working Features

### Dashboard
✅ Create form  
✅ Rename form (right-click)  
✅ Duplicate form (right-click)  
✅ Delete form (right-click)  
✅ View form list  

### Form Builder
✅ Add question types (11 types total)  
✅ Drag to reorder questions  
✅ Edit question title & description  
✅ Delete questions  
✅ Add choices for multiple choice/dropdown  
✅ Set rating stars  
✅ Make questions required  
✅ Live preview  
✅ Publish/Share  

### Form Respondent
✅ Fill out questions  
✅ Keyboard navigation (Enter to next)  
✅ See progress bar  
✅ Validation errors  
✅ Submit responses  

### Results Dashboard
✅ View response count  
✅ See response analytics  
✅ View charts for multiple choice questions  
✅ Download CSV export  
✅ View all responses in table  

---

## 11 Question Types Supported

1. **Short Text** - One-line answers
2. **Long Text** - Multi-line answers
3. **Multiple Choice** - Select one option
4. **Dropdown** - Select from list
5. **Email** - Email validation included
6. **Phone Number** - Phone number input
7. **Number** - Numeric input with min/max
8. **Yes/No** - Two button choice
9. **Rating** - Star rating (3-10 stars)
10. **Date** - Date picker
11. **Statement** - Display text only

---

## Common Tasks

### Create and Share a Form
```
1. Click "Create form"
2. Name your form (edit in builder)
3. Click "Add content" → choose question types
4. Add 3-5 questions
5. Click "Share" button (top right)
6. Copy the link
7. Share with others
```

### Collect Responses
```
1. Share form link with respondents
2. They fill out questions (1 at a time)
3. They submit
4. Responses appear in Results dashboard
```

### View Results
```
1. Form list on dashboard
2. Right-click form → "Content" to open builder
3. Click back to dashboard → form row
4. Click form name
5. See Results tab (if you added responses)
```

### Export Data
```
1. Go to Results dashboard
2. Click "Download CSV" button
3. File downloads with all responses
```

---

## Troubleshooting

### "API rate limit exceeded"
**Solution**: Use manual form creation (Option B above)  
**Or**: Get free OpenRouter API key (2 minutes)  
See `FREE_TIER_LIMITATION.md` for details

### "Failed to create form"
**Solution**: Backend may be down  
Check: `curl http://20.219.130.205:8000/docs`  
If not working, backend needs restart

### Drag-and-drop not working
**Solution**: 
1. Hover over question in left sidebar
2. Look for `⋮⋮` grip icon (appears on hover)
3. Click and drag that icon (not the text)
4. Should now reorder smoothly

### Form preview not showing
**Solution**: Click "Add content" first to add questions

---

## Feature Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Create forms | ✅ Works | Manual + AI |
| 11 question types | ✅ Works | All functional |
| Drag-drop reorder | ✅ Works | Hover for grip icon |
| Live preview | ✅ Works | Canvas shows real-time |
| Share forms | ✅ Works | Generates share link |
| Collect responses | ✅ Works | 1 question at a time |
| Analytics dashboard | ✅ Works | Charts + CSV export |
| AI generation | ⚠️ Rate limited | Free tier, use API key |
| Design customization | ⏸️ Coming | Not in v1 |
| Branching/Piping | ⏸️ Coming | Not in v1 |

---

## Keyboard Shortcuts

**In Form Respondent**:
- `Enter` - Next question
- `Shift+Enter` - Previous question (textarea only)
- `Esc` - Abandon and go back

**In Form Builder**:
- `Cmd+Enter` / `Ctrl+Enter` - Generate with AI (if using chat)

---

## File Structure

```
frontend/
  ├─ src/app/
  │  ├─ page.tsx          → Dashboard
  │  ├─ builder/[id]/     → Form builder
  │  ├─ form/[shareToken] → Respondent form
  │  └─ results/[id]      → Results dashboard
  ├─ src/lib/
  │  ├─ api.ts            → API calls
  │  └─ openrouter.ts     → AI integration
  └─ package.json

backend/
  ├─ main.py              → FastAPI server
  ├─ models.py            → Database models
  ├─ routers/
  │  ├─ forms.py          → Form endpoints
  │  ├─ questions.py      → Question endpoints
  │  └─ responses.py      → Response endpoints
  └─ database.py          → SQLite connection
```

---

## Next Steps

1. **Try manual form creation** - Works immediately
2. **Get OpenRouter key** - Enables AI (5 minutes)
3. **Share a form** - Collect real responses
4. **View analytics** - See results dashboard
5. **Download CSV** - Export data for analysis

**Questions?** Check `TROUBLESHOOTING.md` or `FREE_TIER_LIMITATION.md`

---

**Version**: 1.0  
**Last Updated**: July 11, 2026  
**Status**: Production Ready
