# CSE Web Quiz Platform

A secure, anti-cheating quiz platform built with the MERN stack for college technical events.

## Features

- **Group Authentication**: 3 students log in together using TechZite ID + Phone Number
- **Anti-Cheating**: Full-screen enforcement, tab-switch detection, copy-paste disabled
- **Real-time Monitoring**: Admin dashboard with live violation alerts
- **Violation Tracking**: Flags groups with >2 violations
- **Quiz Management**: Upload questions, track results, export to CSV

## Tech Stack

### Backend
- Node.js + Express
- MongoDB (Atlas)
- Socket.io (real-time)
- TypeScript

### Frontend
- React + Vite
- TypeScript
- Socket.io Client
- Axios

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/Karthikjayavaram/CSE_Web_Quiz.git
cd CSE_Web_Quiz
```

2. **Install dependencies**
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

3. **Configure environment variables**

Create `server/.env`:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret
```

4. **Seed dummy data**
```bash
cd server
npm run seed
```

5. **Run development servers**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

The app will be available at `http://localhost:3000`

## Student Excel Format

When uploading students via Admin Panel, use this format:

| techziteId | name | email | phoneNumber |
|------------|------|-------|-------------|
| TZ2024001 | Alice Smith | alice@techzite.com | 9876543210 |
| TZ2024002 | Bob Johnson | bob@techzite.com | 9876543211 |

**Note**: Uploading new data will replace ALL existing students.

## Deployment

### Backend (Render)

1. Create new Web Service on Render
2. Connect to this GitHub repository
3. Set build command: `cd server && npm install && npm run build`
4. Set start command: `cd server && npm start`
5. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`

### Frontend (Vercel/Netlify)

1. Deploy `client` folder
2. Set environment variable:
   - `VITE_API_URL=your_render_backend_url`
   - `VITE_SOCKET_URL=your_render_backend_url`

## Dummy Test Accounts

Group 1:
- TZ2024001 / 9876543210
- TZ2024002 / 9876543211
- TZ2024003 / 9876543212

Group 2:
- TZ2024004 / 9876543213
- TZ2024005 / 9876543214
- TZ2024006 / 9876543215

## License

MIT
