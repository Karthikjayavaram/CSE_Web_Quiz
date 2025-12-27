import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import axios from 'axios';

// Set base URL for production - CHANGE THIS URL TO YOUR RENDER BACKEND URL AFTER DEPLOYING
if (import.meta.env.PROD) {
    // You will need to replace this with your actual Render backend URL
    axios.defaults.baseURL = 'https://quiz-event-backend.onrender.com';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
