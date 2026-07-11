# Troubleshooting Guide - Typeform Clone

## Common Issues & Solutions

### 🤖 AI Form Generation Issues

#### Issue: "API rate limit exceeded" or "Please try again in a few seconds"
**Status**: This is expected behavior on free OpenRouter tier  
**Solution**:
1. Wait 30-60 seconds
2. Try again with a shorter prompt (fewer words)
3. (Optional) Add your own OpenRouter API key:
   - Create account at https://openrouter.ai
   - Get free API key from dashboard
   - Add to `.env.production` or Vercel environment variables:
     ```
     NEXT_PUBLIC_OPENROUTER_API_KEY=your-key-here
     ```

#### Issue: "AI service is temporarily unavailable"
**Cause**: OpenRouter API server down (rare)  
**Solution**:
1. Wait 5 minutes and try again
2. Check https://openrouter.ai status page
3. Use manual question creation as workaround

#### Issue: "Invalid AI response format" or "No response from AI service"
**Cause**: Network timeout or malformed response  
**Solution**:
1. Check browser console (F12 → Console tab)
2. Verify API URL is correct:
   - Local: `http://localhost:8000`
   - Vercel: `http://20.219.130.205:8000`
3. Try with simpler prompt (e.g., "Customer survey")

---

### 🖱️ Drag-and-Drop Issues

#### Issue: Can't drag questions in the left sidebar
**Solution**:
1. **Hover to see grip handle**: Move mouse over a question - you should see `⋮⋮` icon
2. **Grab the grip handle**: Click and hold on the grip icon (not the text)
3. **Drag up or down**: Move the mouse while holding
4. **Release**: Let go to drop at new position

#### Issue: Mobile drag-and-drop not working
**Cause**: Touch events need special handling  
**Solution**:
1. Long-press on the grip handle (`⋮⋮`)
2. While holding, drag up or down
3. Release to drop
4. (If still not working) Use desktop/laptop for drag operations

#### Issue: Drag doesn't persist after page reload
**Cause**: Backend reorder failed silently  
**Solution**:
1. Check browser console (F12 → Console tab)
2. Look for red error messages
3. Verify backend API is running:
   - Local: `python -m uvicorn main:app --reload` in `backend/` folder
   - Check: `curl http://localhost:8000/docs` → should open API docs
4. If still failing, reload page and try again

---

### 📝 Form Creation Issues

#### Issue: "Failed to create form" on dashboard
**Cause**: Backend API not responding  
**Solution**:
1. **Check backend is running**:
   ```bash
   # Local
   cd backend
   python -m uvicorn main:app --reload
   # Should print: Uvicorn running on http://127.0.0.1:8000
   ```

2. **Check database**:
   ```bash
   cd backend
   # Should exist: backend/typeform.db
   ls -la typeform.db
   ```

3. **Check API endpoint**:
   ```bash
   curl http://localhost:8000/docs  # Should open Swagger UI
   ```

4. **Check logs**:
   - Look in terminal where backend is running
   - Red error messages indicate problems

#### Issue: "Questions not saving" when editing
**Cause**: Network issue or server error  
**Solution**:
1. Check browser console (F12 → Console)
2. Check backend server output for errors
3. Verify database has write permissions:
   ```bash
   chmod 666 backend/typeform.db
   ```

---

### 🌐 API Connection Issues

#### Issue: "Cannot connect to backend" or 502 errors
**Cause**: Wrong API URL or backend not running  
**Solution**:

1. **Check environment variables**:
   - Local: `.env.local` should have `NEXT_PUBLIC_API_URL=http://localhost:8000`
   - Vercel: Check environment variables in Vercel dashboard

2. **Check backend is running**:
   ```bash
   curl http://localhost:8000/api/forms -X GET
   # Should return: []  or list of forms
   ```

3. **Check API URL in next.config**:
   - File: `frontend/next.config.ts`
   - Should have: `destination: ${apiUrl}/:path*`

#### Issue: CORS errors in browser console
**Cause**: Backend CORS settings too restrictive  
**Solution**:
1. Check `backend/main.py` for CORS configuration
2. Should have `allow_origins=["*"]` for development
3. For production, change to: `allow_origins=["https://yourdomain.com"]`

---

### 🚀 Vercel Deployment Issues

#### Issue: "Deployment failed" or "Build error"
**Check Vercel logs**:
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to "Deployments" tab
4. Click on failed deployment
5. Look at build logs at bottom

**Common causes**:
- Missing environment variables (add to Vercel project settings)
- TypeScript errors (run `npm run build` locally first)
- Node version mismatch (Vercel uses Node 18+)

#### Issue: "Vercel app shows blank page"
**Solution**:
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Open browser console (F12 → Console)
3. Look for red errors
4. Check Network tab for failed API requests
5. Verify `NEXT_PUBLIC_API_URL` is set in Vercel environment

---

### 📊 Results Dashboard Issues

#### Issue: "No results shown" or "Charts not loading"
**Cause**: No form responses yet  
**Solution**:
1. Go back to form builder
2. Click "Share" to publish the form
3. Copy the link
4. Fill out the form as a respondent
5. Go back to results dashboard - data should appear

#### Issue: "CSV export button not working"
**Cause**: No responses to export  
**Solution**:
1. Make sure you have at least 1 form response
2. If you do, check browser console for errors
3. Try refreshing the results page

---

### 🔄 Performance Issues

#### Issue: "App is slow" or "Freezing when loading"
**Solutions**:
1. **Clear browser cache**: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
2. **Close other tabs**: Reduces browser memory usage
3. **Check network tab**: F12 → Network → reload page
   - Red requests indicate problems
   - Large file transfers (>1MB) indicate issues
4. **Check backend logs**: Any error messages?

#### Issue: "Initial page load takes >3 seconds"
**Cause**: Cold start on Vercel serverless  
**Solution**:
- This is normal for Vercel free tier
- Subsequent requests will be faster
- Upgrade to Vercel Pro for always-on function scaling

---

### 🐛 TypeScript/Build Errors

#### Issue: "TypeScript errors after code changes"
**Solution**:
```bash
cd frontend
npm run build  # See errors
# Fix them in the editor
npm run build  # Try again
```

#### Issue: "Module not found" errors
**Cause**: Missing dependencies  
**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Getting Help

### Resources
1. **API Documentation**: http://localhost:8000/docs (Swagger UI)
2. **GitHub Issues**: https://github.com/Saksham-Gupta-GH/Typeform/issues
3. **Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
4. **Features Guide**: See `FEATURES.md`

### Debug Checklist
Before asking for help, verify:
- [ ] Backend is running (check terminal output)
- [ ] Database exists (`backend/typeform.db`)
- [ ] Environment variables are set (`.env.local` or Vercel settings)
- [ ] Browser console has no red errors (F12 → Console)
- [ ] Network requests show correct URLs (F12 → Network)
- [ ] Latest code is deployed (`git pull`, rebuild Vercel)

### Reporting Issues
If you still need help:
1. Check the browser console output (F12 → Console)
2. Note the exact error message
3. Check backend logs
4. Open GitHub issue with:
   - What you were doing
   - Exact error message
   - Screenshots
   - Browser/OS details

---

**Last Updated**: July 11, 2026  
**Version**: 1.1
