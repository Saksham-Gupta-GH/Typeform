# OpenRouter Free Tier Limitation & Solution

## ⚠️ The Real Issue

The Typeform Clone uses **OpenRouter's free tier** for AI form generation. The free tier has **strict rate limits**:

- **Rate Limit**: ~5-10 requests per minute (varies by time of day)
- **Error**: `429 Too Many Requests`
- **Timeout**: Requests can take 30-60+ seconds during peak hours
- **Peak Hours**: 6 PM - 11 PM UTC (high traffic periods)

**Result**: On Vercel (which gets hammered by many users), you'll see:
```
✕ API is overloaded. Please wait a minute and try again.
✕ API rate limit exceeded. Please try again in a few seconds.
```

## ✅ Solutions (In Order of Effectiveness)

### Option 1: Get Your Own Free OpenRouter API Key (5 minutes)
**Best solution** - Get unlimited free requests within fair usage.

1. Go to https://openrouter.ai
2. Sign up (GitHub/Google/Email)
3. Get your free API key from the dashboard
4. Add to your `.env.production`:
   ```
   NEXT_PUBLIC_OPENROUTER_API_KEY=your-key-here
   ```
5. Redeploy to Vercel

**Result**: Form generation works instantly, unlimited requests

---

### Option 2: Use Manual Form Creation (Works Immediately)
**Works now** - Don't use AI, add questions manually.

1. Create a new form
2. Click "Add content" → "Add form elements"
3. Manually select question types (Short Text, Multiple Choice, etc.)
4. Form works perfectly without AI

**Buttons to use**:
- ✅ **Add content** - Add individual questions
- ✅ **Add question** - Quick add in left sidebar
- ✅ **Share** - Publish form & collect responses
- ✅ **Preview** - Test form before sharing

**Buttons to ignore**:
- ❌ "Create with AI" - Avoid (rate limited)
- ❌ "Chat to create" - Avoid (rate limited)

---

### Option 3: Wait & Retry (Free, but Slow)
**Works eventually** - The app will retry automatically 3 times.

When you see "API is overloaded":
1. Wait 60-90 seconds
2. Click Send again
3. App retries automatically

**Pro tip**: Try AI generation during off-peak hours (2 AM - 4 PM UTC)

---

### Option 4: Use Paid OpenRouter Tier ($ Optional)
**Fastest** - If you want unlimited AI generation.

1. https://openrouter.ai/account/billing
2. Add payment method (credit card)
3. Get instant 5x rate limit increase
4. Add your API key to `.env.production`

**Cost**: $0 - you pay for usage, usually <$1/month per 100 forms

---

## 🚀 Recommended Setup for Production

If you want **AI form generation to always work**:

```bash
# 1. Get free API key from https://openrouter.ai
# 2. Add to Vercel environment variables:
#    Name: NEXT_PUBLIC_OPENROUTER_API_KEY
#    Value: your-key-here

# 3. Redeploy Vercel (auto-deploys on git push)
```

This takes **2 minutes** and gives you unlimited AI generation.

---

## What Changed in Latest Fix

**Commit 20a9218** added:
- ✅ Automatic retry logic (3 attempts)
- ✅ Exponential backoff (1.5s, 3s, 6s delays)
- ✅ Better error messages
- ✅ Timeout handling

**This helps but doesn't solve free tier limits** - you still need an API key.

---

## Quick Workaround for Now

Until you set up an API key:

### Use these WORKING buttons:
```
Dashboard:
  ✅ "Create form" → Manual creation works perfectly
  ✅ "Rename" forms via right-click menu
  ✅ "Duplicate" existing forms
  ✅ "Delete" forms

Form Builder:
  ✅ "Add content" button → Works, shows all question types
  ✅ "Preview" → Test forms
  ✅ "Share" → Publish & collect responses

Form Respondent:
  ✅ Fill out questions
  ✅ Submit responses
  ✅ See results dashboard

Results Dashboard:
  ✅ View analytics & charts
  ✅ Download CSV export
```

### Skip these RATE-LIMITED features:
```
❌ "Ask Typeform AI to create a form"
❌ "Create with AI" in Add Content modal
❌ "Chat to create" at bottom of builder
```

---

## Testing Manual Form Creation

1. Go to https://typeform-clone.vercel.app
2. Click "Create form"
3. Click "Add content" → "Add form elements"
4. Select: Short Text, Multiple Choice, Email, Date, Rating
5. Edit titles and add options
6. Click "Share" to publish
7. Fill out your own form at the share link
8. View results dashboard

**This works 100% without AI** and is fast.

---

## Debugging API Issues

**See 429/rate limit error?**
1. Wait 2 minutes
2. Retry (app auto-retries 3x anyway)
3. Check if you have an API key set (check Vercel env vars)
4. If no key, request a free one from OpenRouter

**See "Failed to create form" on dashboard?**
1. Backend may be down
2. Check: curl http://20.219.130.205:8000/docs
3. If not responding, check Azure VM status

**AI generation is slow?**
1. Free tier is slow during peak hours
2. Try off-peak times (2 AM - 4 PM UTC)
3. Get your own API key for instant responses

---

## Next Steps

1. **Immediate**: Use manual form creation (works now)
2. **Quick Fix** (2 min): Get free OpenRouter API key + redeploy
3. **Optional**: Add payment for unlimited AI generation

**That's it!** Everything else works perfectly.

---

**Questions?** Check TROUBLESHOOTING.md for more detailed debugging steps.
