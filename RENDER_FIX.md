# 🚨 RENDER DEPLOYMENT FIX

## Error: Cannot find module '/opt/render/project/src/server/start'

### The Problem
Render is trying to run `node start` instead of `npm start`.

### The Solution

**Go to your Render dashboard:**

1. Navigate to your service: **cse-web-quiz**
2. Click on **Settings** (left sidebar)
3. Scroll to **Build & Deploy** section
4. Find **Start Command** field
5. **Change it from:**
   ```
   node start
   ```
   **To:**
   ```
   npm start
   ```
6. Click **Save Changes**
7. Click **Manual Deploy** → **Deploy latest commit**

---

## Alternative: If above doesn't work

Update these settings in Render:

**Root Directory:** `server`

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
node dist/index.js
```

**Environment Variables:**
- `NODE_ENV` = `production`
- `MONGODB_URI` = `mongodb+srv://quizadmin:karthik123@cluster0.mzjcknt.mongodb.net/QuizDB?retryWrites=true&w=majority&appName=Cluster0`
- `JWT_SECRET` = `your_super_secret_jwt_key_123`
- `PORT` = `10000` (Render uses port 10000 by default)

---

## After Backend is Deployed

### Deploy Frontend to Vercel:

1. Go to https://vercel.com
2. Import `CSE_Web_Quiz` repository
3. **Settings:**
   - Framework: **Vite**
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Environment Variables:**
   ```
   VITE_API_URL=https://cse-web-quiz.onrender.com
   VITE_SOCKET_URL=https://cse-web-quiz.onrender.com
   ```

5. Click **Deploy**

---

## Testing After Deployment

1. Visit your Vercel frontend URL
2. Try logging in with test accounts:
   - TZ2024001 / 9876543210
   - TZ2024002 / 9876543211
   - TZ2024003 / 9876543212

3. Admin panel: `https://your-frontend-url.vercel.app/admin`
