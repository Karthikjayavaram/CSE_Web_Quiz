# Vercel Deployment Troubleshooting

## Current Issue: 404 NOT_FOUND after authentication

### Quick Checks:

1. **Verify vercel.json was deployed:**
   - Go to your Vercel dashboard
   - Click on your project
   - Click on the latest deployment
   - Check "Source Files" tab
   - Confirm `vercel.json` exists

2. **Check deployment logs:**
   - In Vercel deployment, check "Build Logs"
   - Look for any errors or warnings

3. **Verify environment variables:**
   - Go to Vercel → Settings → Environment Variables
   - Confirm these exist:
     - `VITE_API_URL` = `https://cse-web-quiz.onrender.com`
     - `VITE_SOCKET_URL` = `https://cse-web-quiz.onrender.com`

4. **Test backend directly:**
   - Open: `https://cse-web-quiz.onrender.com/health`
   - Should return: "API is healthy"

### Alternative: Deploy to Render Static Site

If Vercel continues to have issues, try deploying frontend to Render:

1. Render Dashboard → New Static Site
2. Connect to GitHub repo
3. Settings:
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Environment Variables: Same as above

### Debug Steps:

1. **Check browser console** (F12) for errors
2. **Check Network tab** - is the API call failing?
3. **Try accessing routes directly**:
   - `https://your-url.vercel.app/` (should work)
   - `https://your-url.vercel.app/rules` (should show rules page)
   - `https://your-url.vercel.app/quiz` (should show quiz page)
   - `https://your-url.vercel.app/admin` (should show admin panel)

If all direct routes work, the issue is with navigation/redirect.
If direct routes fail, vercel.json didn't work.
