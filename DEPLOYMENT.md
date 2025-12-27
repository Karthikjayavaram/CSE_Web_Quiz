# Deployment Guide

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
        axios.defaults.baseURL = 'https://quiz-event-backend.onrender.com';
    }
    ```

    > [!IMPORTANT]
    > **Vercel Deployment**: Vercel automatically deploys your latest `main` branch commit. You do NOT need to "button deploy" manually. Just run `git push` and Vercel will detect the changes and rebuild your site in a few minutes.

## 3. Post-Deployment


1.  **Admin Access**:
    *   Go to `https://your-vercel-app.vercel.app/admin`.
    *   It will redirect to Login.
    *   Login with `karthik` / `karthik@123`.
2.  **Upload Students**:
    *   Go to "Manage Students".
    *   Upload the Excel sheet with columns: `techziteId`, `name`, `email`, `phoneNumber`.
