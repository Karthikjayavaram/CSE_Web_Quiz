# Render Deployment Guide

## Backend Deployment

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect to GitHub repository: `CSE_Web_Quiz`
3. Configure settings:

**Basic Settings:**
- **Name**: `quiz-platform-api` (or your choice)
- **Region**: Singapore (or closest to you)
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: Node
- **Build Command**: 
  ```
  npm install && npm run build
  ```
- **Start Command**: 
  ```
  npm start
  ```

**Environment Variables:**
Click "Advanced" → Add Environment Variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://quizadmin:karthik123@cluster0.mzjcknt.mongodb.net/QuizDB?retryWrites=true&w=majority&appName=Cluster0` |
| `JWT_SECRET` | `your_super_secret_jwt_key_123` (or generate a new secure random string) |
| `PORT` | `5000` |

### Step 3: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Your backend will be live at: `https://quiz-platform-api.onrender.com`

### Step 4: Initialize Database
Once deployed, run these commands via Render Shell:

1. Go to your service → **"Shell"** tab
2. Run:
```bash
npm run seed
npm run init-quiz
```

This seeds 12 test students and initializes the quiz with 20 questions.

---

## Frontend Deployment (Option 1: Vercel - Recommended)

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Select `CSE_Web_Quiz` repository
3. Configure:

**Settings:**
- **Framework Preset**: Vite
- **Root Directory**: `client`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)

**Environment Variables:**
| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://quiz-platform-api.onrender.com` |
| `VITE_SOCKET_URL` | `https://quiz-platform-api.onrender.com` |

### Step 3: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your app will be live at: `https://cse-web-quiz.vercel.app` (or similar)

---

## Frontend Deployment (Option 2: Render)

### Step 1: Create Static Site
1. Click **"New +"** → **"Static Site"**
2. Connect to `CSE_Web_Quiz` repository

### Step 2: Configure
**Settings:**
- **Name**: `quiz-platform-frontend`
- **Branch**: `main`
- **Root Directory**: `client`
- **Build Command**: 
  ```
  npm install && npm run build
  ```
- **Publish Directory**: `dist`

**Environment Variables:**
| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://quiz-platform-api.onrender.com` |
| `VITE_SOCKET_URL` | `https://quiz-platform-api.onrender.com` |

### Step 3: Deploy
Click "Create Static Site" and wait for deployment.

---

## Update Frontend Socket URL

After deploying, you need to update the socket URL in the client code:

1. Edit `client/src/socket.ts`:
```typescript
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://quiz-platform-api.onrender.com';
```

2. Commit and push:
```bash
git add .
git commit -m "Update socket URL for production"
git push origin main
```

Vercel/Render will auto-redeploy.

---

## Testing Production Deployment

1. **Visit your frontend URL**
2. **Test Login**:
   - Use: TZ2024001, TZ2024002, TZ2024003
   - Phones: 9876543210, 9876543211, 9876543212
3. **Complete quiz flow**
4. **Check Admin Panel**: `https://your-frontend-url.com/admin`

---

## Monitoring

### Render Dashboard
- Check logs: Service → "Logs" tab
- Monitor metrics: Service → "Metrics" tab

### Vercel Dashboard
- Check deployments: Project → "Deployments" tab
- View logs: Click on deployment → "Logs"

---

## Troubleshooting

### Backend Issues
- **Build fails**: Check Node version (use 18+)
- **Database connection fails**: Verify MONGODB_URI
- **Port already in use**: Render manages ports automatically

### Frontend Issues
- **API calls fail**: Check VITE_API_URL is correct
- **Socket not connecting**: Verify VITE_SOCKET_URL
- **Build fails**: Ensure client dependencies are installed

### Common Fixes
- Rebuild: Click "Manual Deploy" → "Clear build cache & deploy"
- Check environment variables are saved
- Verify GitHub repository is up to date
