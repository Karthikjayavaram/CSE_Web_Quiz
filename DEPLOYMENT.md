# Render Deployment Guide

## 1. Backend (Render)

1.  **Create a New Web Service** on [Render](https://dashboard.render.com/).
2.  **Connect your GitHub Repository**.
3.  **Settings**:
    *   **Root Directory**: `server`
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
4.  **Environment Variables**:
    *   `MONGODB_URI`: Your MongoDB Connection String.
    *   `JWT_SECRET`: A strong secret key (e.g., specific to production).
    *   `NODE_ENV`: `production`

## 2. Frontend (Vercel)

1.  **Create a New Project** on [Vercel](https://vercel.com).
2.  **Import your GitHub Repository**.
3.  **Settings**:
    *   **Root Directory**: `client`
    *   **Framework Preset**: `Vite`
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
4.  **Environment Variables**:
    *   Vite requires env variables to start with `VITE_`.
    *   However, since we are using a proxy in `vite.config.ts` for local dev, for production we need to point the API calls to the Render backend.
    *   **ACTION REQUIRED**: In `client/src/main.tsx` or where you set up Axios, you should set a base URL based on environment.
    
    *Update `client/src/App.tsx` or a global config:*
    ```typescript
    import axios from 'axios';
    
    // Set base URL for production
    if (import.meta.env.PROD) {
        axios.defaults.baseURL = 'https://your-render-backend-url.onrender.com';
    }
    ```

## 3. Post-Deployment

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
